import { defineApp } from "convex/server";
import workpool from "@convex-dev/workpool/convex.config";
import rag from "@convex-dev/rag/convex.config";
import migrations from "@convex-dev/migrations/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";

const app = defineApp();
app.use(workpool, { name: "syncPool" });
// embedPoolV2 replaces "embedPool": deploying with the old name removed uninstalls
// that component, atomically dropping its work queue and stopping its worker loop.
// Used to discard a poisoned queue (stale jobs from a function rename + a runaway
// feeder) that could not be drained in place while the worker loop was live.
app.use(workpool, { name: "embedPoolV2" });
app.use(rag);
app.use(migrations);
// Counts + offset pagination over the ~20k-row projects table in O(log n).
app.use(aggregate, { name: "projectsAgg" });

export default app;
