import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const upsertImage = internalMutation({
    args: {
        entity: v.string(),
        entity_key: v.string(),
        kind: v.string(),
        object_key: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("images")
            .withIndex("by_object_key", (q) => q.eq("object_key", args.object_key))
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, {
                entity: args.entity,
                entity_key: args.entity_key,
                kind: args.kind,
            });
        } else {
            await ctx.db.insert("images", args);
        }
    },
});

export const deleteImagesByEntity = internalMutation({
    args: { entity: v.string(), entity_key: v.string() },
    handler: async (ctx, args): Promise<string[]> => {
        const rows = await ctx.db
            .query("images")
            .withIndex("by_entity", (q) =>
                q.eq("entity", args.entity).eq("entity_key", args.entity_key),
            )
            .collect();
        const keys = rows.map((r) => r.object_key);
        for (const r of rows) await ctx.db.delete(r._id);
        return keys;
    },
});
