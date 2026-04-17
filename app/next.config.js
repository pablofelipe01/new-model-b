/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@new-model-b/sdk"],
  webpack: (config, { isServer }) => {
    // Solana wallet adapters expect Buffer / process polyfills in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    // Privy pulls in @solana/kit and @solana-program/* for features we
    // don't use (funding flows). These packages have version mismatches
    // that cause import errors. Alias them to false so webpack skips
    // them — our Anchor SDK uses @solana/web3.js v1 directly.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
        "@solana/kit": false,
        "@solana-program/token": false,
        "@solana-program/memo": false,
        "@solana-program/system": false,
      };
    }
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "pino-pretty",
        "@solana/kit",
        "@solana-program/token",
        "@solana-program/memo",
        "@solana-program/system",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
