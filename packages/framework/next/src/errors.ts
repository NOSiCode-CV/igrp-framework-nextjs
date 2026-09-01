// ─────────────────────────────────────────────────────────────────────────────
// @igrp/framework-next/errors
//
// Typed error hierarchy for the IGRP framework. Designed so that an App Router
// `error.tsx` / `global-error.tsx` boundary can discriminate failures in
// PRODUCTION, where Next.js redacts `error.message` to a generic string but
// preserves `error.name`.
//
// The contract:
//   • Every thrown framework error is an `IgrpError` (or a subclass).
//   • Each instance sets a machine-stable `code` string. Code strings are the
//     key consumers translate against their own i18n map.
//   • `this.name` is set to the class name on every subclass so that it
//     survives the server → client serialization performed by React's error
//     boundary. Default message strings remain Portuguese for backwards
//     compatibility with existing logs, but consumers SHOULD NOT parse
//     `error.message` — use `error.name` / `error.code` instead.
//
// Usage:
//   import { IgrpConfigError, isIgrpError } from '@igrp/framework-next/errors';
//   throw new IgrpConfigError('IGRP_CONFIG_NOT_INITIALIZED');
//
//   // In error.tsx:
//   if (isIgrpError(error) && error.code === 'IGRP_CONFIG_NOT_INITIALIZED') …
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stable machine codes used by the framework. Consumers extend this union in
 * their own code base if they throw IgrpError subclasses with custom codes.
 */
export type IgrpErrorCode =
  | 'IGRP_CONFIG_NOT_INITIALIZED'
  | 'IGRP_CONFIG_INVALID'
  | 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING'
  | 'IGRP_APP_CODE_MISSING'
  | 'IGRP_APP_HOME_SLUG_INVALID'
  | 'IGRP_AUTH_CONFIG_INVALID'
  | 'IGRP_LAYOUT_DATA_FAILED';

/**
 * Minimal context bag attached to an error. Keep values serializable
 * (`string | number | boolean | null`) so React's error boundary serializer
 * can surface them through `digest` metadata without throwing.
 */
export type IgrpErrorContext = Record<string, string | number | boolean | null>;

/**
 * Common fields every IgrpError carries. Kept as a plain interface (not a
 * class) so that templates can also construct structurally-equivalent objects
 * from external sources without `instanceof` headaches.
 */
export interface IgrpErrorShape {
  readonly code: string;
  readonly context?: IgrpErrorContext;
}

/** Base class for every framework-thrown error. */
export class IgrpError extends Error implements IgrpErrorShape {
  readonly code: string;
  readonly context?: IgrpErrorContext;

  constructor(code: string, message?: string, context?: IgrpErrorContext) {
    super(message ?? code);
    this.name = 'IgrpError';
    this.code = code;
    this.context = context;
    // Preserve the prototype chain across the ES5-target transpile tsc/SWC emit.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Configuration-level failure. Thrown when `igrpBuildConfig` is called with
 * missing or invalid inputs, or when required env vars (e.g. the
 * access-management API) are absent while preview mode is off.
 */
export class IgrpConfigError extends IgrpError {
  constructor(code: IgrpErrorCode | (string & {}), message?: string, context?: IgrpErrorContext) {
    super(code, message, context);
    this.name = 'IgrpConfigError';
  }
}

/** Auth-config failure surfaced above `@igrp/framework-next-auth`. */
export class IgrpAuthConfigError extends IgrpError {
  constructor(code: IgrpErrorCode | (string & {}), message?: string, context?: IgrpErrorContext) {
    super(code, message, context);
    this.name = 'IgrpAuthConfigError';
  }
}

/** Layout-data fetch failure (menu / user / apps bootstrap). */
export class IgrpLayoutDataError extends IgrpError {
  constructor(code: IgrpErrorCode | (string & {}), message?: string, context?: IgrpErrorContext) {
    super(code, message, context);
    this.name = 'IgrpLayoutDataError';
  }
}

/**
 * Structural guard that works in both dev (full instance) and production
 * (React hydrated a plain object shaped like `IgrpError`). Prefer this over
 * `instanceof` in client boundaries where React may have serialized the
 * error across the server→client edge.
 */
export function isIgrpError(
  error: unknown,
): error is IgrpErrorShape & { name: string; message: string } {
  if (!error || typeof error !== 'object') return false;
  const maybe = error as { name?: unknown; code?: unknown };
  return (
    typeof maybe.name === 'string' &&
    maybe.name.startsWith('Igrp') &&
    typeof maybe.code === 'string'
  );
}
