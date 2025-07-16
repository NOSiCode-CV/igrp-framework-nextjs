import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone',

  // use this if you are using a custom domain for igrp-ui or apps-center
  // basePath: "/apps/appslug",
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
