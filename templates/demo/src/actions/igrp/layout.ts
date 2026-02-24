"use server";

import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import type { Session } from "@igrp/framework-next-auth";
import { cookies } from "next/headers";

import { getAccessToken } from "@/lib/auth-helpers";
import { AUTH_CONSTANTS } from "@/lib/constants";
import { isPreviewMode } from "@/lib/utils";

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

export async function configLayout(): Promise<IGRPLayoutConfigArgs> {
  // In preview mode, provide a mock session object to prevent client-side redirects
  // The framework might check for session existence rather than just previewMode
  const session: Session | null = isPreviewMode()
    ? createPreviewSession()
    : ((await getAccessToken()) as Session | null);

  const { activeThemeValue, isScaled } = await getTheme();

  return { session, activeThemeValue, isScaled };
}
