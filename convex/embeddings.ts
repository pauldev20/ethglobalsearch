"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { Workpool } from "@convex-dev/workpool";
import { RAG } from "@convex-dev/rag";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embedMany } from "ai";
import { createHash } from "node:crypto";

const MODEL = process.env.EMBEDDINGS_MODEL || "openai/text-embedding-3-small";
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDINGS_DIM || 1536);
const TOP_K = 10;
const NAMESPACE = "projects";
// Projects embedded per workpool job. One batched embedMany() call covers the
// whole batch (the embeddings endpoint takes arrays), so the dominant per-project
// cost — an HTTP round-trip — is paid once per BATCH_SIZE projects, not per project.
const BATCH_SIZE = 50;

const openrouter = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    headers: {
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://ethsearch.local",
        "X-Title": "ETHSearch",
    },
});

const embedModel = openrouter.textEmbeddingModel(MODEL);

const rag = new RAG(components.rag, {
    textEmbeddingModel: embedModel,
    embeddingDimension: EMBEDDING_DIMENSION,
});

// Each job now batches BATCH_SIZE projects, so fewer jobs run wider work. 8 keeps
// concurrent load on the RAG component (and OpenRouter) sane while saturating it.
const embedPool = new Workpool(components.embedPoolV2, { maxParallelism: 8 });

function sha256Hex(text: string): string {
    return createHash("sha256").update(text).digest("hex");
}

/**
 * Enqueue embed jobs for projects missing/stale embeddings.
 * Self-rearms via scheduler when full batch returned (more pending).
 * Invoked by syncHackathon when a sync produced changes.
 */
export const scanAndEnqueue = internalAction({
    args: { cursor: v.optional(v.union(v.string(), v.null())) },
    handler: async (ctx, args): Promise<number> => {
        // Walk the unembedded set ONCE via cursor, enqueuing BATCH_SIZE-sized jobs.
        // Each project is enqueued exactly once — the pool queue fills to the
        // backlog size then drains at maxParallelism, no flood-vs-drain runaway.
        const { page, continueCursor, isDone } = await ctx.runQuery(
            internal.projects.listForEmbeddingPage,
            { cursor: args.cursor ?? null, numItems: 500 },
        );
        const valid = page.filter((r) => r.search_text?.trim());
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const items = valid
                .slice(i, i + BATCH_SIZE)
                .map((r) => ({ project_uuid: r.uuid, search_text: r.search_text }));
            await embedPool.enqueueAction(ctx, internal.embeddings.embedBatch, { items }, { retry: true });
        }
        if (!isDone) {
            await ctx.scheduler.runAfter(0, internal.embeddings.scanAndEnqueue, {
                cursor: continueCursor,
            });
        }
        return page.length;
    },
});

/**
 * Embed a batch of projects: one batched embedMany() call for the whole batch,
 * then store each chunk + vector-search its top-K neighbors + replace similarities.
 * Add phase fully completes before the search phase so within-batch projects can
 * surface as each other's neighbors.
 */
export const embedBatch = internalAction({
    args: {
        items: v.array(v.object({ project_uuid: v.string(), search_text: v.string() })),
    },
    handler: async (ctx, args): Promise<void> => {
        if (args.items.length === 0) return;

        // Single API round-trip for the whole batch (auto-split by the SDK if needed).
        const { embeddings } = await embedMany({
            model: embedModel,
            values: args.items.map((it) => it.search_text),
        });

        // Phase 1: store every chunk with its precomputed embedding.
        await Promise.all(
            args.items.map((it, idx) =>
                rag.add(ctx, {
                    namespace: NAMESPACE,
                    key: it.project_uuid,
                    chunks: [{ text: it.search_text, embedding: embeddings[idx] }],
                    contentHash: sha256Hex(it.search_text),
                }),
            ),
        );

        // Phase 2: neighbor search (reuses the vectors) + write results per project.
        await Promise.all(
            args.items.map(async (it, idx) => {
                const { results, entries } = await rag.search(ctx, {
                    namespace: NAMESPACE,
                    query: embeddings[idx],
                    limit: TOP_K + 1,
                });

                const keyByEntry = new Map(entries.map((e) => [e.entryId, e.key ?? null]));
                const simItems: { similar_uuid: string; similarity_score: number }[] = [];
                const seen = new Set<string>();
                for (const r of results) {
                    const uuid = keyByEntry.get(r.entryId);
                    if (!uuid || uuid === it.project_uuid || seen.has(uuid)) continue;
                    seen.add(uuid);
                    simItems.push({ similar_uuid: uuid, similarity_score: r.score });
                    if (simItems.length >= TOP_K) break;
                }

                await ctx.runMutation(internal.similarity.writeSimilarities, {
                    project_uuid: it.project_uuid,
                    items: simItems,
                });
                await ctx.runMutation(internal.projects.markEmbedded, {
                    project_uuid: it.project_uuid,
                    model: MODEL,
                });
            }),
        );
    },
});

/** Manual: re-embed everything. Triggers migrations to clear state, worker re-fills. */
export const reembedAll = internalAction({
    args: {},
    handler: async (ctx): Promise<void> => {
        await ctx.runMutation(internal.migrations.runReembedAll, {});
    },
});

/**
 * Force-stop ALL embedding work: cancel the self-rescheduling feeders first
 * (so nothing re-enqueues), then drain the pool. After this returns, purge any
 * remaining pending work with the CLI (the component's danger:clearPending is
 * not exposed on the typed app API):
 *   npx convex run --component embedPool danger:clearPending '{"before":9999999999999}'
 */
export const haltEmbedding = internalAction({
    args: {},
    handler: async (ctx): Promise<{ feedersCancelled: number }> => {
        const feedersCancelled = await ctx.runMutation(internal.embedAdmin.cancelEmbedFeeders, {});
        await embedPool.cancelAll(ctx, { limit: 100000 });
        return { feedersCancelled };
    },
});

/** Cancel every pending/in-flight embed job. Use to halt a runaway scan. */
export const cancelAllEmbedJobs = internalAction({
    args: {},
    handler: async (ctx): Promise<void> => {
        await embedPool.cancelAll(ctx, { limit: 100000 });
    },
});
