import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";

/**
 * Aggregate over the projects table keyed by _creationTime. Gives O(log n)
 * total count and offset lookup (`at`) so unfiltered browse can paginate the
 * full ~20k-row table without scanning it (Convex caps a query at 16384 reads).
 *
 * Projects are insert-only in this codebase, so the only write hook needed is
 * on insert (see convex/ingestDb.ts). Patches don't change _creationTime.
 */
export const projectsAgg = new TableAggregate<{
    Key: number;
    DataModel: DataModel;
    TableName: "projects";
}>(components.projectsAgg, {
    sortKey: (doc) => doc._creationTime,
});
