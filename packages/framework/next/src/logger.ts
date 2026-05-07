// ─────────────────────────────────────────────────────────────────────────────
// Minimal server-side logger for the IGRP framework and templates.
//
// Consistent `[Error]` / `[Warn]` / `[Info]` prefixes for server components,
// server actions, and framework internals. In development the full stack is
// printed; in production only a concise summary.
//
// Replace the console.* calls here (or wrap this with a real observability
// client — Sentry, OpenTelemetry, etc.) to upgrade all call sites at once.
//
// Import via: `@igrp/framework-next/logger`
// ─────────────────────────────────────────────────────────────────────────────

export const logger = {
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const details = error instanceof Error ? error.message : error != null ? String(error) : '';
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.error(`[Error] ${message}${details ? `: ${details}` : ''}${extra}`);
    if (error instanceof Error && error.stack && process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`[Warn] ${message}${extra}`);
  },

  info(message: string, meta?: Record<string, unknown>): void {
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    console.info(`[Info] ${message}${extra}`);
  },
};
