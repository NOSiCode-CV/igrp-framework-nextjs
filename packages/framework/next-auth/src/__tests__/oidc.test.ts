import { describe, it, expect, vi, afterEach } from 'vitest';
import type { JWT } from '../jwt';

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
  introspection_endpoint: 'http://localhost:9090/oauth2/introspect',
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

  it('retries once after a network error then succeeds', async () => {
    let tokenCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === DISCOVERY_URL)
          return { ok: true, status: 200, json: async () => MOCK_DISCOVERY };
        if (url === MOCK_DISCOVERY.token_endpoint) {
          tokenCalls += 1;
          if (tokenCalls === 1) throw new Error('ECONNRESET');
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

  it('gives up after exhausting retries on repeated 5xx', async () => {
    const counter = stubTokenFetch(async () => ({ ok: false, status: 502, body: {} }));
    const { refreshOidcAccessToken } = await import('../oidc');
    const result = await refreshOidcAccessToken(makeToken(), VALID_ENV);

    expect(counter.get()).toBe(2);
    expect(result.forceLogout).toBe(true);
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

      vi.advanceTimersByTime(180_000 + 1000);
      expect(await getRecoveredToken('old-rt')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
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

describe('introspectOidcToken', () => {
  it('returns true when IdP responds with active: true', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { active: true } },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns false when IdP responds with active: false', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { active: false } },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(false);
  });

  it('returns true (fail-open) when introspection_endpoint is absent from discovery', async () => {
    const { introspection_endpoint: _, ...discoveryWithout } = MOCK_DISCOVERY;
    mockFetch([{ url: DISCOVERY_URL, body: discoveryWithout }]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) when introspection endpoint returns non-ok status', async () => {
    mockFetch([
      { url: DISCOVERY_URL, body: MOCK_DISCOVERY },
      { url: MOCK_DISCOVERY.introspection_endpoint, body: { error: 'server_error' }, ok: false },
    ]);
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken(), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) when refreshToken is missing', async () => {
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken({ refreshToken: undefined }), VALID_ENV)).toBe(true);
  });

  it('introspects the refresh token, not the access token', async () => {
    const capturedBody: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === MOCK_DISCOVERY.introspection_endpoint) {
          capturedBody.push(String(init?.body ?? ''));
        }
        const bodies: Record<string, unknown> = {
          [DISCOVERY_URL]: MOCK_DISCOVERY,
          [MOCK_DISCOVERY.introspection_endpoint]: { active: true },
        };
        return Promise.resolve({ ok: true, json: () => Promise.resolve(bodies[url] ?? {}) });
      }),
    );
    const { introspectOidcToken } = await import('../oidc');
    await introspectOidcToken(
      makeToken({ refreshToken: 'rt-xyz', accessToken: 'at-xyz' }),
      VALID_ENV,
    );

    const params = new URLSearchParams(capturedBody[0]);
    expect(params.get('token')).toBe('rt-xyz');
    expect(params.get('token_type_hint')).toBe('refresh_token');
  });

  it('returns true (fail-open) for none provider without making fetch calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { introspectOidcToken } = await import('../oidc');

    expect(await introspectOidcToken({ authProviderId: 'none' }, { AUTH_PROVIDER: 'none' })).toBe(
      true,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends Basic auth header with base64-encoded clientId:clientSecret', async () => {
    const capturedInit: RequestInit[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === MOCK_DISCOVERY.introspection_endpoint) capturedInit.push(init ?? {});
        const bodies: Record<string, unknown> = {
          [DISCOVERY_URL]: MOCK_DISCOVERY,
          [MOCK_DISCOVERY.introspection_endpoint]: { active: true },
        };
        return Promise.resolve({ ok: true, json: () => Promise.resolve(bodies[url] ?? {}) });
      }),
    );
    const { introspectOidcToken } = await import('../oidc');
    await introspectOidcToken(makeToken(), VALID_ENV);

    const headers = capturedInit[0]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Basic ${btoa('test-client:test-secret')}`);
  });

  it('passes an abort signal (timeout) to the introspection request (NA-1)', async () => {
    const fetchSpy = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes('.well-known')) {
        return { ok: true, json: async () => MOCK_DISCOVERY } as Response;
      }
      return { ok: true, json: async () => ({ active: true }) } as Response;
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { introspectOidcToken } = await import('../oidc');
    await introspectOidcToken(makeToken(), VALID_ENV);

    expect(fetchSpy).toHaveBeenCalledWith(
      MOCK_DISCOVERY.introspection_endpoint,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('fails open when the introspection request exceeds the timeout (NA-1)', async () => {
    vi.useFakeTimers();
    try {
      const fetchSpy = vi.fn((url: string | URL, init?: RequestInit) => {
        const u = String(url);
        if (u.includes('.well-known')) {
          return Promise.resolve({ ok: true, json: async () => MOCK_DISCOVERY } as Response);
        }
        // Hang forever; only reject when the timeout aborts us — mirrors a
        // stalled IdP. Without a signal this promise never settles and the
        // test times out, which is exactly the bug being fixed.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          );
        });
      });
      vi.stubGlobal('fetch', fetchSpy);

      const { introspectOidcToken } = await import('../oidc');
      const resultPromise = introspectOidcToken(makeToken(), VALID_ENV);
      await vi.advanceTimersByTimeAsync(5000); // > IDP_FETCH_TIMEOUT_MS (4000)
      await expect(resultPromise).resolves.toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ─── configureOidcTokenRecoveryStore ─────────────────────────────────────────

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
    configureOidcTokenRecoveryStore({
      get: vi.fn(async (key: string) => (key === 'old-rt' ? rotatedElsewhere : null)),
      set: vi.fn(async () => {}),
    });

    const result = await refreshOidcAccessToken(makeToken({ refreshToken: 'old-rt' }), VALID_ENV);

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
