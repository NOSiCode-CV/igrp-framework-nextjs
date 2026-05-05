"use client";

// Root-segment error boundary.
//
// Next.js App Router requires a `global-error.tsx` at the root to catch errors
// thrown while rendering the root `layout.tsx` / `template.tsx` — the nearest
// `error.tsx` boundary cannot catch those because the layout it lives under is
// itself the one that failed. `global-error.tsx` replaces the *entire* document,
// so we must ship our own <html> / <body>.

import { useEffect } from "react";
import { IGRPGlobalError } from "@igrp/framework-next-ui";

import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[GlobalError] Uncaught root layout error", error);
  }, [error]);

  return (
    <html lang="pt-PT">
      <body>
        <IGRPGlobalError error={error} reset={reset} />
      </body>
    </html>
  );
}
