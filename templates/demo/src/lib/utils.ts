import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names with clsx, resolving conflicts.
 *
 * @param inputs - Class values (strings, objects, arrays)
 * @returns Merged class string
 */
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
 * Removes empty string values from process.env to avoid "Invalid URL" errors.
 *
 * @param key - Environment variable name to unset if empty
 */
export function unsetEmptyEnv(key: string) {
  const value = process.env[key];
  if (typeof value === "string" && value.trim() === "") {
    delete process.env[key];
  }
}
