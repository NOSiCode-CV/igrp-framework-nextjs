"use client";

// App-level error boundary.
//
// Catches errors thrown by any layout or page below `app/layout.tsx` —
// including `app/(igrp)/layout.tsx`. When auth configuration is broken
// (e.g. AUTH_PROVIDER=autentika), the getSession() / serverSession() calls
// inside that layout throw IGRPAuthConfigError, which surfaces here with a
// readable diagnosis instead of a raw runtime overlay.

import { useEffect } from "react";
import { IGRPSegmentError } from "@igrp/framework-next-ui";

import { logger } from "@/lib/logger";

function resolveErrorCopy(error: Error): { title: string; description: string } | undefined {
  if (error.name === "IGRPAuthConfigError") {
    return {
      title: "Erro de configuração de autenticação",
      description: error.message,
    };
  }
  if (error.name === "EnvValidationError") {
    return {
      title: "Variáveis de ambiente em falta",
      description: error.message,
    };
  }
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[AppError]", error);
  }, [error]);

  return <IGRPSegmentError error={error} reset={reset} resolveCopy={resolveErrorCopy} />;
}
