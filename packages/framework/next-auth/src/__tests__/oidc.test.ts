import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import type { JWT } from '../jwt';
import { resetGlobalStateForTests } from '../_global-state';

// The discovery cache, the in-flight refresh map and the warn-once flags are
// process-wide (globalThis + Symbol.for) so that the /config and /oidc entry
// chunks share them. That means `vi.resetModules()` no longer hands each case a
// fresh cache -- reset it explicitly, or one test's discovery document leaks
// into the next.
beforeEach(() => {
  resetGlobalStateForTests();
});

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
};

const DISCOVERY_URL = 'http://localhost:9090/.well-known/openid-configuration';

const MOCK_DISCOVERY = {
  token_endpoint: 'http://localhost:9090/oauth2/token',
  revocation_endpoint: 'http://localhost:9090/oauth2/revoke',
  end_session_endpoint: 'http://localhost:9090/connect/logout',
};

function makeToken(overrides: Partial<JWT> = {}): JWT {
  return {
    refreshToken: 'rt-abc',
    accessToken: 'at-abc',
    idToken: 'id-token-abc',
    authProviderId: 'igrp-auth',
    expiresAt: Date.now() - 1000,
    ...overrides,
  };
}

type FetchMockEntry = { url: string | RegExp; body: unknown; ok?: boolean };

function mockFetch(responses: FetchMockEntry[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const match = responses.find((r) =>
        typeof r.url === 'string' ? url === r.url : r.url.test(url),
      );
      return Promise.resolve({
        ok: match?.ok ?? true,
        // A real Response always carries a status; without one, `status < 500`
        // is false and the refresh retry loop would treat the failure as a 5xx
        // and retry. ok:false here means a permanent 4xx (e.g. invalid_grant).
        status: (match?.ok ?? true) ? 200 : 400,
        json: () => Promise.resolve(match?.body ?? {}),
      });
    }),
  );
}

// ─── Cache reset between tests ────────────────────────────────────────────────

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.resetModules(); // gives each test a fresh openIdConfigurationCache
  // The recovery store lives on globalThis and survives resetModules — restore
  // the default in-memory store so injected test doubles don't leak across tests.
  const { configureOidcTokenRecoveryStore, createInMemoryTokenRecoveryStore } =
    await import('../oidc');
  configureOidcTokenRecoveryStore(createInMemoryTokenRecoveryStore());
});

// ─── refreshOidcAccessToken ───────────────────────────────────────────────────

describe('refreshOidcAccessToken — expiresAt units', () => {
  it('stores expiresAt in milliseconds after a successful refresh', async () => {
    const expiresIn = 3600;
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: expiresIn },
      },
    ]);

    const { refreshOidcAccessToken } = await import('../oidc');
    const before = Date.now();
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    const after = Date.now();

    // expiresAt must be ms-scale (> 1 trillion), not seconds-scale (< 2 billion)
    expect(result.expiresAt!).toBeGreaterThan(1_700_000_000_000);
    expect(result.expiresAt!).toBeGreaterThanOrEqual(before + expiresIn * 1000 - 100);
    expect(result.expiresAt!).toBeLessThanOrEqual(after + expiresIn * 1000 + 100);
  });

  it('returns forceLogout when refresh token is missing', async () => {
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken({ refreshToken: undefined }), VALID_ENV);
    expect(result.forceLogout).toBe(true);
    expect(result.error).toBe('RefreshAccessTokenError');
  });

  it('returns forceLogout when token endpoint responds with non-ok status', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    expect(result.forceLogout).toBe(true);
  });

  it('deduplicates concurrent refreshes that share a refresh_token', async () => {
    let tokenEndpointCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === DISCOVERY_URL) {
          return { ok: true, json: async () => MOCK_DISCOVERY };
        }
        if (url === MOCK_DISCOVERY.token_endpoint) {
          tokenEndpointCalls += 1;
          await new Promise((r) => setTimeout(r, 10));
          return {
            ok: true,
            json: async () => ({
              access_token: 'new-at',
              refresh_token: 'new-rt',
              expires_in: 3600,
              id_token: 'new-id',
            }),
          };
        }
        return { ok: false, json: async () => ({}) };
      }),
    );

    const { refreshOidcAccessToken } = await import('../oidc');
    const token = makeToken({ refreshToken: 'shared-rt' });

    const [a, b] = await Promise.all([
      refreshOidcAccessToken(token, VALID_ENV),
      refreshOidcAccessToken(token, VALID_ENV),
    ]);

    expect(tokenEndpointCalls).toBe(1);
    expect(a.error).toBeUndefined();
    expect(b.error).toBeUndefined();
    expect(a.accessToken).toBe('new-at');
    expect(b.accessToken).toBe('new-at');
  });

  it('preserves the existing idToken when refresh response returns empty string', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600, id_token: '' },
      },
    ]);

    const { refreshOidcAccessToken } = await import('../oidc');
    const token = makeToken({ idToken: 'original-id-token' });
    const result = await refreshOidcAccessToken(token, VALID_ENV);

    expect(result.idToken).toBe('original-id-token');
  });
});

