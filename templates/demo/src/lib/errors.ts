/**
 * Custom error for environment validation failures.
 * Thrown when required env vars are missing or invalid (e.g. in production).
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
  ) {
    super(message);
    this.name = "EnvValidationError";
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}

/**
 * Custom error for authentication-related failures.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/** Re-export logger for backwards compatibility. Prefer importing from @/lib/logger. */
export { type LogLevel, logger } from "./logger";
