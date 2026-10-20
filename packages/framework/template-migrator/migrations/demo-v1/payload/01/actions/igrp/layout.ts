"use server";

import { cookies } from "next/headers";
import { getAccessToken } from "@/lib/auth-helpers";

export async function getTheme() {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("igrp_active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");
  return { activeThemeValue, isScaled };
}

export async function configLayout() {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, "")?.toLowerCase();
  const isPreviewMode = previewModeValue === "true";

  const session = isPreviewMode
    ? ({ user: { name: "Preview User", email: "preview@example.com" }, accessToken: "preview-token", expires: "9999-12-31T23:59:59.999Z" } as any)
    : await getAccessToken();

  const { activeThemeValue, isScaled } = await getTheme();
  return { session, activeThemeValue, isScaled };
}
