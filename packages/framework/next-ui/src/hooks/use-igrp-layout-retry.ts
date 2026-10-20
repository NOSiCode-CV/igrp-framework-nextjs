'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useIGRPLayoutErrorReset } from '../templates/layout-error-boundary.js';

/**
 * Retry behaviour shared by the layout-level error fallbacks (header, sidebar).
 *
 * A plain `router.refresh()` is not enough: the header/sidebar slots are server
 * components rendered above a client error boundary, and that boundary latches
 * `hasError`. The refreshed tree arrives as new props but the fallback keeps
 * rendering, so the button looks dead.
 *
 * So refresh first, then clear the boundary once the transition settles — by
 * which point the boundary is holding the freshly fetched children. Clearing it
 * any earlier would just re-render the same failing tree and latch again.
 */
function useIGRPLayoutRetry() {
  const router = useRouter();
  const resetBoundary = useIGRPLayoutErrorReset();
  const [isRetrying, startTransition] = useTransition();
  // Set by `retry`, consumed when the transition settles — a ref, so the
  // settle resets the boundary without a second render.
  const resetPending = useRef(false);

  const retry = useCallback(() => {
    resetPending.current = true;
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    if (isRetrying || !resetPending.current) return;

    resetPending.current = false;
    resetBoundary?.();
  }, [isRetrying, resetBoundary]);

  return { retry, isRetrying };
}

export { useIGRPLayoutRetry };
