import { v } from "convex/values";
import { query, internalQuery, internalMutation, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { publicImageUrl } from "./imageUrl";
import { projectsAgg } from "./aggregates";

/* -------------------------------------------------------------------------- */
/*                            Image hydration                                  */
/* -------------------------------------------------------------------------- */

type ImageMap = {
    logo_url: string;
    banner_url: string;
    screenshot_urls: string[];
    sponsor_logos: Map<string, string>; // sponsorKey → url
};

function sponsorKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function loadProjectImages(ctx: QueryCtx, project_uuid: string): Promise<ImageMap> {
    const rows = await ctx.db
        .query("images")
        .withIndex("by_entity", (q) =>
            q.eq("entity", "project").eq("entity_key", project_uuid),
        )
        .collect();
    const out: ImageMap = {
        logo_url: "",
        banner_url: "",
        screenshot_urls: [],
        sponsor_logos: new Map(),
    };
    const screenshots: { idx: number; url: string }[] = [];
    for (const r of rows) {
        const url = publicImageUrl(r.object_key);
        if (r.kind === "logo") out.logo_url = url;
        else if (r.kind === "banner") out.banner_url = url;
        else if (r.kind.startsWith("screenshot-")) {
            const idx = Number(r.kind.slice("screenshot-".length));
            if (Number.isFinite(idx)) screenshots.push({ idx, url });
        }
    }
    screenshots.sort((a, b) => a.idx - b.idx);
    out.screenshot_urls = screenshots.map((s) => s.url);
    return out;
}

// Cache sponsor-logo lookups for the duration of one query. Many projects share
// the same sponsors, so without this a result page issues the same image lookup
// dozens of times.
type SponsorLogoCache = Map<string, Promise<string>>;

async function loadSponsorLogo(
    ctx: QueryCtx,
    orgName: string,
    cache?: SponsorLogoCache,
): Promise<string> {
    const key = sponsorKey(orgName);
    const cached = cache?.get(key);
    if (cached) return cached;
    const promise = (async () => {
        const row = await ctx.db
            .query("images")
            .withIndex("by_entity", (q) =>
                q.eq("entity", "sponsor").eq("entity_key", key),
            )
            .filter((q) => q.eq(q.field("kind"), "logo"))
            .unique();
        return row ? publicImageUrl(row.object_key) : "";
    })();
    cache?.set(key, promise);
    return promise;
}

const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 12;
// Convex caps a single query at 16384 document reads. These bound the index-driven
// result sets so we stay under that ceiling while covering realistic filter sizes.
// (A full-text search query is separately capped by Convex at 1024 hits.)
const MAX_FILTER_RESULTS = 16000;
const SEARCH_INDEX_LIMIT = 1024;
// Force-directed graph is unreadable past a couple thousand nodes; also keeps the
// per-node similarity fan-out under the read ceiling.
const GRAPH_MAX_NODES = 2000;

/**
 * Resolve the set of project uuids that match a prize-type and/or sponsor-org
 * filter, straight from the prize indexes (no project scan). Returns null when
 * neither filter is active. When both are active, a project must satisfy both.
 */
async function resolvePrizeFilterUuids(
    ctx: QueryCtx,
    prize_type?: string[],
    sponsor_organization?: string[],
): Promise<Set<string> | null> {
    let allowed: Set<string> | null = null;
    if (prize_type?.length) {
        const lists = await Promise.all(
            prize_type.map((t) =>
                ctx.db
                    .query("prizes")
                    .withIndex("by_prize_type", (q) => q.eq("prize_type", t))
                    .take(MAX_FILTER_RESULTS),
            ),
        );
        allowed = new Set(lists.flat().map((p) => p.project_uuid));
    }
    if (sponsor_organization?.length) {
        const lists = await Promise.all(
            sponsor_organization.map((o) =>
                ctx.db
                    .query("prizes")
                    .withIndex("by_sponsor_org", (q) => q.eq("sponsor_organization_name", o))
                    .take(MAX_FILTER_RESULTS),
            ),
        );
        const orgUuids = new Set(lists.flat().map((p) => p.project_uuid));
        allowed = allowed ? new Set([...allowed].filter((u) => orgUuids.has(u))) : orgUuids;
    }
    return allowed;
}

async function projectByUuid(ctx: QueryCtx, uuid: string): Promise<Doc<"projects"> | null> {
    return ctx.db
        .query("projects")
        .withIndex("by_uuid", (q) => q.eq("uuid", uuid))
        .unique();
}

type PrizeOut = {
    project_uuid: string;
    name: string;
    pool_prize: string;
    prize_name: string;
    prize_emoji: string;
    prize_type: string;
    sponsor_name: string;
    sponsor_organization_name: string;
    sponsor_organization_square_logo_url: string;
};

type ProjectOut = {
    uuid: string;
    slug: string;
    emoji: string;
    name: string;
    tagline: string;
    description: string;
    how_its_made: string;
    source_code_url: string;
    url: string;
    event_name: string;
    logo_url: string;
    banner_url: string;
    screenshots: string[];
    video_file_url: string;
    video_mux_url: string;
    video_mux_thumbnail_url: string;
    primary_repository_url: string;
    prizes: PrizeOut[];
    score: number;
    highlights: Record<string, unknown>;
};

async function eventName(ctx: QueryCtx, id: Id<"events">): Promise<string> {
    const e = await ctx.db.get(id);
    return e?.name ?? "";
}

async function hydratePrizes(
    ctx: QueryCtx,
    project_uuid: string,
    cache?: SponsorLogoCache,
): Promise<PrizeOut[]> {
    const rows = await ctx.db
        .query("prizes")
        .withIndex("by_project", (q) => q.eq("project_uuid", project_uuid))
        .collect();
    return Promise.all(
        rows.map(async (p) => ({
            project_uuid: p.project_uuid,
            name: p.name,
            pool_prize: p.pool_prize ?? "",
            prize_name: p.prize_name ?? "",
            prize_emoji: p.prize_emoji ?? "",
            prize_type: p.prize_type ?? "",
            sponsor_name: p.sponsor_name ?? "",
            sponsor_organization_name: p.sponsor_organization_name ?? "",
            sponsor_organization_square_logo_url: p.sponsor_organization_name
                ? await loadSponsorLogo(ctx, p.sponsor_organization_name, cache)
                : "",
        })),
    );
}

async function hydrateProject(
    ctx: QueryCtx,
    p: Doc<"projects">,
    score = 0,
    highlights: Record<string, unknown> = {},
    cache?: SponsorLogoCache,
): Promise<ProjectOut> {
    const [images, prizes, event_name] = await Promise.all([
        loadProjectImages(ctx, p.uuid),
        hydratePrizes(ctx, p.uuid, cache),
        eventName(ctx, p.event_id),
    ]);
    return {
        uuid: p.uuid,
        slug: p.slug,
        emoji: p.emoji ?? "",
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        how_its_made: p.how_its_made,
        source_code_url: p.source_code_url ?? "",
        url: p.url ?? "",
        event_name,
        logo_url: images.logo_url,
        banner_url: images.banner_url,
        screenshots: images.screenshot_urls,
        video_file_url: p.video_file_url ?? "",
        video_mux_url: p.video_mux_url ?? "",
        video_mux_thumbnail_url: p.video_mux_thumbnail_url ?? "",
        primary_repository_url: p.primary_repository_url ?? "",
        prizes,
        score,
        highlights,
    };
}

async function resolveEventIds(ctx: QueryCtx, names: string[]): Promise<Id<"events">[]> {
    const ids: Id<"events">[] = [];
    for (const n of names) {
        const e =
            (await ctx.db
                .query("events")
                .withIndex("by_name", (q) => q.eq("name", n))
                .unique()) ??
            (await ctx.db
                .query("events")
                .withIndex("by_slug", (q) => q.eq("slug", n))
                .unique());
        if (e) ids.push(e._id);
    }
    return ids;
}

export const search = query({
    args: {
        query: v.optional(v.string()),
        event_name: v.optional(v.array(v.string())),
        prize_type: v.optional(v.array(v.string())),
        sponsor_organization: v.optional(v.array(v.string())),
        page: v.optional(v.number()),
        page_size: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const page = Math.max(1, args.page ?? 1);
        const page_size = Math.max(1, Math.min(PAGE_SIZE_MAX, args.page_size ?? PAGE_SIZE_DEFAULT));

        const eventIds = args.event_name?.length
            ? await resolveEventIds(ctx, args.event_name)
            : [];
        const eventIdSet = new Set(eventIds.map(String));
        const hasText = !!args.query?.trim();
        const allowed = await resolvePrizeFilterUuids(
            ctx,
            args.prize_type,
            args.sponsor_organization,
        );

        let docs: Doc<"projects">[];
        let total: number;
        const offset = (page - 1) * page_size;

        if (hasText) {
            // Full-text relevance search. Convex returns up to SEARCH_INDEX_LIMIT
            // hits; we filter that ranked set and paginate within it.
            const q = ctx.db.query("projects").withSearchIndex("by_search_text", (sq) => {
                let b = sq.search("search_text", args.query!);
                if (eventIds.length === 1) b = b.eq("event_id", eventIds[0]);
                return b;
            });
            let hits = await q.take(SEARCH_INDEX_LIMIT);
            if (eventIds.length > 1) hits = hits.filter((d) => eventIdSet.has(String(d.event_id)));
            if (allowed) hits = hits.filter((d) => allowed.has(d.uuid));
            total = hits.length;
            docs = hits.slice(offset, offset + page_size);
        } else if (allowed) {
            // Prize/sponsor filter, no text: the matching uuids ARE the result set,
            // spanning every event — not limited to a pre-scanned slice of projects.
            let uuids = [...allowed].sort();
            if (eventIds.length) {
                // Must load to know each project's event; bounded by MAX_FILTER_RESULTS.
                const loaded = (
                    await Promise.all(uuids.slice(0, MAX_FILTER_RESULTS).map((u) => projectByUuid(ctx, u)))
                ).filter((p): p is Doc<"projects"> => p !== null && eventIdSet.has(String(p.event_id)));
                loaded.sort((a, b) => (a.uuid < b.uuid ? -1 : 1));
                total = loaded.length;
                docs = loaded.slice(offset, offset + page_size);
            } else {
                // No event filter → count is just the set size; only load the page.
                total = uuids.length;
                const pageUuids = uuids.slice(offset, offset + page_size);
                docs = (await Promise.all(pageUuids.map((u) => projectByUuid(ctx, u)))).filter(
                    (p): p is Doc<"projects"> => p !== null,
                );
            }
        } else if (eventIds.length) {
            const sets = await Promise.all(
                eventIds.map((ev) =>
                    ctx.db
                        .query("projects")
                        .withIndex("by_event", (q) => q.eq("event_id", ev))
                        .take(MAX_FILTER_RESULTS),
                ),
            );
            const all = sets.flat();
            total = all.length;
            docs = all.slice(offset, offset + page_size);
        } else {
            // Unfiltered browse over the full table. Aggregate gives an exact total
            // and O(log n) offset lookup, so any page is reachable without scanning.
            total = await projectsAgg.count(ctx);
            if (offset >= total) {
                docs = [];
            } else {
                const { key: startTime } = await projectsAgg.at(ctx, offset);
                docs = await ctx.db
                    .query("projects")
                    .withIndex("by_creation_time", (q) => q.gte("_creationTime", startTime))
                    .take(page_size);
            }
        }

        const total_pages = Math.max(1, Math.ceil(total / page_size));
        const sponsorCache: SponsorLogoCache = new Map();
        const results = await Promise.all(
            docs.map((d) => hydrateProject(ctx, d, 0, {}, sponsorCache)),
        );

        return { results, pagination: { page, page_size, total, total_pages } };
    },
});

export const getByUuid = query({
    args: { uuid: v.string() },
    handler: async (ctx, args) => {
        const p = await ctx.db
            .query("projects")
            .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
            .unique();
        if (!p) return null;
        return hydrateProject(ctx, p);
    },
});

export const getSimilar = query({
    args: { uuid: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 12;
        const sims = await ctx.db
            .query("similarities")
            .withIndex("by_project", (q) => q.eq("project_uuid", args.uuid))
            .collect();
        sims.sort((a, b) => b.similarity_score - a.similarity_score);
        const top = sims.slice(0, limit);
        const sponsorCache: SponsorLogoCache = new Map();
        const projects = await Promise.all(
            top.map(async (s) => {
                const p = await ctx.db
                    .query("projects")
                    .withIndex("by_uuid", (q) => q.eq("uuid", s.similar_uuid))
                    .unique();
                return p ? hydrateProject(ctx, p, s.similarity_score, {}, sponsorCache) : null;
            }),
        );
        return projects.filter((p) => p !== null);
    },
});

/** Finalists of the most recent hackathon that already has projects. Powers home page carousel. */
export const getLatestFinalists = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;

        // Pull finalist projects straight from the prize_type index, then load them —
        // no longer scans every project of every event with a prize query per row.
        const finalistPrizes = await ctx.db
            .query("prizes")
            .withIndex("by_prize_type", (q) => q.eq("prize_type", "finalist"))
            .take(MAX_FILTER_RESULTS);
        const finalistUuids = [...new Set(finalistPrizes.map((p) => p.project_uuid))];
        const finalistProjects = (
            await Promise.all(
                finalistUuids.map((u) =>
                    ctx.db
                        .query("projects")
                        .withIndex("by_uuid", (q) => q.eq("uuid", u))
                        .unique(),
                ),
            )
        ).filter((p): p is Doc<"projects"> => p !== null);

        // Group finalists by event so we can return the newest event that has any.
        const byEvent = new Map<string, Doc<"projects">[]>();
        for (const p of finalistProjects) {
            const k = String(p.event_id);
            const list = byEvent.get(k);
            if (list) list.push(p);
            else byEvent.set(k, [p]);
        }

        const events = await ctx.db.query("events").collect();
        const sorted = events
            .filter((e) => e.end_time)
            .sort((a, b) => (b.end_time! > a.end_time! ? 1 : -1));

        for (const ev of sorted) {
            const list = byEvent.get(String(ev._id));
            if (list && list.length) {
                const sponsorCache: SponsorLogoCache = new Map();
                const results = await Promise.all(
                    list.slice(0, limit).map((d) => hydrateProject(ctx, d, 0, {}, sponsorCache)),
                );
                return { event_name: ev.name, results };
            }
        }
        return { event_name: "", results: [] };
    },
});

