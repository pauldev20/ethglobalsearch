import { v } from "convex/values";
import { internalMutation, internalQuery, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { projectsAgg } from "./aggregates";

type EventExtra = Partial<{
    last_synced_at: number;
    last_full_synced_at: number;
    last_list_hash: string;
    start_time: string;
    end_time: string;
    location: string;
    timezone: string;
}>;

async function upsertEvent(
    ctx: MutationCtx,
    slug: string,
    name: string,
    extra: EventExtra = {},
): Promise<Id<"events">> {
    const existing = await ctx.db
        .query("events")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
    if (existing) {
        const patch: Record<string, unknown> = { ...extra };
        if (name && existing.name !== name) patch.name = name;
        if (Object.keys(patch).length) await ctx.db.patch(existing._id, patch);
        return existing._id;
    }
    return ctx.db.insert("events", { slug, name: name || slug, ...extra });
}

export const getEventBySlug = internalQuery({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return ctx.db
            .query("events")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .unique();
    },
});

export const getProjectHash = internalQuery({
    args: { uuid: v.string() },
    handler: async (ctx, args): Promise<{ content_hash?: string } | null> => {
        const p = await ctx.db
            .query("projects")
            .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
            .unique();
        return p ? { content_hash: p.content_hash } : null;
    },
});

export const updateEventSync = internalMutation({
    args: {
        slug: v.string(),
        name: v.optional(v.string()),
        start_time: v.optional(v.string()),
        end_time: v.optional(v.string()),
        location: v.optional(v.string()),
        timezone: v.optional(v.string()),
        list_hash: v.string(),
        is_full: v.boolean(),
        now: v.number(),
    },
    handler: async (ctx, args) => {
        await upsertEvent(ctx, args.slug, args.name ?? args.slug, {
            last_synced_at: args.now,
            last_list_hash: args.list_hash,
            ...(args.is_full ? { last_full_synced_at: args.now } : {}),
            ...(args.start_time ? { start_time: args.start_time } : {}),
            ...(args.end_time ? { end_time: args.end_time } : {}),
            ...(args.location ? { location: args.location } : {}),
            ...(args.timezone ? { timezone: args.timezone } : {}),
        });
    },
});

export const upsertProject = internalMutation({
    args: {
        project: v.any(),
        event_slug: v.string(),
        content_hash: v.string(),
    },
    handler: async (ctx, args): Promise<"unchanged" | "updated" | "inserted"> => {
        const p = args.project;
        const uuid: string = p.uuid;
        const slug: string = p.slug ?? "";
        const event_name: string = p.event?.name ?? args.event_slug;
        const event_id = await upsertEvent(ctx, args.event_slug, event_name);

        const name: string = p.name ?? "";
        const tagline: string = p.tagline ?? "";
        const description: string = p.description ?? "";
        const how_its_made: string = p.howItsMade ?? "";
        const search_text = [name, tagline, description, how_its_made].filter(Boolean).join("\n");

        const existing = await ctx.db
            .query("projects")
            .withIndex("by_uuid", (q) => q.eq("uuid", uuid))
            .unique();

        if (existing && existing.content_hash === args.content_hash) {
            return "unchanged";
        }

        const textChanged = !existing || existing.search_text !== search_text;

        const fields = {
            uuid,
            slug,
            emoji: p.emoji ?? undefined,
            name,
            tagline,
            description,
            how_its_made,
            source_code_url: p.sourceCodeUrl ?? undefined,
            url: p.url ?? undefined,
            event_id,
            video_file_url: p.video?.file?.fullUrl ?? undefined,
            video_mux_url: p.video?.muxUrl ?? undefined,
            video_mux_thumbnail_url: p.video?.muxThumbnailUrl ?? undefined,
            video_youtube_id: p.video?.youtubeId ?? undefined,
            primary_repository_url: p.primaryRepository?.url ?? undefined,
            search_text,
            content_hash: args.content_hash,
        };

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...fields,
                ...(textChanged ? { embedding_model: undefined } : {}),
            });
        } else {
            const id = await ctx.db.insert("projects", fields);
            const doc = await ctx.db.get(id);
            // Keep the count/offset aggregate in sync. Idempotent so a re-run or
            // an overlap with the one-time backfill can't double-count.
            if (doc) await projectsAgg.insertIfDoesNotExist(ctx, doc);
        }

        return existing ? "updated" : "inserted";
    },
});

const toStr = (v: any): string | undefined =>
    v == null ? undefined : typeof v === "string" ? v : String(v);

export const replaceProjectPrizes = internalMutation({
    args: { project_uuid: v.string(), prizes: v.any() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("prizes")
            .withIndex("by_project", (q) => q.eq("project_uuid", args.project_uuid))
            .collect();
        for (const ep of existing) await ctx.db.delete(ep._id);
        for (const prize of args.prizes ?? []) {
            const pd = prize.prize ?? {};
            const sp = pd.sponsor ?? {};
            const org = sp.organization ?? {};
            await ctx.db.insert("prizes", {
                project_uuid: args.project_uuid,
                name: prize.name ?? "",
                pool_prize: toStr(prize.poolPrize),
                prize_name: pd.name ?? undefined,
                prize_emoji: pd.emoji ?? undefined,
                prize_type: pd.type ?? undefined,
                sponsor_name: sp.name ?? undefined,
                sponsor_organization_name: org.name ?? undefined,
            });
        }
    },
});
