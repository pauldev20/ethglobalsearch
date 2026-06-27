import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Convex deployment URL (set by `bunx convex dev` / your self-host).
// In dev it's http://127.0.0.1:3210, in prod it's your custom domain.
// Image optimization in Next 16 blocks private IPs, so we disable it whenever
// the URL points at one. For public self-hosted domains, optimization runs.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://127.0.0.1:3210";
const convex = (() => {
    try {
        const u = new URL(convexUrl);
        return {
            protocol: u.protocol.replace(":", "") as "http" | "https",
            hostname: u.hostname,
            port: u.port || undefined,
            isPrivate:
                u.hostname === "127.0.0.1" ||
                u.hostname === "localhost" ||
                u.hostname.startsWith("10.") ||
                u.hostname.startsWith("192.168.") ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(u.hostname),
        };
    } catch {
        return null;
    }
})();

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        // Next 16 blocks private-IP upstreams for image optimization. If
        // Convex is served from a private IP (local dev or self-host on LAN),
        // skip optimization so URLs pass through as plain <img src>.
        unoptimized: isDev || (convex?.isPrivate ?? false),
        remotePatterns: [
            // OVH S3 (public-read images): ethsearch.s3.de.io.cloud.ovh.net
            // ** matches the multi-label bucket.region subdomain.
            { protocol: "https", hostname: "**.io.cloud.ovh.net" },
            ...(convex
                ? [
                      {
                          protocol: convex.protocol,
                          hostname: convex.hostname,
                          ...(convex.port ? { port: convex.port } : {}),
                      },
                  ]
                : []),
        ],
    },
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'supreme-adventure-9g54p6pv93pqwq-3000.app.github.dev',
				'https://ethsearch.pauldev.sh/'
			]
		}
	},
    // Proxy Umami through the app to bypass ad blockers. /stats/script.js +
    // /stats/api/send map to the real Umami host. Pair with data-host-url on
    // the script tag so the tracker posts events to the proxied path.
    async rewrites() {
        const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
        if (!umamiUrl) return [];
        const base = umamiUrl.replace(/\/$/, "");
        return [
            { source: "/stats/script.js", destination: `${base}/script.js` },
            { source: "/stats/api/send", destination: `${base}/api/send` },
        ];
    },
};

export default nextConfig;