export const getTypes = query({
    args: {},
    handler: async (ctx) => {
        const [events, prizes] = await Promise.all([
            ctx.db.query("events").collect(),
            ctx.db.query("prizes").collect(),
        ]);
        const event_names = events.map((e) => e.name).sort();
        const types = Array.from(
            new Set(prizes.map((p) => p.prize_type).filter(Boolean) as string[]),
        ).sort();
        const sponsor_organizations = Array.from(
            new Set(
                prizes.map((p) => p.sponsor_organization_name).filter(Boolean) as string[],
            ),
        ).sort();
        return { types, event_names, sponsor_organizations };
    },
});

export const getGraph = query({
    args: {
        query: v.optional(v.string()),
        event_name: v.optional(v.array(v.string())),
        prize_type: v.optional(v.array(v.string())),
        sponsor_organization: v.optional(v.array(v.string())),
        threshold: v.optional(v.number()),
        limit_projects: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const threshold = args.threshold ?? 0.5;
        const cap = Math.min(args.limit_projects ?? GRAPH_MAX_NODES, GRAPH_MAX_NODES);

        // Node set mirrors the same filters as search() — text query, event, and
        // prize/sponsor — so the graph reflects what the user is actually viewing
        // (previously it ignored the query + prize filters and used a random 200).
        const eventIds = args.event_name?.length
            ? await resolveEventIds(ctx, args.event_name)
            : [];
        const eventIdSet = new Set(eventIds.map(String));
        const allowed = await resolvePrizeFilterUuids(
            ctx,
            args.prize_type,
            args.sponsor_organization,
        );
        const hasText = !!args.query?.trim();

        let projects: Doc<"projects">[];
        if (hasText) {
            const q = ctx.db.query("projects").withSearchIndex("by_search_text", (sq) => {
                let b = sq.search("search_text", args.query!);
                if (eventIds.length === 1) b = b.eq("event_id", eventIds[0]);
                return b;
            });
            let hits = await q.take(Math.min(cap, SEARCH_INDEX_LIMIT));
            if (eventIds.length > 1) hits = hits.filter((d) => eventIdSet.has(String(d.event_id)));
            if (allowed) hits = hits.filter((d) => allowed.has(d.uuid));
            projects = hits;
        } else if (allowed) {
            const loaded = (
                await Promise.all([...allowed].slice(0, cap).map((u) => projectByUuid(ctx, u)))
            ).filter((p): p is Doc<"projects"> => p !== null);
            projects = eventIds.length
                ? loaded.filter((d) => eventIdSet.has(String(d.event_id)))
                : loaded;
        } else if (eventIds.length) {
            const sets = await Promise.all(
                eventIds.map((ev) =>
                    ctx.db
                        .query("projects")
                        .withIndex("by_event", (q) => q.eq("event_id", ev))
                        .take(cap),
                ),
            );
            projects = sets.flat().slice(0, cap);
        } else {
            projects = await ctx.db.query("projects").take(cap);
        }

        const uuids = new Set(projects.map((p) => p.uuid));
        const eventCache = new Map<string, string>();
        const nodes: { id: string; name: string; event_name: string }[] = [];
        for (const p of projects) {
            let en = eventCache.get(String(p.event_id));
            if (en === undefined) {
                en = await eventName(ctx, p.event_id);
                eventCache.set(String(p.event_id), en);
            }
            nodes.push({ id: p.uuid, name: p.name, event_name: en });
        }

        const links: { source: string; target: string; similarity_score: number }[] = [];
        const simSets = await Promise.all(
            [...uuids].map((uuid) =>
                ctx.db
                    .query("similarities")
                    .withIndex("by_project", (q) => q.eq("project_uuid", uuid))
                    .collect()
                    .then((sims) => ({ uuid, sims })),
            ),
        );
        for (const { uuid, sims } of simSets) {
            for (const s of sims) {
                if (s.similarity_score < threshold) continue;
                if (!uuids.has(s.similar_uuid)) continue;
                if (uuid < s.similar_uuid) {
                    links.push({
                        source: uuid,
                        target: s.similar_uuid,
                        similarity_score: s.similarity_score,
                    });
                }
            }
        }

        return { nodes, links };
    },
});

/**
 * One cursor page of projects still needing embeddings (embedding_model
 * undefined), via the by_embedding_model index. The feeder walks this with the
 * cursor so each project is enqueued exactly once — no re-querying from the
 * start (which previously re-enqueued in-flight projects and flooded the pool).
 */
export const listForEmbeddingPage = internalQuery({
    args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
    handler: async (ctx, args) => {
        const res = await ctx.db
            .query("projects")
            .withIndex("by_embedding_model", (q) => q.eq("embedding_model", undefined))
            .paginate({ cursor: args.cursor, numItems: args.numItems });
        return {
            page: res.page.map((p) => ({ uuid: p.uuid, search_text: p.search_text })),
            continueCursor: res.continueCursor,
            isDone: res.isDone,
        };
    },
});

/** Mark project as embedded with given model. Called by embedOne after RAG add. */
export const markEmbedded = internalMutation({
    args: { project_uuid: v.string(), model: v.string() },
    handler: async (ctx, args) => {
        const p = await ctx.db
            .query("projects")
            .withIndex("by_uuid", (q) => q.eq("uuid", args.project_uuid))
            .unique();
        if (p) await ctx.db.patch(p._id, { embedding_model: args.model });
    },
});

