import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "https://backend-production-1d3e.up.railway.app/:path*",
			},
		];
	},
};

export default nextConfig;
