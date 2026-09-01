import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");

const turbopackRoot = existsSync(path.join(monorepoRoot, "pnpm-workspace.yaml"))
  ? monorepoRoot
  : appDir;

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

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
      patterns.push(
        { protocol: "https" as const, hostname: trimmedDomain },
        { protocol: "http" as const, hostname: trimmedDomain },
      );
    }
  });

  return patterns;
};

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: basePath,
  images: {
    remotePatterns: getRemotePatterns(),
  },
  typedRoutes: true,
  turbopack: {
    root: turbopackRoot,
  },
  experimental: {
    authInterrupts: true,
    typedEnv: true,
    browserDebugInfoInTerminal: {
      depthLimit: 5,
      edgeLimit: 1000,
    },
    optimizePackageImports: [
      "@igrp/igrp-framework-react-design-system",
      "@igrp/framework-next-ui",
      "@igrp/framework-next",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
