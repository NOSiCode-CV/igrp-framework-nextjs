import { describe, it, expect } from 'vitest';
import {
  authCookieSuffix,
  basePathCookiePath,
  basePathCookieSuffix,
  buildAuthCookies,
  resolveSecureCookie,
  sessionCookieName,
  SESSION_COOKIE_BASENAME,
  staleAuthCookies,
} from '../cookies';

describe('basePathCookieSuffix', () => {
  it('slugifies a basePath', () => {
    expect(basePathCookieSuffix('/apps/template')).toBe('.apps-template~');
  });

  it('leaves an unambiguous basePath on its bare slug', () => {
    // The overwhelmingly common shape: lowercase alphanumeric segments, so the
    // only substitution is `/` -> `-` and the slug is reversible. These MUST
    // keep the name they already have in the wild — a rename signs every user
    // out and orphans a second cookie in the jar.
    expect(basePathCookieSuffix('/apps/template')).toBe('.apps-template~');
    expect(basePathCookieSuffix('/apps/hr')).toBe('.apps-hr~');
    expect(basePathCookieSuffix('/apps/a/b')).toBe('.apps-a-b~');
    expect(basePathCookieSuffix('/portal2')).toBe('.portal2~');
  });

  it('appends a disambiguating hash when slugging is lossy', () => {
    // Uppercase, `_`, `.` and a literal `-` are all folded into the same slug
    // as some other basePath would be, so each carries a hash.
    for (const basePath of ['/Apps/My_App', '/apps/a-b', '/apps/hr_admin', '/apps/HR']) {
      expect(basePathCookieSuffix(basePath)).toMatch(/^\.[a-z0-9-]+\.[0-9a-f]{8}~$/);
    }
  });

  it('returns the bare terminator for the root or an absent basePath', () => {
    expect(basePathCookieSuffix('')).toBe('~');
    expect(basePathCookieSuffix('/')).toBe('~');
    expect(basePathCookieSuffix(undefined)).toBe('~');
    expect(basePathCookieSuffix('   ')).toBe('~');
  });
});

describe('buildAuthCookies', () => {
  it('terminates the names of a root-path app too', () => {
    for (const basePath of ['', '/', undefined]) {
      const cookies = buildAuthCookies(basePath, false);
      expect(cookies.sessionToken.name).toBe('next-auth.session-token~');
      expect(cookies.csrfToken.name).toBe('next-auth.csrf-token~');
    }
    expect(buildAuthCookies('', true).sessionToken.name).toBe(
      '__Secure-next-auth.session-token~',
    );
  });

  it('scopes EVERY cookie, not just the session token', () => {
    // A shared csrf-token fails the other app's sign-in POST; a shared
    // pkce verifier breaks concurrent logins.
    const cookies = buildAuthCookies('/apps/a', false)!;
    for (const entry of Object.values(cookies)) {
      expect(entry.name).toContain('.apps-a');
    }
    expect(Object.keys(cookies).sort()).toEqual([
      'callbackUrl',
      'csrfToken',
      'nonce',
      'pkceCodeVerifier',
      'sessionToken',
      'state',
    ]);
  });

  it('gives two apps on one host distinct session-cookie names', () => {
    const a = buildAuthCookies('/apps/a', true)!.sessionToken.name;
    const b = buildAuthCookies('/apps/b', true)!.sessionToken.name;
    expect(a).not.toBe(b);
  });

  it('keeps the __Secure- prefix first so the browser still honours it', () => {
    const cookies = buildAuthCookies('/apps/a', true)!;
    expect(cookies.sessionToken.name.startsWith('__Secure-')).toBe(true);
    expect(cookies.sessionToken.options.secure).toBe(true);
  });

  it('uses __Host- for the csrf cookie only, as upstream does', () => {
    const cookies = buildAuthCookies('/apps/a', true)!;
    expect(cookies.csrfToken.name.startsWith('__Host-')).toBe(true);
    expect(cookies.csrfToken.options.path).toBe('/');
    expect(cookies.csrfToken.options.domain).toBeUndefined();
    expect(cookies.sessionToken.name.startsWith('__Host-')).toBe(false);
  });

  it('drops the prefixes over http', () => {
    const cookies = buildAuthCookies('/apps/a', false)!;
    expect(cookies.sessionToken.name).toBe('next-auth.session-token.apps-a_p~');
    // CSRF keeps its previous name: it stays at `Path=/` (see buildAuthCookies).
    expect(cookies.csrfToken.name).toBe('next-auth.csrf-token.apps-a~');
    expect(cookies.sessionToken.options.secure).toBe(false);
  });
});

