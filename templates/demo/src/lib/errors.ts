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

/**
 * Simple logger for consistent error/warn/info prefixes across the app.
 */
export const logger = {
  error(
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    const details =
      error instanceof Error
        ? error.message
        : error != null
          ? String(error)
          : "";
    const extra = meta ? ` ${JSON.stringify(meta)}` : "";
    console.error(`[Error] ${message}${details ? `: ${details}` : ""}${extra}`);
    if (
      error instanceof Error &&
      error.stack &&
      process.env.NODE_ENV === "development"
    ) {
      console.error(error.stack);
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : "";
    console.warn(`[Warn] ${message}${extra}`);
  },

  info(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : "";
    console.info(`[Info] ${message}${extra}`);
  },
};