describe('refreshOidcAccessToken — transient retry', () => {
  function stubTokenFetch(
    handler: (call: number) => Promise<{ ok: boolean; status: number; body: unknown }>,
  ) {
    let tokenCalls = 0;
    const counter = { get: () => tokenCalls };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === DISCOVERY_URL) {
          return { ok: true, status: 200, json: async () => MOCK_DISCOVERY };
        }
        if (url === MOCK_DISCOVERY.token_endpoint) {
          tokenCalls += 1;
          const { ok, status, body } = await handler(tokenCalls);
          return { ok, status, json: async () => body };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    return counter;
  }

  it('retries once on a 5xx and succeeds on the second attempt', async () => {
    const counter = stubTokenFetch(async (call) =>
      call === 1
        ? { ok: false, status: 503, body: {} }
        : {
            ok: true,
            status: 200,
            body: {
              access_token: 'retry-at',
              refresh_token: 'retry-rt',
              expires_in: 3600,
              id_token: 'id',
            },
          },
    );
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);

    expect(counter.get()).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.accessToken).toBe('retry-at');
  });

  it('does NOT retry on a 4xx (invalid_grant) and forces logout', async () => {
    const counter = stubTokenFetch(async () => ({
      ok: false,
      status: 400,
      body: { error: 'invalid_grant' },
    }));
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);

    expect(counter.get()).toBe(1);
    expect(result.forceLogout).toBe(true);
    expect(result.error).toBe('RefreshAccessTokenError');
  });

  it('retries once when the connection was refused (never sent) then succeeds', async () => {
    let tokenCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === DISCOVERY_URL)
          return { ok: true, status: 200, json: async () => MOCK_DISCOVERY };
        if (url === MOCK_DISCOVERY.token_endpoint) {
          tokenCalls += 1;
          if (tokenCalls === 1)
            throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
          return {
            ok: true,
            status: 200,
            json: async () => ({
              access_token: 'net-at',
              refresh_token: 'net-rt',
              expires_in: 3600,
            }),
          };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);

    expect(tokenCalls).toBe(2);
    expect(result.accessToken).toBe('net-at');
  });

  it('gives up after exhausting retries on repeated 503', async () => {
    const counter = stubTokenFetch(async () => ({ ok: false, status: 503, body: {} }));
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);

    expect(counter.get()).toBe(2);
    expect(result.forceLogout).toBe(true);
    expect(result.error).toBe('RefreshAccessTokenError');
  });
});

describe('refreshOidcAccessToken — never replays a refresh token the IdP may have consumed', () => {
  // The IdP keeps a durable tombstone for every rotated-out refresh token:
  // presenting one again, at any time, revokes the session. After an ambiguous
  // failure the token may already be spent, so a retry must not happen.
  function stubTokenFailure(fail: () => never | { ok: boolean; status: number }) {
    let tokenCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === DISCOVERY_URL)
          return { ok: true, status: 200, json: async () => MOCK_DISCOVERY };
        if (url === MOCK_DISCOVERY.token_endpoint) {
          tokenCalls += 1;
          const outcome = fail();
          return { ...outcome, json: async () => ({}) };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );
    return () => tokenCalls;
  }

  it.each([
    ['a 502 from the gateway', () => ({ ok: false, status: 502 })],
    ['a 504 from the gateway', () => ({ ok: false, status: 504 })],
    ['a 500', () => ({ ok: false, status: 500 })],
    [
      'a reset after sending',
      () => {
        throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
      },
    ],
    [
      'a timeout (abort)',
      () => {
        throw new DOMException('The operation was aborted.', 'AbortError');
      },
    ],
  ])('does not retry after %s', async (_label, fail) => {
    const calls = stubTokenFailure(fail as () => never);
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    expect(calls()).toBe(1);
    expect(result.error).toBe('RefreshAccessTokenError');
  });
});

