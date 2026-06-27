import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    events: defineTable({
        slug: v.string(),
        name: v.string(),
        // TODO: drop v.optional() after running ingest:scheduleSyncAll once to backfill dates.
        start_time: v.optional(v.string()),
        end_time: v.optional(v.string()),
        timezone: v.optional(v.string()),
        location: v.optional(v.string()), // null for online-only events
        last_synced_at: v.optional(v.number()),
        last_full_synced_at: v.optional(v.number()),
        last_list_hash: v.optional(v.string()),
    })
        .index("by_slug", ["slug"])
        .index("by_name", ["name"]),

    projects: defineTable({
        uuid: v.string(),
        slug: v.string(),
        emoji: v.optional(v.string()),
        name: v.string(),
        tagline: v.string(),
        description: v.string(),
        how_its_made: v.string(),
        source_code_url: v.optional(v.string()),
        url: v.optional(v.string()),
        event_id: v.id("events"),
        video_file_url: v.optional(v.string()),
        video_mux_url: v.optional(v.string()),
        video_mux_thumbnail_url: v.optional(v.string()),
        video_youtube_id: v.optional(v.string()),
        primary_repository_url: v.optional(v.string()),
        search_text: v.string(),
        content_hash: v.optional(v.string()),
        embedding_model: v.optional(v.string()),
    })
        .index("by_uuid", ["uuid"])
        .index("by_slug", ["slug"])
        .index("by_event", ["event_id"])
        .index("by_embedding_model", ["embedding_model"])
        .searchIndex("by_search_text", {
            searchField: "search_text",
            filterFields: ["event_id"],
        }),

    prizes: defineTable({
        project_uuid: v.string(),
        name: v.string(),
        pool_prize: v.optional(v.string()),
        prize_name: v.optional(v.string()),
        prize_emoji: v.optional(v.string()),
        prize_type: v.optional(v.string()),
        sponsor_name: v.optional(v.string()),
        sponsor_organization_name: v.optional(v.string()),
    })
        .index("by_project", ["project_uuid"])
        .index("by_prize_type", ["prize_type"])
        .index("by_sponsor_org", ["sponsor_organization_name"]),

    similarities: defineTable({
        project_uuid: v.string(),
        similar_uuid: v.string(),
        similarity_score: v.float64(),
    })
        .index("by_project", ["project_uuid"])
        .index("by_pair", ["project_uuid", "similar_uuid"]),

    /**
     * Images live in OVH S3 (public-read per object). This table maps logical
     * (entity, kind) → object key. The public URL is derived from the key at read
     * time (see convex/imageUrl.ts) — no signing, no expiry.
     *
     * - entity: "project" or "sponsor"
     * - entity_key: project uuid OR sponsor org name
     * - kind: "logo" | "banner" | "screenshot-<N>" | "sponsor-logo"
     * - object_key: S3 key (e.g. "images/<entity>/<entity_key>/<kind>")
     */
    images: defineTable({
        entity: v.string(),
        entity_key: v.string(),
        kind: v.string(),
        object_key: v.string(),
    })
        .index("by_entity", ["entity", "entity_key"])
        .index("by_object_key", ["object_key"]),
});
