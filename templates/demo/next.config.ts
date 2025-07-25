import { NextConfig } from 'next';

// use this if you are using a custom domain for igrp-applications-center
const basePath = process.env.IGRP_APP_BASE_PATH || '';

const nextConfig: NextConfig = {
  // uncomment this line when you build this build,
  // output: 'standalone',

  // use this if you are using a custom domain for igrp-applications-center
  basePath: basePath,

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
