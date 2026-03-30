/**
 * Structured logger for consistent logging across the application.
 * Use instead of console.log/warn/error for uniform prefixes and metadata.
 */
export type LogLevel = "info" | "warn" | "error" | "debug";

export const logger = {
  /** Logs an info message with optional metadata. */
  info(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : "";
    console.log(`[INFO] ${message}${extra}`);
  },

  /** Logs a warning with optional metadata. */
  warn(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : "";
    console.warn(`[WARN] ${message}${extra}`);
  },

  /** Logs an error with optional error object and metadata. */
  error(
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
  ): void {
    const payload: Record<string, unknown> = {
      ...(error instanceof Error
        ? { error: error.message, stack: error.stack }
        : error != null
          ? { error: String(error) }
          : {}),
      ...meta,
    };
    console.error(
      `[ERROR] ${message}`,
      Object.keys(payload).length > 0 ? payload : "",
    );
  },

  /** Logs a debug message (development only) with optional metadata. */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      const extra = meta ? ` ${JSON.stringify(meta)}` : "";
      console.debug(`[DEBUG] ${message}${extra}`);
    }
  },
};
