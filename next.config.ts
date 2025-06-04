import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.externals = {
      ...config.externals,
      '@prisma/client': 'commonjs @prisma/client',
    };
    return config;
  },
};

export default nextConfig;
