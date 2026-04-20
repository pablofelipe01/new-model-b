const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Google Fonts — cache aggressively
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      // Static images
      urlPattern: /\.(png|jpg|jpeg|svg|webp|avif)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // Our API routes — network first with short cache
      urlPattern: /\/api\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
      },
    },
    {
      // Solana RPC — NEVER cache (prices must be real-time)
      urlPattern: /^https:\/\/(api|api-devnet|api-mainnet-beta)\.solana\.com/,
      handler: "NetworkOnly",
    },
    {
      // Helius RPC — also never cache
      urlPattern: /^https:\/\/.*helius-rpc\.com/,
      handler: "NetworkOnly",
    },
    {
      // Everything else — network first with fallback
      urlPattern: /.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
  fallbacks: {
    document: "/offline",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@new-model-b/sdk"],
  webpack: (config, { isServer }) => {
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

module.exports = withPWA(nextConfig);
