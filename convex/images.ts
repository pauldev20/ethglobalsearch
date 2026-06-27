"use node";

import { internal } from "./_generated/api";
import { putObject, deleteObject } from "./s3";
import { publicImageUrl } from "./imageUrl";

const IMAGE_HEADERS: Record<string, string> = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    Referer: "https://ethglobal.com/",
};

/**
 * Fetch from source URL, upload to OVH (public-read) at a deterministic key, and
 * record the key in the images table. Returns the public URL or null on failure.
 *
 * Plain async function (not an action) so callers from "use node" code can
 * invoke it without spawning child actions — avoids the 64 concurrent-actions cap.
 */
export async function uploadFromUrl(
    ctx: { runMutation: any },
    args: { entity: string; entity_key: string; kind: string; source_url: string },
): Promise<string | null> {
    const objectKey = `images/${args.entity}/${args.entity_key}/${args.kind}`;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(args.source_url, { headers: IMAGE_HEADERS });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const buf = new Uint8Array(await res.arrayBuffer());
            const contentType = res.headers.get("content-type") ?? "application/octet-stream";
            await putObject(objectKey, buf, contentType);
            await ctx.runMutation(internal.imagesDb.upsertImage, {
                entity: args.entity,
                entity_key: args.entity_key,
                kind: args.kind,
                object_key: objectKey,
            });
            return publicImageUrl(objectKey);
        } catch (e: any) {
            if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
                continue;
            }
            console.error(`uploadFromUrl ${args.source_url}: ${e?.message ?? e}`);
            return null;
        }
    }
    return null;
}

/** Delete all images for an entity from S3 + DB. Callable from any node action. */
export async function deleteEntityImages(
    ctx: { runMutation: any },
    args: { entity: string; entity_key: string },
): Promise<void> {
    const keys: string[] = await ctx.runMutation(internal.imagesDb.deleteImagesByEntity, args);
    await Promise.all(keys.map((k) => deleteObject(k)));
}
