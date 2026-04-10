const MAX_REDIRECT_LENGTH = 2048;
const MAX_STRING_LENGTH = 10_000;
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * Resolves the login path relative to a base URL.
 * Falls back to "/login" if the base URL is invalid.
 */
export function getLoginPath(baseUrl: string, path = '/login'): string {
  try {
    return new URL(path, baseUrl).pathname;
  } catch {
    return '/login';
  }
}

/**
 * Sanitizes a redirect/callback URL to prevent open redirect attacks.
 * Allows only relative paths (/) or same-origin absolute URLs.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  baseOrigin?: string,
  fallback = '/',
): string {
  if (url == null || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  if (DANGEROUS_PROTOCOLS.test(trimmed)) return fallback;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    const path = trimmed.split('?')[0];
    if (path.includes('..')) return fallback;
    return trimmed;
  }

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
 */
export function sanitizePath(path: string | null | undefined, fallback = '/'): string {
  if (path == null || typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  if (trimmed.length === 0 || !trimmed.startsWith('/')) return fallback;
  if (trimmed.includes('..')) return fallback;
  if (trimmed.length > MAX_REDIRECT_LENGTH) return fallback;
  return trimmed;
}

/**
 * Sanitizes a string: trims, limits length, removes control characters.
 */
export function sanitizeString(value: string | null | undefined, maxLength = MAX_STRING_LENGTH): string {
  if (value == null || typeof value !== 'string') return '';
  const trimmed = value.trim();
  const withoutControlChars = [...trimmed]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('');
  return withoutControlChars.slice(0, maxLength);
}

/**
 * Escapes HTML special characters to prevent XSS when rendering user content.
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