describe('refreshOidcAccessToken — rotation recovery cache', () => {
  it('caches the rotated result so getRecoveredToken returns it for the old token', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: {
          access_token: 'new-at',
          refresh_token: 'new-rt',
          expires_in: 3600,
          id_token: 'new-id',
        },
      },
    ]);
    const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
    expect(result.refreshToken).toBe('new-rt');

    const recovered = await getRecoveredToken('old-rt');
    expect(recovered).not.toBeNull();
    expect(recovered!.refreshToken).toBe('new-rt');
    expect(recovered!.accessToken).toBe('new-at');
    expect(recovered!.error).toBeUndefined();
    expect(recovered!.forceLogout).toBe(false);
  });

  it('does not cache when the refresh token is reused (no rotation)', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: {
          access_token: 'new-at',
          refresh_token: 'old-rt',
          expires_in: 3600,
          id_token: 'new-id',
        },
      },
    ]);
    const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

    await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
    expect(await getRecoveredToken('old-rt')).toBeNull();
  });

  it('expires a cached rotation after the TTL', async () => {
    vi.useFakeTimers();
    try {
      mockFetch([
        { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
        {
          url: MOCK_DISCOVERY.token_endpoint,
          body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 3600 },
        },
      ]);
      const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

      await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);
      expect(await getRecoveredToken('old-rt')).not.toBeNull();

      // Must outlive the template's 600s backstop poll: that poll is the last
      // persist-capable read guaranteed to happen after an RSC rotation when
      // the adaptive watcher's timer never fired (background tab, closed tab).
      vi.advanceTimersByTime(600_000 + 60_000);
      expect(await getRecoveredToken('old-rt')).not.toBeNull();

      vi.advanceTimersByTime(15 * 60_000);
      expect(await getRecoveredToken('old-rt')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('follows a two-rotation chain to the newest token, and never re-presents a spent one', async () => {
    const posted: string[] = [];
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: { body?: URLSearchParams }) => {
        if (url === DISCOVERY_URL)
          return { ok: true, status: 200, json: async () => MOCK_DISCOVERY };
        posted.push(init!.body!.get('refresh_token')!);
        n++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: `at-${n}`,
            refresh_token: `rt-${n}`,
            expires_in: 60,
          }),
        };
      }),
    );
    const { refreshOidcAccessToken, getRecoveredToken } = await import('../oidc');

    // Two RSC rotations, neither persisted: rt-0 → rt-1 → rt-2.
    await refreshOidcAccessToken(makeToken({ refreshToken: 'rt-0' }), VALID_ENV);
    await refreshOidcAccessToken(makeToken({ refreshToken: 'rt-1' }), VALID_ENV);

    // The cookie still holds rt-0: recovery must land on rt-2, not the spent rt-1.
    const recovered = await getRecoveredToken('rt-0');
    expect(recovered?.refreshToken).toBe('rt-2');
    expect(recovered?.accessToken).toBe('at-2');

    // A refresh handed the stale rt-0 adopts rt-2 while its access token is valid…
    const adopted = await refreshOidcAccessToken(makeToken({ refreshToken: 'rt-0' }), VALID_ENV);
    expect(adopted.refreshToken).toBe('rt-2');
    expect(posted).toEqual(['rt-0', 'rt-1']);

    // …and once it has expired, spends the live rt-2, never the spent rt-0/rt-1.
    const later = Date.now() + 5 * 60_000; // past the 60s access token, inside the recovery TTL
    const now = vi.spyOn(Date, 'now').mockReturnValue(later);
    try {
      const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'rt-0' }), VALID_ENV);
      expect(posted).toEqual(['rt-0', 'rt-1', 'rt-2']);
      expect(result.refreshToken).toBe('rt-3');
    } finally {
      now.mockRestore();
    }
  });

  it('getRecoveredToken stops on a cycle in the store', async () => {
    const { configureOidcTokenRecoveryStore, getRecoveredToken } = await import('../oidc');
    const a = makeToken({ refreshToken: 'rt-b', accessToken: 'at-a' });
    const b = makeToken({ refreshToken: 'rt-a', accessToken: 'at-b' });
    const get = vi.fn(async (key: string) => (key === 'rt-a' ? a : key === 'rt-b' ? b : null));
    configureOidcTokenRecoveryStore({ get, set: vi.fn(async () => {}) });

    expect(await getRecoveredToken('rt-a')).toEqual(b);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('getRecoveredToken returns null for an unknown or missing token', async () => {
    const { getRecoveredToken } = await import('../oidc');
    expect(await getRecoveredToken('never-seen')).toBeNull();
    expect(await getRecoveredToken(undefined)).toBeNull();
  });
});

