import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 transpilePackages: ['@igrp/framework-next'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
