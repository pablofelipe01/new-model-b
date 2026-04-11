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
    // pino-pretty is an optional dep of pino (pulled in by
    // @walletconnect/logger). It doesn't ship a browser bundle, and
    // locally Next.js only warns, but on Vercel the missing module
    // becomes a hard build error. Marking it as external lets webpack
    // skip it without failing.
    if (isServer) {
      config.externals = [...(config.externals || []), "pino-pretty"];
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pino-pretty": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