describe('sessionCookieName', () => {
  it('matches what buildAuthCookies writes', () => {
    for (const secure of [true, false]) {
      expect(sessionCookieName('/apps/a', secure)).toBe(
        buildAuthCookies('/apps/a', secure)!.sessionToken.name,
      );
    }
  });

  it('terminates the stock name without a basePath', () => {
    expect(sessionCookieName('', false)).toBe(`${SESSION_COOKIE_BASENAME}~`);
    expect(sessionCookieName(undefined, true)).toBe(`__Secure-${SESSION_COOKIE_BASENAME}~`);
  });
});

describe('sessionCookieName — a root-path app co-hosted with basePath apps', () => {
  // Regression: the root app kept the stock `next-auth.session-token`, which is
  // a PREFIX of every basePath app's name. NextAuth's SessionStore collects by
  // startsWith, so the root app glued every other app's cookie onto its own,
  // failed with "Invalid Compact JWE" (JWT_SESSION_ERROR), and — because the
  // session route calls SessionStore#clean() on that error — expired every
  // co-hosted app's session on each poll. Switching between ANY two apps on
  // the domain then landed on /login.
  const basePaths = ['/apps/a', '/apps/hr', '/Apps/My_App', '/rh/v2'];

  it('never prefixes, nor is prefixed by, a basePath app’s name', () => {
    for (const secure of [true, false]) {
      const root = sessionCookieName('', secure);
      for (const basePath of basePaths) {
        const scoped = sessionCookieName(basePath, secure);
        expect(scoped.startsWith(root), `${scoped} must not start with ${root}`).toBe(false);
        expect(root.startsWith(scoped), `${root} must not start with ${scoped}`).toBe(false);
      }
    }
  });

  it('still chunks cleanly', () => {
    const root = sessionCookieName('', false);
    expect(`${root}.0`.startsWith(root)).toBe(true);
  });
});

describe('resolveSecureCookie', () => {
  it('detects the secure prefix', () => {
    expect(resolveSecureCookie(['__Secure-next-auth.session-token'])).toBe(true);
  });

  it('detects the plain cookie', () => {
    expect(resolveSecureCookie(['next-auth.session-token'])).toBe(false);
  });

  it('returns undefined when no session cookie is present', () => {
    expect(resolveSecureCookie(['some-other-cookie'])).toBeUndefined();
    expect(resolveSecureCookie([])).toBeUndefined();
  });

  it('still works for chunked and basePath-scoped names', () => {
    // The suffix goes last precisely so startsWith() detection is unaffected.
    expect(resolveSecureCookie(['next-auth.session-token.apps-a~'])).toBe(false);
    expect(resolveSecureCookie(['__Secure-next-auth.session-token.apps-a~.0'])).toBe(true);
  });

  it('prefers secure when both are somehow present', () => {
    expect(
      resolveSecureCookie(['next-auth.session-token', '__Secure-next-auth.session-token']),
    ).toBe(true);
  });
});

