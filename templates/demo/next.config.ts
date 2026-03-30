import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Function to parse domains from environment variable
const getRemotePatterns = () => {
  const patterns: Array<{
    protocol: RemotePattern["protocol"];
    hostname: RemotePattern["hostname"];
  }> = [];

  // Add extra domains via env (comma-separated)
  // Ex: NEXT_PUBLIC_ALLOWED_DOMAINS=example.com,cdn.example.com
  const extraDomains =
    process.env.NEXT_PUBLIC_ALLOWED_DOMAINS?.split(",") || [];

  extraDomains.forEach((domain) => {
    const trimmedDomain = domain.trim();
    if (trimmedDomain) {
      patterns.push({
        protocol: "https" as const,
        hostname: trimmedDomain,
      });
    }
  });

  return patterns;
};

const nextConfig: NextConfig = {
  // output: "standalone",
  basePath: basePath,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  typedRoutes: true,
  experimental: {
    typedEnv: true,
    // Tree-shake barrel exports: load only used modules from these packages
    optimizePackageImports: [
      "@igrp/igrp-framework-react-design-system",
      "@igrp/framework-next-ui",
      "@igrp/framework-next",
      "@tanstack/react-query",
    ],
    // CSRF: Server Actions only accept same-origin requests by default.
    // Add allowedOrigins when using a proxy or multiple domains.
    // serverActions: { allowedOrigins: ["localhost:3000", "your-domain.com"] },
  },
};

export default withBundleAnalyzer(nextConfig);
