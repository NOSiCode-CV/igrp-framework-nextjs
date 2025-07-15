import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone',
  basePath: process.env.IGRP_APP_BASE_PATH || '/',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nosi.cv',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};

export default nextConfig;
