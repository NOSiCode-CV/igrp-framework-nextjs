import { describe, it, expect } from 'vitest';
import {
  sanitizePath,
  sanitizeRedirectUrl,
  sanitizeString,
  stripAuthApiSuffix,
  stripBasePath,
} from '../sanitize';

// Cases below were added to kill surviving mutants from `pnpm test:mutation`.
const MAX = 2048;
const pathOfLength = (n: number) => '/' + 'a'.repeat(n - 1);

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

describe('stripBasePath', () => {
  it('removes the basePath on a segment boundary', () => {
    expect(stripBasePath('/apps/core/dashboard', '/apps/core')).toBe('/dashboard');
    expect(stripBasePath('/apps/core', '/apps/core')).toBe('/');
  });

  it('keeps a query or fragment attached to a root remainder', () => {
    expect(stripBasePath('/apps/core?a=1', '/apps/core')).toBe('/?a=1');
    expect(stripBasePath('/apps/core#top', '/apps/core')).toBe('/#top');
  });

  it('returns null when the path is not under the basePath', () => {
    expect(stripBasePath('/dashboard', '/apps/core')).toBeNull();
    expect(stripBasePath('/apps/core-other/x', '/apps/core')).toBeNull();
    expect(stripBasePath('/apps/corex', '/apps/core')).toBeNull();
  });

  it('strips only once — nesting is not unwrapped', () => {
    expect(stripBasePath('/apps/core/apps/core/x', '/apps/core')).toBe('/apps/core/x');
  });

  it('returns the path unchanged for an empty basePath', () => {
    expect(stripBasePath('/dashboard', '')).toBe('/dashboard');
  });
});

describe('sanitizeRedirectUrl — input guards', () => {
  const ORIGIN = 'http://localhost:3000';

  it('returns the fallback for non-string and empty input', () => {
    expect(sanitizeRedirectUrl(null, ORIGIN, '/safe')).toBe('/safe');
    expect(sanitizeRedirectUrl(undefined, ORIGIN, '/safe')).toBe('/safe');
    expect(sanitizeRedirectUrl(42 as unknown as string, ORIGIN, '/safe')).toBe('/safe');
    expect(sanitizeRedirectUrl('', ORIGIN, '/safe')).toBe('/safe');
    expect(sanitizeRedirectUrl('', undefined, '/safe')).toBe('/safe');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeRedirectUrl('  /dashboard  ', ORIGIN, '/safe')).toBe('/dashboard');
  });

  it('accepts exactly the maximum length and rejects one more', () => {
    expect(sanitizeRedirectUrl(pathOfLength(MAX), ORIGIN, '/safe')).toBe(pathOfLength(MAX));
    expect(sanitizeRedirectUrl(pathOfLength(MAX + 1), ORIGIN, '/safe')).toBe('/safe');
  });

  it('keeps a malformed escape as literal path text', () => {
    expect(sanitizeRedirectUrl('/%E0%A4%A', ORIGIN, '/safe')).toBe('/%E0%A4%A');
  });

  it('matches dangerous protocols only at the start', () => {
    expect(sanitizeRedirectUrl('/search?q=data:x', ORIGIN, '/safe')).toBe('/search?q=data:x');
  });

  it('rejects a dangerous protocol even when the base uses the same scheme', () => {
    // file: URLs have an opaque origin, so only the protocol blocklist stops this.
    expect(sanitizeRedirectUrl('file:///etc/passwd', 'file:///app', '/safe')).toBe('/safe');
  });

  it('rejects an absolute URL when no baseOrigin is given', () => {
    expect(sanitizeRedirectUrl('http://localhost:3000/x', undefined, '/safe')).toBe('/safe');
  });
});

describe('sanitizeRedirectUrl — same-origin check', () => {
  it('rejects the same host on another port', () => {
    expect(sanitizeRedirectUrl('http://localhost:4000/x', 'http://localhost:3000', '/safe')).toBe(
      '/safe',
    );
  });

  it('rejects another scheme when both origins are opaque', () => {
    expect(sanitizeRedirectUrl('foo:/x', 'bar:/y', '/safe')).toBe('/safe');
  });

  it('rejects another host when both origins are opaque', () => {
    expect(sanitizeRedirectUrl('foo://a/x', 'foo://b/', '/safe')).toBe('/safe');
  });

  it('returns the fallback for an unparseable base', () => {
    expect(sanitizeRedirectUrl('http://localhost:3000/x', 'not a url', '/safe')).toBe('/safe');
  });
});

describe('sanitizePath — input guards', () => {
  it('returns the fallback for non-string and empty input', () => {
    expect(sanitizePath(undefined, '/f')).toBe('/f');
    expect(sanitizePath(42 as unknown as string, '/f')).toBe('/f');
    expect(sanitizePath('', '/f')).toBe('/f');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizePath('  /dashboard  ')).toBe('/dashboard');
  });

  it('accepts exactly the maximum length and rejects one more', () => {
    expect(sanitizePath(pathOfLength(MAX), '/f')).toBe(pathOfLength(MAX));
    expect(sanitizePath(pathOfLength(MAX + 1), '/f')).toBe('/f');
  });
});

describe('sanitizeString', () => {
  it('returns an empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(42 as unknown as string)).toBe('');
  });

  it('removes the highest C0 control character (0x1f) and keeps space (0x20)', () => {
    expect(sanitizeString('a\x1fb c')).toBe('ab c');
  });
});

describe('stripAuthApiSuffix — anchoring', () => {
  it('strips several trailing slashes before the suffix check', () => {
    expect(stripAuthApiSuffix('http://h:3000/apps/t/api/auth//')).toBe('http://h:3000/apps/t');
  });

  it('strips /api/auth only at the end', () => {
    expect(stripAuthApiSuffix('http://h:3000/api/auth/x')).toBe('http://h:3000/api/auth/x');
  });
});

describe('stripBasePath — prefix check', () => {
  it('returns null when an unrelated path has a "/" at the basePath length', () => {
    // '/other/dir' has the same length as '/apps/core'.
    expect(stripBasePath('/other/dir/x', '/apps/core')).toBeNull();
  });

  it('returns any path unchanged for an empty basePath', () => {
    expect(stripBasePath('?a=1', '')).toBe('?a=1');
  });
});
