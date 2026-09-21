import { describe, it, expect } from 'vitest';
import { sanitizePath, sanitizeRedirectUrl, stripAuthApiSuffix } from '../sanitize';

describe('sanitizeRedirectUrl — open-redirect hardening', () => {
  const ORIGIN = 'http://localhost:3000';

  it('rejects a leading backslash (protocol-relative bypass)', () => {
    expect(sanitizeRedirectUrl('/\\evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a percent-encoded backslash bypass', () => {
    expect(sanitizeRedirectUrl('/%5Cevil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a mixed slash-backslash bypass', () => {
    expect(sanitizeRedirectUrl('/\\/evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/../../etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects an encoded path-traversal segment', () => {
    expect(sanitizeRedirectUrl('/a/%2e%2e/etc', ORIGIN, '/safe')).toBe('/safe');
  });

  it('still rejects protocol-relative //', () => {
    expect(sanitizeRedirectUrl('//evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('allows a normal relative path', () => {
    expect(sanitizeRedirectUrl('/dashboard', ORIGIN, '/safe')).toBe('/dashboard');
  });

  it('preserves a query string on a relative path', () => {
    expect(sanitizeRedirectUrl('/list?tab=open', ORIGIN, '/safe')).toBe('/list?tab=open');
  });

  it('allows a non-traversal value with .. inside a query', () => {
    expect(sanitizeRedirectUrl('/range?d=1..10', ORIGIN, '/safe')).toBe('/range?d=1..10');
  });

  it('allows a same-origin absolute URL (returns path+search)', () => {
    expect(sanitizeRedirectUrl('http://localhost:3000/x?a=1', ORIGIN, '/safe')).toBe('/x?a=1');
  });

  it('rejects a tab-injection protocol-relative bypass', () => {
    expect(sanitizeRedirectUrl('/\t/evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects newline and carriage-return control characters', () => {
    expect(sanitizeRedirectUrl('/\n/evil.com', ORIGIN, '/safe')).toBe('/safe');
    expect(sanitizeRedirectUrl('/\r/evil.com', ORIGIN, '/safe')).toBe('/safe');
  });

  it('rejects a backslash when baseOrigin is absent (the hook call shape)', () => {
    expect(sanitizeRedirectUrl('/\\evil.com', undefined, '')).toBe('');
  });
});

describe('sanitizePath', () => {
  it('rejects protocol-relative paths', () => {
    // Previously `startsWith('/')` alone let "//evil.com" through.
    expect(sanitizePath('//evil.com')).toBe('/');
    expect(sanitizePath('//evil.com/x', '/fallback')).toBe('/fallback');
  });

  it('rejects backslash and control-character bypasses', () => {
    expect(sanitizePath('/\\evil.com')).toBe('/');
    expect(sanitizePath('/%5Cevil.com')).toBe('/');
    expect(sanitizePath('/' + String.fromCharCode(9) + '/evil.com')).toBe('/');
  });

  it('rejects traversal by segment', () => {
    expect(sanitizePath('/a/../b')).toBe('/');
    expect(sanitizePath('/a/%2e%2e/b')).toBe('/');
  });

  it('allows a legitimate path containing ".." inside a segment', () => {
    // The old `includes('..')` check rejected this.
    expect(sanitizePath('/reports/q1..q2')).toBe('/reports/q1..q2');
    expect(sanitizePath('/file..name')).toBe('/file..name');
  });

  it('still rejects non-relative and empty input', () => {
    expect(sanitizePath('https://evil.com')).toBe('/');
    expect(sanitizePath('   ')).toBe('/');
    expect(sanitizePath(null)).toBe('/');
  });
});

describe('stripAuthApiSuffix', () => {
  it('strips the NextAuth /api/auth suffix and trailing slashes', () => {
    expect(stripAuthApiSuffix('http://h:3000/apps/t/api/auth')).toBe('http://h:3000/apps/t');
    expect(stripAuthApiSuffix('http://h:3000/apps/t/api/auth/')).toBe('http://h:3000/apps/t');
  });

  it('leaves a base URL without the suffix alone (beyond trailing slashes)', () => {
    expect(stripAuthApiSuffix('http://h:3000/apps/t')).toBe('http://h:3000/apps/t');
    expect(stripAuthApiSuffix('http://h:3000/')).toBe('http://h:3000');
    expect(stripAuthApiSuffix('')).toBe('');
  });
});

describe('sanitizeRedirectUrl — fragments', () => {
  // The relative branch returns the input verbatim, fragment included. Dropping
  // it on the absolute branch made the same destination keep or lose its anchor
  // depending only on how the caller happened to spell it.
  it('keeps the fragment on a same-origin absolute URL', () => {
    expect(sanitizeRedirectUrl('https://app.example/reports#q1', 'https://app.example')).toBe(
      '/reports#q1',
    );
  });

  it('round-trips a deep link the same way whether absolute or relative', () => {
    const origin = 'https://app.example';
    expect(sanitizeRedirectUrl(`${origin}/a/b?x=1#frag`, origin)).toBe('/a/b?x=1#frag');
    expect(sanitizeRedirectUrl('/a/b?x=1#frag', origin)).toBe('/a/b?x=1#frag');
  });

  it('still refuses a cross-origin URL that carries a fragment', () => {
    expect(sanitizeRedirectUrl('https://evil.example/x#y', 'https://app.example')).toBe('/');
  });
});