describe('buildEndSessionUrl', () => {
  it('builds URL with id_token_hint, post_logout_redirect_uri, and client_id', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe('http://localhost:9090/connect/logout');
    expect(parsed.searchParams.get('id_token_hint')).toBe('id-token-abc');
    expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe('http://app/login');
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
  });

  it('uses the id_token of a rotation held in the recovery store', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl, configureOidcTokenRecoveryStore } = await import('../oidc');
    const rotated = makeToken({ refreshToken: 'rt-new', accessToken: 'at-new', idToken: 'id-new' });
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) => (key === 'rt-old' ? rotated : null)),
      set: vi.fn(async () => {}),
    });

    const url = await buildEndSessionUrl(
      makeToken({ refreshToken: 'rt-old', idToken: 'id-old' }),
      VALID_ENV,
      'http://app/login',
    );

    expect(new URL(url!).searchParams.get('id_token_hint')).toBe('id-new');
  });

  it('returns null when end_session_endpoint is absent from discovery', async () => {
    const { end_session_endpoint: _, ...discoveryWithout } = MOCK_DISCOVERY;
    mockFetch([{ url: DISCOVERY_URL, body: discoveryWithout }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');
    expect(url).toBeNull();
  });

  it('builds URL without id_token_hint when idToken is absent', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(
      makeToken({ idToken: undefined }),
      VALID_ENV,
      'http://app/login',
    );

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.origin + parsed.pathname).toBe('http://localhost:9090/connect/logout');
    expect(parsed.searchParams.has('id_token_hint')).toBe(false);
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
    expect(parsed.searchParams.get('post_logout_redirect_uri')).toBe('http://app/login');
  });

  it('returns null for none provider without making any fetch calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(
      { authProviderId: 'none' },
      { AUTH_PROVIDER: 'none' },
      'http://app/login',
    );

    expect(url).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('builds URL without id_token_hint when idToken is an empty string', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: '' }), VALID_ENV, 'http://app/login');

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.has('id_token_hint')).toBe(false);
    expect(parsed.searchParams.get('client_id')).toBe('test-client');
  });
});

// ─── configureOidcTokenRecoveryStore ─────────────────────────────────────────

describe('refreshOidcAccessToken — expiry when the IdP omits or mangles expires_in', () => {
  // Same resolution order as sign-in (`resolveInitialExpiry` in ./config):
  // the response's expires_in, then the new access token's own `exp`, then a
  // SHORT self-correcting fallback. This path used to invent a full hour, the
  // exact guess sign-in had already been fixed for: a ~3-minute token looked
  // healthy for 57 minutes of guaranteed 401s after every refresh.
  const NOW = Date.parse('2026-01-01T00:00:00.000Z');

  function jwtWithExp(expSeconds: number): string {
    const b64 = (v: string) =>
      Buffer.from(v, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return [b64('{"alg":"none"}'), b64(JSON.stringify({ exp: expSeconds })), 'sig'].join('.');
  }

  async function refreshWith(body: Record<string, unknown>) {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');
    return refreshOidcAccessToken(makeToken(), VALID_ENV);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the new access token's own exp when expires_in is absent", async () => {
    const result = await refreshWith({ access_token: jwtWithExp(NOW / 1000 + 180) });
    expect(result.expiresAt).toBe(NOW + 180_000);
  });

  it('ignores a non-numeric expires_in and falls through to the token exp', async () => {
    const result = await refreshWith({
      access_token: jwtWithExp(NOW / 1000 + 180),
      expires_in: 'not-a-number',
    });
    expect(result.expiresAt).toBe(NOW + 180_000);
  });

  it('uses the same short, self-correcting fallback as sign-in for an opaque token', async () => {
    const result = await refreshWith({ access_token: 'opaque-not-a-jwt' });
    expect(result.expiresAt).toBe(NOW + 5 * 60_000);
    expect(result.expiresAt).toBeLessThan(NOW + 3600 * 1000);
  });
});

