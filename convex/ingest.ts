"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { createHash } from "node:crypto";
import { Workpool } from "@convex-dev/workpool";
import { uploadFromUrl } from "./images";

const syncPool = new Workpool(components.syncPool, { maxParallelism: 3 });

const GRAPHQL_URL = "https://api.ethglobal.com/graphql";
const PAGE_SIZE = 500;

const PROJECTS_QUERY = `
query GetPaginatedSubmittedProjects($filters: ProjectFilters!, $pagination: Pagination!) {
  getPaginatedSubmittedProjects(filters: $filters, pagination: $pagination) {
    skip
    items {
      uuid
      slug
      emoji
      name
      tagline
      description
      howItsMade
      sourceCodeUrl
      url
      event { name }
      logo { file { fullUrl } }
      banner { file { fullUrl } }
      screenshots { rank file { fullUrl } }
      video { file { fullUrl } muxUrl muxThumbnailUrl youtubeId }
      primaryRepository { url }
      prizes {
        name
        poolPrize
        prize {
          name
          emoji
          type
          sponsor {
            name
            organization { name squareLogo { fullUrl } }
          }
        }
      }
    }
  }
}`;

const HACKATHONS_QUERY = `
query getPublishedHackathons {
  getPublishedHackathons {
    slug
    name
    startTime
    endTime
    city { name country { name } }
    timezone { name }
  }
}`;

type RawHackathon = {
    slug: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    city?: { name?: string; country?: { name?: string } } | null;
    timezone?: { name?: string } | null;
};

type HackathonMeta = {
    slug: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    timezone?: string;
};

function toLocation(h: RawHackathon): string | undefined {
    const parts = [h.city?.name, h.city?.country?.name].filter(Boolean) as string[];
    return parts.length ? parts.join(", ") : undefined;
}

const BROWSER_HEADERS: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Origin: "https://ethglobal.com",
    Referer: "https://ethglobal.com/",
};

