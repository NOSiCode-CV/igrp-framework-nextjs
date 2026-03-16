/**
 * Input sanitization utilities for security.
 * Use before processing or redirecting user-provided data.
 */

/** Maximum length for redirect URLs and paths */
const MAX_REDIRECT_LENGTH = 2048;

/** Maximum length for general string input */
const MAX_STRING_LENGTH = 10_000;

/** Dangerous protocols that must not appear in URLs */
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * Resolves the login path relative to a base URL.
 * Falls back to "/login" if base URL is invalid.
 *
 * @param baseUrl - Base URL (e.g. NEXTAUTH_URL or "http://localhost:3000")
 * @param path - Login path (default: "/login")
 * @returns Resolved pathname
 */
export function getLoginPath(baseUrl: string, path = "/login"): string {
  try {
    return new URL(path, baseUrl).pathname;
  } catch {
    return "/login";
  }
}

/**
 * Sanitizes a redirect/callback URL to prevent open redirect attacks.
 * Allows only relative paths (/) or same-origin absolute URLs.
 *
 * @param url - User-provided URL (e.g. from searchParams, form)
 * @param baseOrigin - Allowed origin (e.g. from NEXTAUTH_URL)
 * @param fallback - Value to return when invalid (default: "/")
 * @returns Safe path or fallback
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  baseOrigin?: string,
  fallback = "/",
): string {
  if (url == null || typeof url !== "string") return fallback;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REDIRECT_LENGTH) {
    return fallback;
  }

  // Reject dangerous protocols
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  // Allow relative paths (must start with /, no path traversal)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    const path = trimmed.split("?")[0];
    if (path.includes("..")) return fallback; // No path traversal
    return trimmed;
  }

  // Allow same-origin absolute URLs only
  if (baseOrigin) {
    try {
      const parsed = new URL(trimmed);
      const base = new URL(baseOrigin);
      if (
        parsed.origin === base.origin &&
        parsed.protocol === base.protocol &&
        parsed.hostname === base.hostname
      ) {
        return parsed.pathname + parsed.search;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/**
 * Sanitizes a path for redirects. Allows only relative paths starting with /.
 *
 * @param path - User-provided path
 * @param fallback - Value when invalid (default: "/")
 * @returns Safe path or fallback
 */
export function sanitizePath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (path == null || typeof path !== "string") return fallback;

  const trimmed = path.trim();
  if (trimmed.length === 0 || !trimmed.startsWith("/")) return fallback;
  if (trimmed.includes("..")) return fallback; // No path traversal
  if (trimmed.length > MAX_REDIRECT_LENGTH) return fallback;

  return trimmed;
}

/**
 * Sanitizes a string: trims, limits length, removes control characters.
 *
 * @param value - User input
 * @param maxLength - Max length (default: 10000)
 * @returns Sanitized string
 */
export function sanitizeString(
  value: string | null | undefined,
  maxLength = MAX_STRING_LENGTH,
): string {
  if (value == null || typeof value !== "string") return "";

  const trimmed = value.trim();
  const withoutControlChars = [...trimmed]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");
  return withoutControlChars.slice(0, maxLength);
}

/**
 * Escapes HTML special characters to prevent XSS when rendering user content.
 * Use when inserting user input into HTML (e.g. dangerouslySetInnerHTML).
 * React's default text rendering already escapes; use only for raw HTML.
 *
 * @param unsafe - Raw string that may contain HTML
 * @returns HTML-escaped string
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