describe('configureOidcTokenRecoveryStore', () => {
  it('routes getRecoveredToken reads through the injected store', async () => {
    const { configureOidcTokenRecoveryStore, getRecoveredToken } = await import('../oidc');
    const stored = makeToken({ refreshToken: 'rt-from-store', accessToken: 'at-from-store' });
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) => (key === 'consumed-rt' ? stored : null)),
      set: vi.fn(async () => {}),
    });

    expect(await getRecoveredToken('consumed-rt')).toEqual(stored);
    expect(await getRecoveredToken('other')).toBeNull();
  });

  it('shares the configured store across module copies via globalThis', async () => {
    const first = await import('../oidc');
    const stored = makeToken({ refreshToken: 'rt-shared', accessToken: 'at-shared' });
    first.configureOidcTokenRecoveryStore({
      get: vi.fn(async () => stored),
      set: vi.fn(async () => {}),
    });

    vi.resetModules();
    const second = await import('../oidc');

    expect(await second.getRecoveredToken('anything')).toEqual(stored);
  });

  it('writes rotated results through the injected store', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', refresh_token: 'new-rt', expires_in: 180 },
      },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    const set = vi.fn(async () => {});
    configureOidcTokenRecoveryStore({ get: vi.fn(async () => null), set });

    await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(set).toHaveBeenCalledWith(
      'old-rt',
      expect.objectContaining({ accessToken: 'new-at', refreshToken: 'new-rt' }),
      expect.any(Number),
    );
  });

  it('recovers from a permanent refresh rejection when another replica already rotated', async () => {
    // 4xx from the token endpoint = invalid_grant (token consumed elsewhere).
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    const rotatedElsewhere = makeToken({
      refreshToken: 'new-rt-from-pod-a',
      accessToken: 'at-from-pod-a',
      expiresAt: Date.now() + 180_000,
    });
    // The rotation lands only AFTER the pre-POST peek: the first read misses.
    let oldRtReads = 0;
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) =>
        key === 'old-rt' && oldRtReads++ > 0 ? rotatedElsewhere : null,
      ),
      set: vi.fn(async () => {}),
    });

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(oldRtReads).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.accessToken).toBe('at-from-pod-a');
    expect(result.refreshToken).toBe('new-rt-from-pod-a');
  });

  it('treats a throwing store as a cache miss and still fails closed on rejection', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { error: 'invalid_grant' }, ok: false },
    ]);
    const { configureOidcTokenRecoveryStore, refreshOidcAccessToken } = await import('../oidc');
    configureOidcTokenRecoveryStore({
      get: vi.fn(async () => {
        throw new Error('store down');
      }),
      set: vi.fn(async () => {
        throw new Error('store down');
      }),
    });

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

    expect(result.error).toBe('RefreshAccessTokenError');
    expect(result.forceLogout).toBe(true);
  });
});

describe('buildEndSessionUrl — post_logout_redirect_uri validation', () => {
  const ENV_WITH_URL = { ...VALID_ENV, NEXTAUTH_URL: 'http://app.example/apps/t/api/auth' };

  it('honours a same-origin absolute URI', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(
      makeToken(),
      ENV_WITH_URL,
      'http://app.example/apps/t/login',
    );
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe(
      'http://app.example/apps/t/login',
    );
  });

  it('rejects an off-origin URI and falls back to the app origin', async () => {
    // The value reaches the framework from a Server Action parameter — a
    // publicly callable endpoint — so it is attacker controlled.
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(makeToken(), ENV_WITH_URL, 'https://evil.example/steal');
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe('http://app.example');
  });

  it('rejects a javascript: URI', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(makeToken(), ENV_WITH_URL, 'javascript:alert(1)');
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe('http://app.example');
  });

  it('resolves a relative path against the app origin', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(makeToken(), ENV_WITH_URL, '/apps/t/login');
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe(
      'http://app.example/apps/t/login',
    );
  });

  it('honours an explicitly allowlisted foreign origin', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(
      makeToken(),
      { ...ENV_WITH_URL, IGRP_AUTH_POST_LOGOUT_ALLOWED_ORIGINS: 'https://portal.example' },
      'https://portal.example/bye',
    );
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe(
      'https://portal.example/bye',
    );
  });
});