async function gql<T>(body: object): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt++) {
        try {
            const res = await fetch(GRAPHQL_URL, {
                method: "POST",
                headers: BROWSER_HEADERS,
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(`GraphQL ${res.status}: ${(await res.text()).slice(0, 300)}`);
            return ((await res.json()) as { data: T }).data;
        } catch (e) {
            if (attempt === 3) throw e;
            await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
    }
    throw new Error("unreachable");
}

async function fetchHackathons(): Promise<HackathonMeta[]> {
    const data = await gql<{ getPublishedHackathons: RawHackathon[] }>({
        operationName: "getPublishedHackathons",
        query: HACKATHONS_QUERY,
    });
    const main: HackathonMeta[] = data.getPublishedHackathons.map((h) => ({
        slug: h.slug,
        name: h.name,
        startTime: h.startTime,
        endTime: h.endTime,
        location: toLocation(h),
        timezone: h.timezone?.name,
    }));
    // Sub-events of "trifecta" — not exposed by getPublishedHackathons but have projects.
    // Reuse parent trifecta dates/timezone (2025-03-20 to 2025-03-26).
    const trifectaParent = main.find((h) => h.slug === "trifecta");
    const trifectaDates = {
        startTime: trifectaParent?.startTime ?? "2025-03-20T00:00:00.000Z",
        endTime: trifectaParent?.endTime ?? "2025-03-26T00:00:00.000Z",
        timezone: trifectaParent?.timezone ?? "America/New_York",
    };
    const extra: HackathonMeta[] = [
        { slug: "trifecta-tee", name: "ETHGlobal Trifecta - TEE", ...trifectaDates },
        { slug: "trifecta-zk", name: "ETHGlobal Trifecta - ZK", ...trifectaDates },
        { slug: "trifecta-agents", name: "ETHGlobal Trifecta - Agents", ...trifectaDates },
    ];
    return [...main, ...extra];
}

async function fetchProjects(event: string): Promise<any[]> {
    const out: any[] = [];
    let skip = 0;
    while (true) {
        const data = await gql<{
            getPaginatedSubmittedProjects: { items: any[] };
        }>({
            operationName: "GetPaginatedSubmittedProjects",
            variables: { pagination: { skip, take: PAGE_SIZE }, filters: { events: [event] } },
            query: PROJECTS_QUERY,
        });
        const items = data.getPaginatedSubmittedProjects.items;
        out.push(...items);
        if (items.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
    }
    return out;
}

function sha256(s: string): string {
    return createHash("sha256").update(s).digest("hex");
}

function projectContentHash(p: any): string {
    return sha256(
        JSON.stringify({
            name: p.name,
            tagline: p.tagline,
            description: p.description,
            how_its_made: p.howItsMade,
            source_code_url: p.sourceCodeUrl,
            url: p.url,
            logo: p.logo?.file?.fullUrl,
            banner: p.banner?.file?.fullUrl,
            screenshots: (p.screenshots ?? []).map((s: any) => s?.file?.fullUrl),
            video: p.video?.file?.fullUrl ?? p.video?.muxUrl ?? p.video?.youtubeId,
            prizes: (p.prizes ?? []).map((pr: any) => ({
                name: pr.name,
                poolPrize: pr.poolPrize,
                type: pr.prize?.type,
                org: pr.prize?.sponsor?.organization?.name,
                org_logo: pr.prize?.sponsor?.organization?.squareLogo?.fullUrl,
            })),
        }),
    );
}

function listHash(projects: any[]): string {
    return sha256(projects.map((p) => `${p.uuid}:${projectContentHash(p)}`).sort().join("|"));
}

/**
 * Sync a single hackathon. Used by both partial (no images) and full (images) modes.
 * Change detection at two levels:
 *  - List-level hash: skip everything if no project added/removed/changed (and no full re-sync needed).
 *  - Per-project content hash: skip individual unchanged projects.
 */
/** Push one image source URL into S3 + images table. Returns true on success. */
async function ingestImage(
    ctx: any,
    entity: "project" | "sponsor",
    entity_key: string,
    kind: string,
    source_url: string,
): Promise<boolean> {
    const url = await uploadFromUrl(ctx, { entity, entity_key, kind, source_url });
    return url !== null;
}

/** Upload all images for one project + its sponsors. Parallel within the project. */
async function uploadProjectImages(ctx: any, p: any): Promise<void> {
    const uuid: string = p.uuid;
    const screenshots = (p.screenshots ?? [])
        .map((s: any) => s?.file?.fullUrl as string | undefined)
        .filter(Boolean) as string[];

    const orgLogos = new Map<string, string>();
    for (const prize of p.prizes ?? []) {
        const org = prize.prize?.sponsor?.organization;
        if (org?.name && org?.squareLogo?.fullUrl && !orgLogos.has(org.name)) {
            orgLogos.set(org.name, org.squareLogo.fullUrl);
        }
    }

    const tasks: Promise<unknown>[] = [];
    if (p.logo?.file?.fullUrl) tasks.push(ingestImage(ctx, "project", uuid, "logo", p.logo.file.fullUrl));
    if (p.banner?.file?.fullUrl) tasks.push(ingestImage(ctx, "project", uuid, "banner", p.banner.file.fullUrl));
    screenshots.forEach((src, i) => tasks.push(ingestImage(ctx, "project", uuid, `screenshot-${i}`, src)));
    for (const [name, src] of orgLogos) {
        tasks.push(ingestImage(ctx, "sponsor", sponsorKey(name), "logo", src));
    }
    await Promise.all(tasks);
}

/** Lowercase + collapse non-alnum to dashes — deterministic S3-safe key for sponsor orgs. */
function sponsorKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export { sponsorKey };

export const syncHackathon = internalAction({
    args: {
        slug: v.string(),
        fetch_images: v.optional(v.boolean()),
        force_images: v.optional(v.boolean()),
        max_projects: v.optional(v.number()),
        event_name: v.optional(v.string()),
        start_time: v.optional(v.string()),
        end_time: v.optional(v.string()),
        location: v.optional(v.string()),
        timezone: v.optional(v.string()),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ slug: string; total: number; updated: number; inserted: number; skipped: boolean }> => {
        const fetchImages = args.fetch_images ?? false;
        const forceImages = args.force_images ?? false;
        let projects = await fetchProjects(args.slug);
        if (args.max_projects) projects = projects.slice(0, args.max_projects);
        const lhash = listHash(projects);

        const event = await ctx.runQuery(internal.ingestDb.getEventBySlug, { slug: args.slug });
        const eventName = args.event_name ?? projects[0]?.event?.name ?? args.slug;
        const writeMeta = (list_hash: string, is_full: boolean) =>
            ctx.runMutation(internal.ingestDb.updateEventSync, {
                slug: args.slug,
                name: eventName,
                start_time: args.start_time,
                end_time: args.end_time,
                location: args.location,
                timezone: args.timezone,
                list_hash,
                is_full,
                now: Date.now(),
            });

        // Skip work but still refresh metadata for unchanged events.
        // force_images bypasses the unchanged check so missing images get re-uploaded.
        if (
            !forceImages &&
            event &&
            event.last_list_hash === lhash &&
            (!fetchImages || event.last_full_synced_at)
        ) {
            await writeMeta(event.last_list_hash ?? "", false);
            console.log(`[sync] ${args.slug}: unchanged, skip`);
            return { slug: args.slug, total: projects.length, updated: 0, inserted: 0, skipped: true };
        }

        // Per-project content_hash lookup (parallel single-doc reads).
        const HASH_CONCURRENCY = 50;
        const prevHashes = new Map<string, string | undefined>();
        for (let i = 0; i < projects.length; i += HASH_CONCURRENCY) {
            const slice = projects.slice(i, i + HASH_CONCURRENCY);
            const results = await Promise.all(
                slice.map(async (p) => [
                    p.uuid,
                    await ctx.runQuery(internal.ingestDb.getProjectHash, { uuid: p.uuid }),
                ] as const),
            );
            for (const [uuid, r] of results) prevHashes.set(uuid, r?.content_hash);
        }

        const projectHashes = projects.map((p) => ({ p, chash: projectContentHash(p) }));
        const changed = projectHashes.filter(
            ({ p, chash }) => prevHashes.get(p.uuid) !== chash,
        );

        // Upload images. Normally only for changed/new projects; force_images
        // uploads for every project regardless of content_hash (one-shot backfill).
        if (fetchImages) {
            const toUpload = forceImages ? projectHashes : changed;
            const CONCURRENCY = 8;
            for (let i = 0; i < toUpload.length; i += CONCURRENCY) {
                const slice = toUpload.slice(i, i + CONCURRENCY);
                await Promise.all(slice.map(({ p }) => uploadProjectImages(ctx, p)));
            }
        }

        let updated = 0;
        let inserted = 0;
        for (const { p, chash } of projectHashes) {
            const result: "unchanged" | "updated" | "inserted" = await ctx.runMutation(
                internal.ingestDb.upsertProject,
                { project: p, event_slug: args.slug, content_hash: chash },
            );
            if (result !== "unchanged") {
                await ctx.runMutation(internal.ingestDb.replaceProjectPrizes, {
                    project_uuid: p.uuid,
                    prizes: p.prizes ?? [],
                });
            }
            if (result === "updated") updated++;
            if (result === "inserted") inserted++;
        }

        await writeMeta(lhash, fetchImages);

        // Trigger embed pipeline only when sync produced project changes.
        // upsertProject clears embedding_model on text-change, so listForEmbedding sees these.
        if (updated + inserted > 0) {
            await ctx.scheduler.runAfter(0, internal.embeddings.scanAndEnqueue, {});
        }

        console.log(
            `[sync] ${args.slug}: total=${projects.length} updated=${updated} inserted=${inserted} img_uploaded=${fetchImages ? changed.length : 0}`,
        );
        return { slug: args.slug, total: projects.length, updated, inserted, skipped: false };
    },
});

/** Enqueue a sync action per hackathon via Workpool (maxParallelism cap). */
export const scheduleSyncAll = internalAction({
    args: {
        fetch_images: v.optional(v.boolean()),
        force_images: v.optional(v.boolean()),
    },
    handler: async (ctx, args): Promise<{ hackathons: number }> => {
        const fetchImages = args.fetch_images ?? true;
        const forceImages = args.force_images ?? false;
        const hackathons = await fetchHackathons();
        for (const h of hackathons) {
            await syncPool.enqueueAction(
                ctx,
                internal.ingest.syncHackathon,
                {
                    slug: h.slug,
                    fetch_images: fetchImages,
                    force_images: forceImages,
                    event_name: h.name,
                    start_time: h.startTime,
                    end_time: h.endTime,
                    location: h.location,
                    timezone: h.timezone,
                },
                { retry: true },
            );
        }
        return { hackathons: hackathons.length };
    },
});

/** Dev: small synchronous ingest for local debugging. */
export const ingestDev = internalAction({
    args: {
        slugs: v.optional(v.array(v.string())),
        max_projects: v.optional(v.number()),
        download_images: v.optional(v.boolean()),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ hackathons: number; projects: number }> => {
        const fetchImages = args.download_images ?? false;
        const all = await fetchHackathons();
        // Default: 2 most recent dated events (descending by end_time).
        const sortedRecent = [...all]
            .filter((h) => h.endTime)
            .sort((a, b) => (b.endTime! > a.endTime! ? 1 : -1));
        const chosen = args.slugs?.length
            ? all.filter((h) => args.slugs!.includes(h.slug))
            : sortedRecent.slice(0, 2);
        if (!chosen.length) {
            console.log(`[dev] no hackathons matched`);
            return { hackathons: 0, projects: 0 };
        }
        console.log(`[dev] hackathons: ${chosen.map((h) => h.slug).join(", ")}`);

        let total = 0;
        for (const h of chosen) {
            const r = await ctx.runAction(internal.ingest.syncHackathon, {
                slug: h.slug,
                fetch_images: fetchImages,
                max_projects: args.max_projects, // undefined = whole hackathon
                event_name: h.name,
                start_time: h.startTime,
                end_time: h.endTime,
                location: h.location,
                timezone: h.timezone,
            });
            total += r.total;
        }
        return { hackathons: chosen.length, projects: total };
    },
});
