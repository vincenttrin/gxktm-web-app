import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Add this 'webpack' section:
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,   // Check for changes every second
      aggregateTimeout: 300, // Delay before rebuilding
    };
    return config;
  },
};

export default nextConfig;