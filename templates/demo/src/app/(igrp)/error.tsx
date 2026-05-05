"use client";

// Segment-level error boundary for the `(igrp)` route group.
//
// Rendered *inside* `(igrp)/layout.tsx`, so the header + sidebar chrome stays
// visible. Use `IGRPSegmentError` (not `IGRPGlobalError`) to fit that slot.
// Errors thrown by `(igrp)/layout.tsx` itself propagate higher — `app/error.tsx`
// or `app/global-error.tsx` catches those.

import { useEffect } from "react";
import { IGRPSegmentError } from "@igrp/framework-next-ui";

import { logger } from "@/lib/logger";

export default function IgrpSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("[IgrpSegmentError]", error);
  }, [error]);

  return <IGRPSegmentError error={error} reset={reset} />;
}
