import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "picsum.photos",
			},
			{
				protocol: "https",
				hostname: "i.pinimg.com",
			},
		],
		// or simpler:
		// domains: ["picsum.photos"],
	},
};

export default nextConfig;