describe('refreshOidcAccessToken — concurrent callers do not share custom fields', () => {
  it("applies the shared refresh result to each caller's OWN token", async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      {
        url: MOCK_DISCOVERY.token_endpoint,
        body: { access_token: 'new-at', id_token: 'new-it', expires_in: 300 },
      },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');

    // Same refresh token (so the in-flight dedup collapses them), different
    // custom fields put there by a callbacks.jwt extension.
    const a = { ...makeToken(), tenant: 'alpha' } as never;
    const b = { ...makeToken(), tenant: 'beta' } as never;

    const [ra, rb] = await Promise.all([
      refreshOidcAccessToken(a, VALID_ENV),
      refreshOidcAccessToken(b, VALID_ENV),
    ]);

    // Both get the same refreshed auth material...
    expect(ra.accessToken).toBe('new-at');
    expect(rb.accessToken).toBe('new-at');
    // ...and each keeps its own custom claim.
    expect((ra as unknown as { tenant: string }).tenant).toBe('alpha');
    expect((rb as unknown as { tenant: string }).tenant).toBe('beta');
  });
});

// ─── Custom (unmanaged) providers ─────────────────────────────────────────────

describe('OIDC helpers — a provider this package does not manage', () => {
  // Regression: a custom provider passed to `withIGRPAuth` has no entry in the
  // registry, so `getAuthProviderDiscoveryUrl` resolved to '' and `fetch('')`
  // threw — turning every first refresh of a healthy session into a forced
  // logout. There is nothing to refresh or revoke against, so the
  // helpers must no-op rather than fail destructively.
  const customToken = () => makeToken({ authProviderId: 'github' });

  it('refreshOidcAccessToken leaves the token alone instead of forcing a logout', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { refreshOidcAccessToken } = await import('../oidc');

    const token = customToken();
    const result = await refreshOidcAccessToken(token, VALID_ENV);

    expect(result.error).toBeUndefined();
    expect(result.forceLogout).toBeFalsy();
    expect(result.accessToken).toBe(token.accessToken);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('revokeOidcSession reports why it skipped', async () => {
    const { revokeOidcSession } = await import('../oidc');
    const result = await revokeOidcSession(customToken(), VALID_ENV);
    expect(result).toEqual({ ok: false, reason: 'provider_not_managed' });
  });

  it('buildEndSessionUrl returns null rather than a malformed URL', async () => {
    const { buildEndSessionUrl } = await import('../oidc');
    expect(await buildEndSessionUrl(customToken(), VALID_ENV, 'http://localhost:3000')).toBeNull();
  });
});

// ─── Recovery-store lifecycle ─────────────────────────────────────────────────

describe('forgetRecoveredToken', () => {
  it('drops the entry so a signed-out session is not left in the store', async () => {
    const {
      createInMemoryTokenRecoveryStore,
      configureOidcTokenRecoveryStore,
      getRecoveredToken,
      forgetRecoveredToken,
    } = await import('../oidc');
    const store = createInMemoryTokenRecoveryStore();
    configureOidcTokenRecoveryStore(store);

    await store.set('consumed-rt', makeToken({ accessToken: 'rotated' }), 60_000);
    expect(await getRecoveredToken('consumed-rt')).not.toBeNull();

    await forgetRecoveredToken('consumed-rt');
    expect(await getRecoveredToken('consumed-rt')).toBeNull();
  });

  it('is a no-op for a store that does not implement delete', async () => {
    const { configureOidcTokenRecoveryStore, forgetRecoveredToken } = await import('../oidc');
    configureOidcTokenRecoveryStore({
      get: async () => null,
      set: async () => {},
    });
    await expect(forgetRecoveredToken('anything')).resolves.toBeUndefined();
  });
});

describe('isUsableRecoveredToken', () => {
  it('accepts a stale entry — it still carries the rotated refresh token', async () => {
    const { isUsableRecoveredToken } = await import('../oidc');
    expect(
      isUsableRecoveredToken(makeToken({ accessToken: 'at', expiresAt: Date.now() - 60_000 })),
    ).toBe(true);
  });

  it('rejects entries with no access token or a carried error', async () => {
    const { isUsableRecoveredToken } = await import('../oidc');
    expect(isUsableRecoveredToken(null)).toBe(false);
    expect(isUsableRecoveredToken(makeToken({ accessToken: undefined }))).toBe(false);
    expect(isUsableRecoveredToken(makeToken({ accessToken: '' }))).toBe(false);
    expect(isUsableRecoveredToken(makeToken({ error: 'RefreshAccessTokenError' }))).toBe(false);
  });
});

describe('token-endpoint client authentication', () => {
  // RFC 6749 §2.3.1: a server MUST support HTTP Basic for clients with a
  // secret and only MAY support `client_secret_post`. Refresh and revocation
  // once posted the secret in the body, so an authorization server registered
  // for a single method broke one side.
  function tokenEndpointCall(url: string): RequestInit {
    const call = vi
      .mocked(fetch)
      .mock.calls.find(([calledUrl]) => calledUrl === url) as unknown as [string, RequestInit];
    expect(call, `expected a call to ${url}`).toBeDefined();
    return call[1];
  }

  it('authenticates the refresh grant with a Basic header, not a client_secret in the body', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { access_token: 'new-at', expires_in: 60 } },
    ]);
    const { refreshOidcAccessToken } = await import('../oidc');
    await refreshOidcAccessToken(makeToken(), VALID_ENV);

    const init = tokenEndpointCall(MOCK_DISCOVERY.token_endpoint);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa('test-client:test-secret')}`,
    );
    expect((init.body as URLSearchParams).has('client_secret')).toBe(false);
  });

  it('authenticates revocation with a Basic header, not a client_secret in the body', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.revocation_endpoint, body: {} },
    ]);
    const { revokeOidcSession } = await import('../oidc');
    await revokeOidcSession(makeToken(), VALID_ENV);

    const init = tokenEndpointCall(MOCK_DISCOVERY.revocation_endpoint);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa('test-client:test-secret')}`,
    );
    expect((init.body as URLSearchParams).has('client_secret')).toBe(false);
  });
});

