import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if preview mode is enabled from environment variable.
 * Handles whitespace, case sensitivity, and quotes.
 */
export function isPreviewMode(): boolean {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  return previewModeValue === "true";
}

/**
 * Checks if authentication is disabled at the provider level (AUTH_PROVIDER=none).
 * Handles whitespace, case sensitivity, and quotes.
 */
export function isAuthDisabled(): boolean {
  const rawValue = process.env.AUTH_PROVIDER;
  const providerValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  return providerValue === "none";
}

/**
 * Returns true when the UI should bypass the auth flow entirely — either
 * because preview mode is on, or because AUTH_PROVIDER=none.
 *
 * Call sites use this single predicate wherever they previously checked
 * `isPreviewMode()` alone, so `AUTH_PROVIDER=none` gets the same UX path as
 * preview mode: no redirect to /login, /login itself routes back to /,
 * mock session in the layout, /api/auth/* blocked at the middleware.
 */
export function isAuthBypass(): boolean {
  return isPreviewMode() || isAuthDisabled();
}
