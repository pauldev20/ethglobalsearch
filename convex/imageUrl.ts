/**
 * Build the public OVH S3 URL for an image object key.
 *
 * Objects are stored public-read (per-object ACL), so the URL is permanent and
 * needs no signing — served straight from the bucket's virtual-hosted endpoint.
 * Pure string builder: safe to call from V8 queries and "use node" actions alike.
 *
 * S3_PUBLIC_BASE = vhost bucket endpoint, no trailing slash
 *   e.g. https://ethsearch.s3.de.io.cloud.ovh.net
 */
export function publicImageUrl(objectKey: string): string {
    const base = process.env.S3_PUBLIC_BASE;
    if (!base) throw new Error("S3_PUBLIC_BASE env missing");
    return `${base}/${objectKey}`;
}
