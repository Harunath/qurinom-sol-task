const nextConfig = {
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

module.exports = nextConfig;
