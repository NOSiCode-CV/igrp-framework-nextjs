import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPreviewMode(): boolean {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue?.trim()?.replace(/^["']|["']$/g, "")?.toLowerCase();
  return previewModeValue === "true";
}

export function isAuthDisabled(): boolean {
  const rawValue = process.env.AUTH_PROVIDER;
  const providerValue = rawValue?.trim()?.replace(/^["']|["']$/g, "")?.toLowerCase();
  return providerValue === "none";
}

export function isAuthBypass(): boolean {
  return isPreviewMode() || isAuthDisabled();
}
