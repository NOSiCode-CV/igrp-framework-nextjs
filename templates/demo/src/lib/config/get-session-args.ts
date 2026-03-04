import { cache } from "react";

import { AUTH_CONSTANTS } from "../constants";
import { isPreviewMode } from "../utils";
import { getBasePath } from "./get-base-path";

/**
 * Session refetch args for React Query. Cached per request.
 * Disables refetch in preview mode.
 *
 * @returns Object with refetchInterval, refetchOnWindowFocus, basePath
 */
export const getSessionArgs = cache(function getSessionArgs() {
  if (isPreviewMode()) {
    return {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
    };
  }

  return {
    refetchInterval: AUTH_CONSTANTS.SESSION_REFETCH_INTERVAL_SEC,
    refetchOnWindowFocus: true,
    basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
  };
});
