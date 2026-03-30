"use server";

import { cache } from "react";
import { cookies } from "next/headers";
import type { Session } from "@igrp/framework-next-auth";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { getAccessToken } from "@/lib/auth-helpers";
import { AUTH_CONSTANTS } from "@/lib/constants";
import { isPreviewMode } from "@/lib/utils";

/**
 * Reads theme preferences from cookies (active theme, scale mode).
 *
 * @returns Object with activeThemeValue and isScaled flag
 */
export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return { activeThemeValue, isScaled };
}

/**
 * Creates a preview session object for development/demo mode.
 * This session bypasses authentication checks while maintaining type safety.
 */
function createPreviewSession(): Session {
  return {
    user: {
      name: "Preview User",
      email: "preview@example.com",
    },
    accessToken: AUTH_CONSTANTS.PREVIEW_TOKEN,
    expiresAt: Date.now() + AUTH_CONSTANTS.PREVIEW_SESSION_EXPIRY_MS,
    expires: "",
  };
}

/**
 * Builds layout configuration: session, theme, and scale preferences.
 * Uses preview session when IGRP_PREVIEW_MODE is enabled.
 * Cached per request to avoid duplicate work when both root and (igrp) layouts run.
 *
 * @returns Layout config for IGRP framework
 */
export const configLayout = cache(async (): Promise<IGRPLayoutConfigArgs> => {
  const [sessionResult, themeResult] = await Promise.all([
    isPreviewMode()
      ? Promise.resolve(createPreviewSession())
      : getAccessToken(),
    getTheme(),
  ]);
  const session = sessionResult as Session | null;
  const { activeThemeValue, isScaled } = themeResult;
  return { session, activeThemeValue, isScaled };
});
