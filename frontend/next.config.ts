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
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'supreme-adventure-9g54p6pv93pqwq-3000.app.github.dev',
				'https://ethsearch.pauldev.sh/'
			]
		}
	}
};

export default nextConfig;