describe('client credentials from a mounted secret file', () => {
  // `kubectl create secret --from-file` keeps the file's trailing newline.
  const ENV_WITH_NEWLINES = {
    ...VALID_ENV,
    IGRP_AUTH_CLIENT_ID: 'test-client\n',
    IGRP_AUTH_CLIENT_SECRET: 'test-secret\n',
  };

  it('trims them for the refresh Basic header and the end-session client_id', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.token_endpoint, body: { access_token: 'new-at', expires_in: 60 } },
    ]);
    const { refreshOidcAccessToken, buildEndSessionUrl } = await import('../oidc');
    await refreshOidcAccessToken(makeToken(), ENV_WITH_NEWLINES);
    const url = await buildEndSessionUrl(makeToken(), ENV_WITH_NEWLINES, 'http://app/login');

    const call = vi
      .mocked(fetch)
      .mock.calls.find(([u]) => u === MOCK_DISCOVERY.token_endpoint) as unknown as [
      string,
      RequestInit,
    ];
    expect((call[1].headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa('test-client:test-secret')}`,
    );
    expect(new URL(url!).searchParams.get('client_id')).toBe('test-client');
  });
});

describe('refreshOidcAccessToken — discovery failure', () => {
  it('keeps the session (no error, no forceLogout) so the next read retries', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchSpy = vi.fn((_url: string) => Promise.reject(new TypeError('fetch failed')));
    vi.stubGlobal('fetch', fetchSpy);
    const { refreshOidcAccessToken } = await import('../oidc');

    const token = makeToken();
    const result = await refreshOidcAccessToken(token, VALID_ENV);

    expect(result).toEqual(token);
    expect(result.error).toBeUndefined();
    expect(result.forceLogout).toBeFalsy();
    // Only discovery was attempted: the refresh token never left.
    expect(fetchSpy.mock.calls.every(([u]) => u === DISCOVERY_URL)).toBe(true);
  });
});

describe('refreshOidcAccessToken — malformed success response', () => {
  it('treats a non-JSON 200 from the token endpoint as a failed refresh instead of throwing', async () => {
    // A proxy answering 200 with an HTML error page made `response.json()`
    // reject; every deduped awaiter then rejected and the jwt callback logged
    // "threw unexpectedly". It is a failed refresh like any other.
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url === DISCOVERY_URL
            ? { ok: true, status: 200, json: () => Promise.resolve(MOCK_DISCOVERY) }
            : {
                ok: true,
                status: 200,
                json: () => Promise.reject(new SyntaxError('Unexpected token <')),
              },
        ),
      ),
    );
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);
    expect(result.error).toBe('RefreshAccessTokenError');
    expect(result.forceLogout).toBe(true);
  });

  it('gives up on a token-endpoint body that stalls, without retrying the refresh', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve(
          url === DISCOVERY_URL
            ? { ok: true, status: 200, json: () => Promise.resolve(MOCK_DISCOVERY) }
            : { ok: true, status: 200, json: () => new Promise(() => {}) },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);
      const { refreshOidcAccessToken } = await import('../oidc');
      const pending = refreshOidcAccessToken(makeToken(), VALID_ENV);
      await vi.advanceTimersByTimeAsync(10_000);
      const result = await pending;
      expect(result.error).toBe('RefreshAccessTokenError');
      expect(
        fetchMock.mock.calls.filter(([url]) => url === MOCK_DISCOVERY.token_endpoint),
      ).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('getOpenIdConfiguration — poisoned-entry eviction', () => {
  it('does not evict a newer discovery entry when an older failed fetch finally settles', async () => {
    vi.useFakeTimers();
    try {
      let rejectFirst!: (reason: unknown) => void;
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              rejectFirst = reject;
            }),
        )
        .mockImplementation(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(MOCK_DISCOVERY),
          }),
        );
      vi.stubGlobal('fetch', fetchMock);
      const { buildEndSessionUrl } = await import('../oidc');
      const endSession = () => buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');

      // 1. First discovery fetch hangs.
      const first = endSession();
      // 2. Its cache entry ages past the TTL; the next call fetches discovery again.
      vi.advanceTimersByTime(5 * 60_000 + 1);
      await endSession();
      // 3. The ORIGINAL fetch now fails. Its cleanup must not drop the entry from step 2.
      rejectFirst(new Error('boom'));
      await first.catch(() => {});
      // 4. A third call must hit the cache, not the network.
      await endSession();

      const discoveryFetches = fetchMock.mock.calls.filter(([url]) => url === DISCOVERY_URL);
      expect(discoveryFetches).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('getOpenIdConfiguration — stalled body', () => {
  it('times out a discovery body that never finishes and evicts the cache entry', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({ ok: true, status: 200, json: () => new Promise(() => {}) }),
        )
        .mockImplementation(() =>
          Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(MOCK_DISCOVERY) }),
        );
      vi.stubGlobal('fetch', fetchMock);
      const { buildEndSessionUrl } = await import('../oidc');
      const endSession = () => buildEndSessionUrl(makeToken(), VALID_ENV, 'http://app/login');

      const first = endSession().then(
        () => 'resolved',
        () => 'rejected',
      );
      await vi.advanceTimersByTimeAsync(4_000);
      expect(await first).toBe('rejected');

      // The stalled entry is gone: the next call fetches discovery again and succeeds.
      expect(await endSession()).not.toBeNull();
      expect(fetchMock.mock.calls.filter(([url]) => url === DISCOVERY_URL)).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('buildEndSessionUrl — relative post_logout_redirect_uri under a basePath', () => {
  const ENV_WITH_URL = { ...VALID_ENV, NEXTAUTH_URL: 'http://app.example/apps/t/api/auth' };

  it('resolves a path that does not carry the basePath against the app base, not the host root', async () => {
    // `/login` for an app at `/apps/t` is `/apps/t/login`; resolving against
    // the bare origin sent the browser to a route this app does not serve.
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');
    const url = await buildEndSessionUrl(makeToken(), ENV_WITH_URL, '/login');
    expect(new URL(url!).searchParams.get('post_logout_redirect_uri')).toBe(
      'http://app.example/apps/t/login',
    );
  });

  it('falls back to process.env.NODE_ENV for its dev-only warnings when the env map has none', async () => {
    // `withIGRPAuth` resolves NODE_ENV with a process fallback; this helper read
    // only the map, so a validated env without NODE_ENV was always "dev".
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { buildEndSessionUrl } = await import('../oidc');
      await buildEndSessionUrl(
        makeToken({ authProviderId: 'none' }),
        { AUTH_PROVIDER: 'none' },
        '/',
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      vi.unstubAllEnvs();
    }
  });
});

describe('revokeOidcSession — never throws, as its result type promises', () => {
  it('reports missing client configuration as a tagged result', async () => {
    mockFetch([]);
    const { revokeOidcSession } = await import('../oidc');
    const result = await revokeOidcSession(makeToken(), { AUTH_PROVIDER: 'igrp-auth' });
    expect(result).toMatchObject({ ok: false, reason: 'not_configured' });
  });

  it('reports a failed discovery fetch as a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
    );
    const { revokeOidcSession } = await import('../oidc');
    const result = await revokeOidcSession(makeToken(), VALID_ENV);
    expect(result).toMatchObject({ ok: false, reason: 'network_error' });
  });
});
