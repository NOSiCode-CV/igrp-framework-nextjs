// ─────────────────────────────────────────────────────────────────────────────
// AppError — server-component error that passes a user-friendly message to
// the client through React's `digest` field, bypassing Next.js production
// sanitization of `error.message`.
//
// When to use which error type:
//   • `IgrpError` subclasses (from `@igrp/framework-next/errors`) — framework
//     internals and any failure that has a stable machine code registered in
//     the app's `COPY_BY_CODE` map. Preferred for classifiable, repeatable
//     failures.
//   • `AppError` (this file) — ad-hoc server errors where the message is
//     constructed at throw time and there is no pre-registered code. The
//     public message survives production sanitization via `digest`.
//
// Usage (server component / server action):
//   import { AppError } from '@igrp/framework-next/app-error';
//   throw new AppError({
//     internalMessage: 'fetchUserProfile failed: status 503',
//     publicMessage: 'Não foi possível carregar o seu perfil.',
//   });
//
// Usage (error boundary resolver):
//   import { parsePublicDigest } from '@igrp/framework-next/app-error';
//   const { message } = parsePublicDigest(error.digest);
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from './logger';

/**
 * Delimiter used in digest to pass user-friendly messages through production
 * sanitization. React leaves `digest` untouched; `error.message` is
 * sanitized in production builds.
 */
export const PUBLIC_ERROR_DELIMITER = '|';

export type PublicErrorId = `${number}-${string}`;
export type PublicErrorMessage = `${PublicErrorId}${typeof PUBLIC_ERROR_DELIMITER}${string}`;

function generateErrorId(): PublicErrorId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}` as PublicErrorId;
}

/**
 * Parses `error.digest` to extract the correlation id and user message.
 *
 * Returns `{ errorId: null, message: null }` for any digest that was NOT set
 * by `AppError` (i.e. does not contain `PUBLIC_ERROR_DELIMITER`).
 */
export function parsePublicDigest(digest: string | undefined): {
  errorId: string | null;
  message: string | null;
} {
  if (!digest?.includes(PUBLIC_ERROR_DELIMITER)) {
    return { errorId: null, message: null };
  }
  const idx = digest.indexOf(PUBLIC_ERROR_DELIMITER);
  const errorId = digest.slice(0, idx).trim() || null;
  const message = digest.slice(idx + 1).trim() || null;
  return { errorId, message };
}

/**
 * Extracts a displayable message from a boundary-caught error.
 *
 * Priority order:
 *   1. If `error.digest` was set by `AppError`, returns the encoded message.
 *   2. In development, returns `error.message` verbatim (not sanitized).
 *   3. Falls back to a generic Portuguese string.
 */
export function getDisplayableErrorMessage(error: Error & { digest?: string }): {
  message: string;
  errorId: string | null;
} {
  const { errorId, message } = parsePublicDigest(error.digest);
  if (message) {
    return { message, errorId };
  }
  const rawMessage = error.message;
  const isSanitized =
    rawMessage.includes('omitted in production') ||
    rawMessage.includes('specific message is omitted');
  if (!isSanitized && rawMessage) {
    return { message: rawMessage, errorId: error.digest ?? null };
  }
  return {
    message: 'Ocorreu um erro. Por favor, tente novamente.',
    errorId: error.digest ?? null,
  };
}

/**
 * Error class for server components / server actions that need to surface a
 * specific user-facing message in production.
 *
 * Next.js redacts `error.message` across the server→client boundary in
 * production, but leaves `error.digest` untouched. `AppError` encodes the
 * public message into `digest` so `parsePublicDigest` / `resolveErrorCopy`
 * can recover it inside an `error.tsx` boundary.
 *
 * The internal message (and the original error, if provided) are logged
 * server-side via `logger.error` at construction time.
 */
export class AppError extends Error {
  public readonly publicErrorId: PublicErrorId;
  public readonly publicMessage: string;
  public digest: string;

  constructor({
    error,
    internalMessage,
    publicMessage,
  }: {
    /** Original cause — logged server-side, never sent to the client. */
    error?: unknown;
    /** Developer-facing message — logged server-side only. */
    internalMessage?: string;
    /** User-facing message — encoded into `digest` and recovered client-side. */
    publicMessage?: string;
  }) {
    const publicErrorId = generateErrorId();
    const publicMessageOrDefault = publicMessage ?? 'Ocorreu um erro. Por favor, tente novamente.';

    const digestValue: PublicErrorMessage = `${publicErrorId}${PUBLIC_ERROR_DELIMITER}${publicMessageOrDefault}`;

    super(digestValue);
    this.name = 'AppError';
    this.digest = digestValue;
    this.publicErrorId = publicErrorId;
    this.publicMessage = publicMessageOrDefault;

    if (internalMessage || error) {
      logger.error(internalMessage ?? 'AppError', error, {
        publicErrorId,
        publicMessage: publicMessageOrDefault,
      });
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
