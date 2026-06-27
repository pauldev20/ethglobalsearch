import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Replace all similarity rows for a project. Called by the embed worker after vectorSearch. */
export const writeSimilarities = internalMutation({
    args: {
        project_uuid: v.string(),
        items: v.array(v.object({
            similar_uuid: v.string(),
            similarity_score: v.float64(),
        })),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("similarities")
            .withIndex("by_project", (q) => q.eq("project_uuid", args.project_uuid))
            .collect();
        await Promise.all(existing.map((e) => ctx.db.delete(e._id)));
        await Promise.all(
            args.items.map((it) =>
                ctx.db.insert("similarities", {
                    project_uuid: args.project_uuid,
                    similar_uuid: it.similar_uuid,
                    similarity_score: it.similarity_score,
                }),
            ),
        );
    },
});
