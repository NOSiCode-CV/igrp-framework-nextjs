/**
 * CSRF protection for custom forms.
 *
 * NextAuth handles CSRF for auth flows (signin, signout, callback) automatically.
 * Use this utility for custom forms that perform state-changing operations.
 *
 * Implements the double-submit cookie pattern:
 * - Token is stored (hashed) in a cookie and the raw token is rendered in the form
 * - On submit, both are sent; server validates the form token matches the cookie
 */

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generates a CSRF token, sets it in a cookie, and returns it for use in forms.
 * Call this in a Server Component or Server Action before rendering a form.
 *
 * @returns The CSRF token to include in a hidden form field
 */
export async function createCsrfToken(): Promise<string> {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
  const hashed = hashToken(token);

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, hashed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return token;
}

/**
 * Validates a CSRF token from form submission.
 * Compares the submitted token (hashed) with the value in the cookie.
 *
 * @param token - The raw token from the form body (e.g. formData.get("csrf_token"))
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(
  token: string | null,
): Promise<boolean> {
  if (
    !token ||
    typeof token !== "string" ||
    token.length !== CSRF_TOKEN_LENGTH * 2
  ) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const hashed = hashToken(token);
  return hashed === cookieValue;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Form field name for CSRF token - use in hidden inputs */
export const CSRF_FIELD_NAME = "csrf_token";
