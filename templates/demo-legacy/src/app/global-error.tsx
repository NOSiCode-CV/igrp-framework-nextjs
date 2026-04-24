"use client";

// Root-segment error boundary.
//
// Next.js App Router requires a `global-error.tsx` at the root to catch
// errors thrown while rendering the root `layout.tsx` / `template.tsx` — the
// nearest `error.tsx` boundary cannot catch those because the layout they
// live under is itself the one that failed. `global-error.tsx` replaces the
// *entire* document, so we must ship our own `<html>` / `<body>`.
//
// This file renders `IGRPGlobalError` (the full-page error component) and
// hands logging off to `reportError`, which in prod is the single hook to
// wire a real observability backend into.

import { useEffect } from "react";
import { IGRPGlobalError } from "@igrp/framework-next-ui";

import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { segment: "global" });
  }, [error]);

  // `IGRPGlobalError` renders its own hardcoded copy today. Resolving the
  // copy via `resolveErrorCopy(error)` lets us surface typed-error strings
  // as soon as the framework-next-ui component is updated to accept them.
  void resolveErrorCopy(error);

  return (
    <html lang="pt-PT">
      <body>
        <IGRPGlobalError error={error} reset={reset} />
      </body>
    </html>
  );
}
