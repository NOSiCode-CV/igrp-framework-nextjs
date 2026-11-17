import { describe, expect, it } from 'vitest';

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