describe('basePathCookieSuffix — prefix-free suffixes', () => {
  // Regression: NextAuth's SessionStore collects every cookie whose name
  // startsWith the configured one (that is how it reassembles `.0`/`.1`
  // chunks). With an un-terminated suffix, `/apps/hr` collected
  // `next-auth.session-token.apps-hr-admin` as if it were one of its own
  // chunks, concatenated the two values, failed to decrypt the result and saw
  // NO session — a permanent /login loop with a valid cookie present. And
  // SessionStore#clean() then expired every collected name, so signing in or
  // out of /apps/hr deleted /apps/hr-admin's session.
  const collidingPairs = [
    ['/apps/hr', '/apps/hr-admin'],
    ['/apps/a', '/apps/ab'],
    ['/rh', '/rh/v2'],
  ] as const;

  it('never lets one app’s suffix prefix another’s', () => {
    for (const [shorter, longer] of collidingPairs) {
      const a = basePathCookieSuffix(shorter);
      const b = basePathCookieSuffix(longer);
      expect(a).not.toBe(b);
      expect(b.startsWith(a), `${b} must not start with ${a}`).toBe(false);
    }
  });

  it('never lets one app’s session-cookie name prefix another’s', () => {
    for (const secure of [true, false]) {
      for (const [shorter, longer] of collidingPairs) {
        const a = sessionCookieName(shorter, secure);
        const b = sessionCookieName(longer, secure);
        expect(b.startsWith(a), `${b} must not start with ${a}`).toBe(false);
      }
    }
  });

  it('still chunks cleanly — the terminator precedes NextAuth’s .0/.1', () => {
    const name = sessionCookieName('/apps/hr', false);
    expect(`${name}.0`.startsWith(name)).toBe(true);
    expect(`${name}.0`.startsWith(sessionCookieName('/apps/hr-admin', false))).toBe(false);
  });

  it('uses only characters valid in a cookie name (RFC 6265 token)', () => {
    // Separators (;=, space, quotes…) would truncate or corrupt the Set-Cookie
    // header rather than merely renaming the cookie.
    for (const basePath of ['/apps/hr', '/Apps/My_App', '/a/b/c']) {
      expect(sessionCookieName(basePath, true)).toMatch(/^[\w!#$%&'*+.^`|~-]+$/);
    }
  });
});

describe('basePathCookieSuffix — distinct basePaths never share a suffix', () => {
  /**
   * The prefix-free property that `SUFFIX_TERMINATOR` buys says no suffix is a
   * PREFIX of another. It says nothing about two basePaths producing the
   * IDENTICAL suffix, which the slug transform used to allow: every
   * non-alphanumeric run folds to `-` and the whole thing is lowercased, so
   * `/apps/a/b` and `/apps/a-b` both slugged to `apps-a-b`.
   *
   * Two co-hosted apps that collide get exactly the interference this module
   * exists to prevent: the same cookie name at the same path on the same host,
   * so one app decodes the other's token (wrong audience, wrong roles) and
   * `SessionStore#clean()` deletes the other's session on sign-out.
   */
  const COLLIDING_GROUPS = [
    ['/apps/a-b', '/apps/a/b'],
    ['/apps/hr-admin', '/apps/hr_admin', '/apps/hr.admin', '/apps/hr admin', '/apps/hr/admin'],
    ['/apps/hr', '/apps/HR'],
    ['/a/b/c', '/a-b-c', '/a/b-c', '/a-b/c'],
  ];

  it.each(COLLIDING_GROUPS)('keeps %s distinct from its slug-mates', (...group) => {
    const suffixes = group.map(basePathCookieSuffix);
    expect(new Set(suffixes).size).toBe(group.length);
  });

  it('stays prefix-free across the hashed and unhashed classes', () => {
    const all = [...COLLIDING_GROUPS.flat(), '/apps/template', '/apps/hr-admin-extra'].map(
      basePathCookieSuffix,
    );
    for (const a of all) {
      for (const b of all) {
        if (a === b) continue;
        expect(b.startsWith(a)).toBe(false);
      }
    }
  });

  it('is deterministic', () => {
    expect(basePathCookieSuffix('/apps/a-b')).toBe(basePathCookieSuffix('/apps/a-b'));
  });
});

describe('basePathCookiePath', () => {
  it('is the basePath, normalised for stray slashes', () => {
    expect(basePathCookiePath('/apps/template')).toBe('/apps/template');
    expect(basePathCookiePath('apps/template/')).toBe('/apps/template');
    expect(basePathCookiePath('  /apps/a/b/  ')).toBe('/apps/a/b');
  });

  it('keeps the case, because Next matches basePath case-sensitively', () => {
    expect(basePathCookiePath('/Apps/My_App')).toBe('/Apps/My_App');
  });

  it('is / for a root-path app', () => {
    for (const basePath of ['', '/', undefined, '   ']) {
      expect(basePathCookiePath(basePath)).toBe('/');
    }
  });
});

describe('authCookieSuffix — path-scoped names', () => {
  it('marks a basePath app’s names, before the terminator', () => {
    expect(authCookieSuffix('/apps/template')).toBe('.apps-template_p~');
    expect(authCookieSuffix('/apps/a-b')).toMatch(/^\.apps-a-b\.[0-9a-f]{8}_p~$/);
  });

  it('leaves a root-path app’s names unchanged — its path is still /', () => {
    for (const basePath of ['', '/', undefined]) {
      expect(authCookieSuffix(basePath)).toBe(basePathCookieSuffix(basePath));
    }
  });

  it('cannot be collected as a chunk of the previous name, nor collect it', () => {
    // SessionStore reads by prefix: a replica on the previous version must not
    // glue the new cookie onto its own, and the new reader must not pick up
    // the old one.
    for (const basePath of ['/apps/hr', '/apps/a-b', '/rh/v2']) {
      const previous = basePathCookieSuffix(basePath);
      const current = authCookieSuffix(basePath);
      expect(current.startsWith(previous)).toBe(false);
      expect(`${previous}.0`.startsWith(current)).toBe(false);
    }
  });

  it('stays prefix-free across apps', () => {
    const pairs = [
      ['/apps/hr', '/apps/hr-admin'],
      ['/apps/a', '/apps/ab'],
      ['/rh', '/rh/v2'],
      ['/apps/p', '/apps'],
    ] as const;
    for (const [x, y] of pairs) {
      for (const [a, b] of [
        [authCookieSuffix(x), authCookieSuffix(y)],
        [authCookieSuffix(y), authCookieSuffix(x)],
        [authCookieSuffix(x), basePathCookieSuffix(y)],
        [basePathCookieSuffix(x), authCookieSuffix(y)],
      ]) {
        expect(b.startsWith(a), `${b} must not start with ${a}`).toBe(false);
      }
    }
  });
});

describe('buildAuthCookies — cookie path', () => {
  it('confines every cookie but CSRF to the app’s path', () => {
    const cookies = buildAuthCookies('/apps/a', true);
    for (const key of ['sessionToken', 'callbackUrl', 'pkceCodeVerifier', 'state', 'nonce'] as const) {
      expect(cookies[key].options.path, key).toBe('/apps/a');
      expect(cookies[key].name, key).toContain('.apps-a_p~');
    }
    expect(cookies.csrfToken.options.path).toBe('/');
    expect(cookies.csrfToken.name).toBe('__Host-next-auth.csrf-token.apps-a~');
  });

  it('keeps a root-path app at / under its existing names', () => {
    const cookies = buildAuthCookies('', false);
    for (const entry of Object.values(cookies)) {
      expect(entry.options.path).toBe('/');
    }
    expect(cookies.sessionToken.name).toBe('next-auth.session-token~');
  });

  it('agrees with sessionCookieName', () => {
    for (const secure of [true, false]) {
      for (const basePath of ['/apps/a', '/apps/a-b', '']) {
        expect(sessionCookieName(basePath, secure)).toBe(
          buildAuthCookies(basePath, secure).sessionToken.name,
        );
      }
    }
  });
});

describe('staleAuthCookies', () => {
  const names = (basePath: string | undefined, present: string[]) =>
    staleAuthCookies(basePath, present).map((cookie) => cookie.name);

  it('returns the app’s previous-generation names, chunks included', () => {
    const present = [
      'next-auth.session-token.apps-a~',
      'next-auth.session-token.apps-a~.0',
      'next-auth.session-token.apps-a~.1',
      '__Secure-next-auth.session-token.apps-a~',
      'next-auth.callback-url.apps-a~',
      'next-auth.pkce.code_verifier.apps-a~',
      'next-auth.state.apps-a~',
      'next-auth.nonce.apps-a~',
      // pre-terminator generation
      'next-auth.session-token.apps-a',
      'next-auth.session-token.apps-a.0',
    ];
    expect(names('/apps/a', present).sort()).toEqual([...present].sort());
  });

  it('never returns the current names', () => {
    const current = Object.values(buildAuthCookies('/apps/a', true)).map((c) => c.name);
    const chunks = current.map((name) => `${name}.0`);
    expect(names('/apps/a', [...current, ...chunks])).toEqual([]);
  });

  it('never touches another app’s cookies, old or new', () => {
    const present = [
      'next-auth.session-token.apps-ab~',
      'next-auth.session-token.apps-a-admin~',
      'next-auth.session-token.apps-b~',
      'next-auth.session-token.apps-b_p~',
      'next-auth.session-token~',
      'next-auth.session-token',
      'next-auth.session-token.apps-ab',
    ];
    expect(names('/apps/a', present)).toEqual([]);
  });

  it('leaves the CSRF cookie alone — it keeps its name and path', () => {
    expect(names('/apps/a', ['next-auth.csrf-token.apps-a~', '__Host-next-auth.csrf-token.apps-a~'])).toEqual([]);
  });

  it('returns nothing for a root-path app', () => {
    expect(names('', ['next-auth.session-token~', 'next-auth.session-token'])).toEqual([]);
  });

  it('does not sweep the unhashed names of a lossy basePath', () => {
    // `/apps/a-b` and `/apps/a/b` both slug to `apps-a-b`; the unhashed names
    // may belong to the lossless sibling.
    const hashed = `next-auth.session-token${basePathCookieSuffix('/apps/a-b')}`;
    expect(
      names('/apps/a-b', [hashed, 'next-auth.session-token.apps-a-b~', 'next-auth.session-token.apps-a-b']),
    ).toEqual([hashed]);
  });

  it('expires at Path=/, with Secure for __Secure- names', () => {
    const [plain, secure] = staleAuthCookies('/apps/a', [
      'next-auth.session-token.apps-a~',
      '__Secure-next-auth.session-token.apps-a~',
    ]);
    expect(plain.options).toEqual({ path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax', secure: false });
    expect(secure.options.secure).toBe(true);
  });
});
