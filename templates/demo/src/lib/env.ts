import { z } from "zod";

import { EnvValidationError } from "./errors";

/** Optional non-empty string (empty string treated as missing) */
const optionalString = z
  .string()
  .transform((s) => (typeof s === "string" && s.trim() === "" ? undefined : s))
  .optional();

/** Optional URL or empty string */
const optionalUrl = z
  .union([z.url(), z.literal("")])
  .transform((s) => (s === "" ? undefined : s))
  .optional();

/** Preview mode: "true" | "false" (case-insensitive) */
const previewMode = z
  .string()
  .transform((s) => {
    if (typeof s !== "string") return undefined;
    const v = s
      .trim()
      .replace(/^["']|["']$/g, "")
      .toLowerCase();
    return v === "true" || v === "false" ? v : undefined;
  })
  .optional();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),

  // NextAuth
  NEXTAUTH_SECRET: optionalString,
  NEXTAUTH_URL: optionalUrl,
  NEXTAUTH_URL_INTERNAL: optionalUrl,

  // Keycloak
  KEYCLOAK_CLIENT_ID: optionalString,
  KEYCLOAK_CLIENT_SECRET: optionalString,
  KEYCLOAK_ISSUER: optionalUrl,

  // IGRP
  IGRP_ACCESS_MANAGEMENT_API: optionalUrl,
  IGRP_APP_CODE: optionalString,
  IGRP_PREVIEW_MODE: previewMode,
  IGRP_SYNC_ON_CODE_MENUS: optionalString,
  IGRP_SYNC_ACCESS: optionalString,
  IGRP_M2M_SERVICE_ID: optionalString,
  IGRP_M2M_TOKEN: optionalString,

  // Next.js public
  NEXT_IGRP_APP_CENTER_URL: optionalUrl,
  NEXT_PUBLIC_BASE_PATH: optionalString,
  NEXT_PUBLIC_IGRP_APP_HOME_SLUG: optionalString,
  NEXT_PUBLIC_ALLOWED_DOMAINS: optionalString,
  NEXT_PUBLIC_IGRP_PROFILE_URL: optionalUrl,
  NEXT_PUBLIC_IGRP_NOTIFICATION_URL: optionalUrl,
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Validates environment variables at runtime.
 * - In production (when not in preview mode), throws if required vars are missing.
 * - In development or when IGRP_PREVIEW_MODE=true, only parses and returns (no strict requirement).
 * - Result is cached per process; subsequent calls return the same object.
 *
 * Required in production when auth is used: NEXTAUTH_SECRET, KEYCLOAK_CLIENT_ID,
 * KEYCLOAK_CLIENT_SECRET, KEYCLOAK_ISSUER.
 */
export function validateEnv(): Env {
  if (cached !== null) {
    return cached;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues as Array<{
      path: (string | number)[];
      message: string;
    }>;
    const msg = issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new EnvValidationError(
      `Environment validation failed: ${msg}. Check .env and .env.example.`,
      [],
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  const isPreview =
    parsed.data.IGRP_PREVIEW_MODE === "true" ||
    process.env.IGRP_PREVIEW_MODE?.trim?.()
      ?.replace(/^["']|["']$/g, "")
      ?.toLowerCase() === "true";

  if (isProduction && !isPreview) {
    const required: (keyof Env)[] = [
      "NEXTAUTH_SECRET",
      "KEYCLOAK_CLIENT_ID",
      "KEYCLOAK_CLIENT_SECRET",
      "KEYCLOAK_ISSUER",
    ];
    const missing = required.filter((key) => {
      const v = parsed.data[key];
      return v === undefined || (typeof v === "string" && v.trim() === "");
    });
    if (missing.length > 0) {
      throw new EnvValidationError(
        `Missing required environment variables for production: ${missing.join(", ")}. Set IGRP_PREVIEW_MODE=true to skip auth (dev/demo only).`,
        missing,
      );
    }
  }

  cached = parsed.data;
  return cached;
}
