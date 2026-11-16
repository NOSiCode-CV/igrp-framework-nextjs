import { isAuthBypass } from "../utilities";
import { getBasePath } from "./get-base-path";

// Adaptive refresh is owned by IGRPSessionWatcher, which schedules a session
// update from session.expiresAt and reschedules on every rotation. It also
// refreshes on tab return once the session is over 60s old, so next-auth's own
// unthrottled refetchOnWindowFocus stays off.
// This interval is a last-resort backstop only (e.g. suspended laptop waking
// with a stale session that IGRPSessionWatcher's timer never fired for).
const FALLBACK_REFETCH_INTERVAL_SECONDS = 600;

/**
 * Session args for the client `SessionProvider`.
 *
 * Adaptive refresh is handled by `IGRPSessionWatcher` (derives timing from
 * `session.expiresAt`), not by the `refetchInterval` here. The fixed interval
 * is a last-resort backstop; the watcher also covers tab-return recovery.
 */
export function getSessionArgs() {
  if (isAuthBypass()) {
    return {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
    };
  }

  return {
    refetchInterval: FALLBACK_REFETCH_INTERVAL_SECONDS,
    refetchOnWindowFocus: false,
    basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
  };
}
