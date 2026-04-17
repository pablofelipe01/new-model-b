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
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
      };
    }
    if (isServer) {
      config.externals = [...(config.externals || []), "pino-pretty"];
    }
    return config;
  },
};

module.exports = nextConfig;
