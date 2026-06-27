import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import { projectsAgg } from "./aggregates";

export const migrations = new Migrations<DataModel>(components.migrations);

/**
 * One-time: populate the projects count/offset aggregate from existing rows.
 * Run once after deploy:  npx convex run migrations:runBackfillProjectsAgg
 * Idempotent — safe to re-run.
 */
export const backfillProjectsAgg = migrations.define({
    table: "projects",
    migrateOne: async (ctx, doc) => {
        await projectsAgg.insertIfDoesNotExist(ctx, doc);
    },
});

export const runBackfillProjectsAgg = migrations.runner(
    internal.migrations.backfillProjectsAgg,
);

/** Clear embedding_model on every project. Worker re-embeds on next tick. */
export const clearEmbeddingModel = migrations.define({
    table: "projects",
    migrateOne: async (ctx, doc) => {
        if (doc.embedding_model !== undefined) {
            await ctx.db.patch(doc._id, { embedding_model: undefined });
        }
    },
});

/** Delete every similarity row. Worker repopulates per project after re-embed. */
export const clearSimilarities = migrations.define({
    table: "similarities",
    migrateOne: async (ctx, doc) => {
        await ctx.db.delete(doc._id);
    },
});


/** Programmatic launcher: queues both migrations. Use via reembedAll. */
export const runReembedAll = internalMutation({
    args: {},
    handler: async (ctx) => {
        await migrations.runSerially(ctx, [
            internal.migrations.clearSimilarities,
            internal.migrations.clearEmbeddingModel,
        ]);
    },
});

