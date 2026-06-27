import { internalMutation } from "./_generated/server";

/**
 * Cancel every pending scanAndEnqueue feeder. The feeder self-reschedules each
 * tick, so cancelling pool work alone never stops it — it just refills the pool.
 * Lives outside the "use node" embeddings.ts because mutations can't be defined
 * in Node actions. Returns how many scheduled feeders were cancelled.
 */
export const cancelEmbedFeeders = internalMutation({
    args: {},
    handler: async (ctx): Promise<number> => {
        const scheduled = await ctx.db.system.query("_scheduled_functions").collect();
        let n = 0;
        for (const s of scheduled) {
            if (s.name.includes("scanAndEnqueue") && s.state.kind === "pending") {
                await ctx.scheduler.cancel(s._id);
                n++;
            }
        }
        return n;
    },
});
