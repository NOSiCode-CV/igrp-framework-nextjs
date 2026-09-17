import { describe, it, expect, vi } from 'vitest';

import { isNextControlFlowError } from '../runtime';
import { escapeHtml, getLoginPath, sanitizeString } from '../sanitize';
import { hasAccessToken } from '../session';
import { interopDefault } from '../_interop';
import { isIGRPAuthConfigError, IGRPAuthConfigError } from '../config';

describe('isNextControlFlowError', () => {
  it('recognises anything carrying a string digest', () => {
    // redirect() / notFound() / forbidden() / the prerender bailout all do.
    expect(isNextControlFlowError(Object.assign(new Error('x'), { digest: 'NEXT_REDIRECT' }))).toBe(
      true,
    );
    expect(
      isNextControlFlowError(Object.assign(new Error('x'), { digest: 'DYNAMIC_SERVER_USAGE' })),
    ).toBe(true);
  });

  it('recognises the bailout error names', () => {
    expect(
      isNextControlFlowError(Object.assign(new Error('x'), { name: 'DynamicServerError' })),
    ).toBe(true);
    expect(
      isNextControlFlowError(Object.assign(new Error('x'), { name: 'StaticGenBailoutError' })),
    ).toBe(true);
  });

  it('does NOT claim ordinary failures', () => {
    expect(isNextControlFlowError(new Error('JWE decryption failed'))).toBe(false);
    expect(isNextControlFlowError(new TypeError('boom'))).toBe(false);
    expect(isNextControlFlowError(null)).toBe(false);
    expect(isNextControlFlowError(undefined)).toBe(false);
    expect(isNextControlFlowError('NEXT_REDIRECT')).toBe(false);
    // A numeric digest is not Next's shape.
    expect(isNextControlFlowError({ digest: 123 })).toBe(false);
  });
});

describe('escapeHtml', () => {
  // This is the only thing between an auth-config error message and HTML
  // injection on the unauthenticated 500 diagnostic page.
  it('escapes every character that can break out of markup', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('escapes ampersands first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('returns empty for a non-string', () => {
    expect(escapeHtml(undefined as unknown as string)).toBe('');
    expect(escapeHtml(null as unknown as string)).toBe('');
  });
});

describe('interopDefault', () => {
  // Exists to prevent a hard runtime crash ("... is not a function") when a
  // bundler hands back the CJS namespace object instead of `.default`.
  it('unwraps a namespace object', () => {
    const fn = () => 'called';
    expect(interopDefault({ __esModule: true, default: fn })).toBe(fn);
  });

  it('passes through an already-unwrapped value', () => {
    const fn = () => 'called';
    expect(interopDefault(fn)).toBe(fn);
  });

  it('leaves primitives and null alone', () => {
    expect(interopDefault(null)).toBe(null);
    expect(interopDefault(undefined)).toBe(undefined);
    expect(interopDefault(42)).toBe(42);
  });
});

describe('getLoginPath', () => {
  it('resolves the login path against a base URL', () => {
    expect(getLoginPath('http://localhost:3000/apps/t')).toBe('/login');
    expect(getLoginPath('http://localhost:3000', '/auth/signin')).toBe('/auth/signin');
    expect(getLoginPath('http://localhost:3000/apps/t/', 'login')).toBe('/apps/t/login');
  });

  it('falls back to /login on a malformed base', () => {
    expect(getLoginPath('not a url')).toBe('/login');
    expect(getLoginPath('')).toBe('/login');
  });
});

describe('sanitizeString', () => {
  it('trims, strips control characters, and caps length', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString(`a${String.fromCharCode(0)}b${String.fromCharCode(127)}c`)).toBe('abc');
    expect(sanitizeString('abcdef', 3)).toBe('abc');
  });

  it('returns empty for nullish or non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });

  it('keeps non-ASCII text intact', () => {
    expect(sanitizeString('Olá, Praia')).toBe('Olá, Praia');
  });
});

describe('hasAccessToken', () => {
  it('requires a non-empty string value, not just the key', () => {
    expect(hasAccessToken({ accessToken: 'at' })).toBe(true);
    expect(hasAccessToken({ accessToken: undefined })).toBe(false);
    expect(hasAccessToken({ accessToken: '' })).toBe(false);
    expect(hasAccessToken({ accessToken: 123 })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(hasAccessToken(null)).toBe(false);
    expect(hasAccessToken(undefined)).toBe(false);
    expect(hasAccessToken('accessToken')).toBe(false);
  });
});

describe('isIGRPAuthConfigError', () => {
  it('recognises the error structurally, across package boundaries', () => {
    const err = new IGRPAuthConfigError('bad env', 'AUTH_PROVIDER_INVALID');
    expect(isIGRPAuthConfigError(err)).toBe(true);
    expect(err.code).toBe('AUTH_PROVIDER_INVALID');
    expect(err instanceof IGRPAuthConfigError).toBe(true);
    // Structural: a deserialized copy from another realm still matches.
    expect(isIGRPAuthConfigError({ name: 'IGRPAuthConfigError', message: 'x' })).toBe(true);
  });

  it('does not claim other errors', () => {
    expect(isIGRPAuthConfigError(new Error('nope'))).toBe(false);
    expect(isIGRPAuthConfigError(null)).toBe(false);
  });
});

describe('getServerSessionStrict', () => {
  it('throws when there is no session, and returns it when there is', async () => {
    vi.resetModules();
    const getServerSession = vi.fn();
    vi.doMock('next-auth', () => ({
      default: vi.fn(),
      getServerSession,
    }));

    const { getServerSessionStrict } = await import('../server');

    getServerSession.mockResolvedValueOnce(null);
    await expect(getServerSessionStrict({} as never)).rejects.toThrow('Unauthorized');

    const session = { user: { name: 'Ana' } };
    getServerSession.mockResolvedValueOnce(session);
    await expect(getServerSessionStrict({} as never)).resolves.toBe(session);

    vi.doUnmock('next-auth');
    vi.resetModules();
  });
});
