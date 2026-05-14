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
        json: () => Promise.resolve(match?.body ?? {}),
      });
    }),
  );
}

// ─── Cache reset between tests ────────────────────────────────────────────────

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules(); // gives each test a fresh openIdConfigurationCache
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

  it('returns null when token has no idToken', async () => {
    mockFetch([{ url: DISCOVERY_URL, body: MOCK_DISCOVERY }]);
    const { buildEndSessionUrl } = await import('../oidc');

    const url = await buildEndSessionUrl(makeToken({ idToken: undefined }), VALID_ENV, 'http://app/login');
    expect(url).toBeNull();
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

  it('returns true (fail-open) when accessToken is missing', async () => {
    const { introspectOidcToken } = await import('../oidc');
    expect(await introspectOidcToken(makeToken({ accessToken: undefined }), VALID_ENV)).toBe(true);
  });

  it('returns true (fail-open) for none provider without making fetch calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { introspectOidcToken } = await import('../oidc');

    expect(await introspectOidcToken({ authProviderId: 'none' }, { AUTH_PROVIDER: 'none' })).toBe(true);
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
});
