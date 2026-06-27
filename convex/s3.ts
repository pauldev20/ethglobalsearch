"use node";

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function config() {
    const ENDPOINT = process.env.S3_ENDPOINT;
    const REGION = process.env.S3_REGION;
    const BUCKET = process.env.S3_BUCKET;
    const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID;
    const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY;
    if (!ENDPOINT || !REGION || !BUCKET || !ACCESS_KEY || !SECRET_KEY) {
        throw new Error(
            "S3 env missing: S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
        );
    }
    return { ENDPOINT, REGION, BUCKET, ACCESS_KEY, SECRET_KEY };
}

function client(): { s3: S3Client; bucket: string } {
    const c = config();
    return {
        s3: new S3Client({
            endpoint: c.ENDPOINT,
            region: c.REGION,
            forcePathStyle: true,
            credentials: { accessKeyId: c.ACCESS_KEY, secretAccessKey: c.SECRET_KEY },
        }),
        bucket: c.BUCKET,
    };
}

export async function putObject(
    key: string,
    body: Uint8Array,
    contentType: string,
): Promise<void> {
    const { s3, bucket } = client();
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000, immutable",
            // Public-read per object: OVH has no bucket policy and bucket ACLs
            // don't propagate, so each object must carry its own ACL to be
            // served unsigned from the public vhost endpoint.
            ACL: "public-read",
        }),
    );
}

export async function deleteObject(key: string): Promise<void> {
    const { s3, bucket } = client();
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (e: any) {
        // 404 on already-gone is fine.
        if (e?.$metadata?.httpStatusCode !== 404) throw e;
    }
}
