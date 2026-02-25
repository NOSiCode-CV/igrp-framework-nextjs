/**
 * Authentication-related constants.
 * Centralizes magic numbers and strings used throughout the authentication flow.
 */
export const AUTH_CONSTANTS = {
  /** Token refresh buffer: 1 minute before expiry (in milliseconds) */
  TOKEN_REFRESH_BUFFER_MS: 60_000,

  /** Token expiry buffer: 1 minute buffer (in seconds) */
  TOKEN_EXPIRY_BUFFER_SEC: 60,

  /** Session refetch interval: 5 minutes (in seconds) */
  SESSION_REFETCH_INTERVAL_SEC: 5 * 60,

  /** Preview session expiry: 1 year from now (in milliseconds) */
  PREVIEW_SESSION_EXPIRY_MS: 365 * 24 * 60 * 60 * 1000,

  /** Preview token string used for development/demo mode */
  PREVIEW_TOKEN: "preview-token",
} as const;
