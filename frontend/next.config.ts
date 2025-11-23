import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.cloudflarestorage.com",
            },
        ],
    },
    async rewrites() {
        if (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL) {
            return [
                {
                    source: "/script.js",
                    destination: `${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`,
                },
                {
                    source: "/api/send",
                    destination: `${process.env.NEXT_PUBLIC_UMAMI_URL}/api/send`,
                },
            ];
        }
        return [];
    },
};

export default nextConfig;
