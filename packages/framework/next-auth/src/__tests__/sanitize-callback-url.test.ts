import { describe, expect, it, vi } from 'vitest';

import { sanitizeCallbackUrl } from '../sanitize';

describe('sanitizeCallbackUrl', () => {
  it('keeps a same-origin path, query included', () => {
    expect(sanitizeCallbackUrl('/clientes?page=2', '')).toBe('/clientes?page=2');
  });

  it.each([
    ['absolute URL', 'https://evil.example'],
    ['protocol-relative', '//evil.example'],
    ['backslash', '/\\evil.example'],
    ['encoded protocol-relative', '/%2F%2Fevil.example'],
    ['encoded backslash', '/%5Cevil.example'],
    ['malformed encoding', '/%E0%A4%A'],
    ['empty', ''],
    ['not a string', 42],
  ])('rejects %s', (_, raw) => {
    expect(sanitizeCallbackUrl(raw, '')).toBeUndefined();
  });

  it.each(['/login', '/login/x', '/logout', '/logout?x=1'])(
    'rejects the auth chrome target %s',
    (raw) => {
      expect(sanitizeCallbackUrl(raw, '')).toBeUndefined();
    },
  );

  it('strips the basePath, repeatedly, before the auth chrome check', () => {
    expect(sanitizeCallbackUrl('/app/login', '/app')).toBeUndefined();
    expect(sanitizeCallbackUrl('/app/app/logout', '/app')).toBeUndefined();
    expect(sanitizeCallbackUrl('/app/clientes', '/app')).toBe('/app/clientes');
  });
});

// Cases below were added to kill surviving mutants from `pnpm test:mutation`.
describe('sanitizeCallbackUrl — mutation cases', () => {
  it('rejects a raw value that only starts with "/" after decoding', () => {
    expect(sanitizeCallbackUrl('%2Fdashboard', '')).toBeUndefined();
  });

  it('keeps a same-origin path that ends with "//"', () => {
    expect(sanitizeCallbackUrl('/a//', '')).toBe('/a//');
  });

  it('rejects a path below /logout', () => {
    expect(sanitizeCallbackUrl('/logout/x', '')).toBeUndefined();
  });

  it('treats the basePath itself as the app root, even when it is named /login', () => {
    expect(sanitizeCallbackUrl('/login', '/login')).toBe('/login');
  });

  it('reads the basePath from NEXT_PUBLIC_BASE_PATH by default', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/app');
    try {
      expect(sanitizeCallbackUrl('/app/login')).toBeUndefined();
      expect(sanitizeCallbackUrl('/app/clientes')).toBe('/app/clientes');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
