import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone',
  basePath: '/apps/contribuicoes',
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
