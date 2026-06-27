/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates from "../aggregates.js";
import type * as crons from "../crons.js";
import type * as embedAdmin from "../embedAdmin.js";
import type * as embeddings from "../embeddings.js";
import type * as imageUrl from "../imageUrl.js";
import type * as images from "../images.js";
import type * as imagesDb from "../imagesDb.js";
import type * as ingest from "../ingest.js";
import type * as ingestDb from "../ingestDb.js";
import type * as migrations from "../migrations.js";
import type * as projects from "../projects.js";
import type * as s3 from "../s3.js";
import type * as similarity from "../similarity.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aggregates: typeof aggregates;
  crons: typeof crons;
  embedAdmin: typeof embedAdmin;
  embeddings: typeof embeddings;
  imageUrl: typeof imageUrl;
  images: typeof images;
  imagesDb: typeof imagesDb;
  ingest: typeof ingest;
  ingestDb: typeof ingestDb;
  migrations: typeof migrations;
  projects: typeof projects;
  s3: typeof s3;
  similarity: typeof similarity;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  syncPool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"syncPool">;
  embedPoolV2: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"embedPoolV2">;
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  projectsAgg: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"projectsAgg">;
};
