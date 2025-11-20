import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

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
  // typedRoutes: true,
  // experimental: {
  //   typedEnv: true,
  // },
};

export default nextConfig;
