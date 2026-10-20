import { afterEach, describe, expect, it, vi } from 'vitest';
import { decode as plainDecode, encode as plainEncode } from 'next-auth/jwt';

import {
  configureIGRPSessionStore,
  createMemorySessionStore,
  createSessionTokenDecoder,
  createSessionTokenEncoder,
  decodeIGRPSessionToken,
  deleteStoredSession,
  refreshUnderSessionLock,
  SESSION_ID_CLAIM,
  SESSION_STORE_KEY_PREFIX,
  type IGRPSessionStore,
} from '../session-store';
import type { JWT } from '../jwt';

const SECRET = 'test-secret-key';

/** base64url without padding — enough to fake a JWT segment. */
function b64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

/**
 * An access token shaped like Access Management's: a JWS whose payload embeds
 * the user's permission list. 58 permissions measured 4.7 KB in the
 * 2026-10-13 incident's sibling environment; this lands in the same range.
 */
function fakeAccessToken(permissionCount = 58): string {
  const permissions = Array.from(
    { length: permissionCount },
    (_, i) => `DEPARTAMENTO_${String(i).padStart(3, '0')}.permissao_de_gestao_${i}`,
  );
  const payload = {
    sub: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    iss: 'https://api-demoigrp.nosi.cv/igrp-access-management',
    aud: 'igrp-access-management',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    org: 'DEPARTAMENTO_000',
    roles: ['ROLE_USER', 'ROLE_GESTOR'],
    permissions,
  };
  return `${b64url('{"alg":"RS256","kid":"k1"}')}.${b64url(JSON.stringify(payload))}.${'s'.repeat(342)}`;
}

function fakeIdToken(): string {
  const payload = {
    sub: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    iss: 'https://api-demoigrp.nosi.cv/igrp-access-management',
    aud: 'igrp-access-management',
    email: 'utilizador.exemplo@nosi.cv',
    nonce: 'n'.repeat(43),
    sid: 'x'.repeat(36),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };
  return `${b64url('{"alg":"RS256","kid":"k1"}')}.${b64url(JSON.stringify(payload))}.${'s'.repeat(342)}`;
}

function sessionToken(overrides: Partial<JWT> = {}): JWT {
  return {
    name: 'Utilizador Exemplo',
    email: 'utilizador.exemplo@nosi.cv',
    sub: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    authProviderId: 'igrp-auth',
    accessToken: fakeAccessToken(),
    refreshToken: `rt-${'r'.repeat(600)}`,
    idToken: fakeIdToken(),
    expiresAt: Date.now() + 3_600_000,
    ...overrides,
  };
}

afterEach(() => {
  configureIGRPSessionStore(null);
  vi.restoreAllMocks();
});

describe('session store codec — without a store', () => {
  it('writes the full token, exactly as NextAuth would', async () => {
    const token = sessionToken();
    const cookie = await createSessionTokenEncoder()({ token, secret: SECRET });
    const decoded = (await plainDecode({ token: cookie, secret: SECRET })) as JWT;
    expect(decoded.accessToken).toBe(token.accessToken);
    expect(decoded[SESSION_ID_CLAIM]).toBeUndefined();
  });
});

describe('session store codec — with a store', () => {
  it('keeps the tokens out of the cookie and only an id plus the middleware claims in it', async () => {
    const store = createMemorySessionStore();
    const token = sessionToken();
    const cookie = await createSessionTokenEncoder({ store })({ token, secret: SECRET });

    const slim = (await plainDecode({ token: cookie, secret: SECRET })) as JWT;
    expect(slim.accessToken).toBeUndefined();
    expect(slim.refreshToken).toBeUndefined();
    expect(slim.idToken).toBeUndefined();
    expect(slim.expiresAt).toBe(token.expiresAt);
    expect(slim.sub).toBe(token.sub);
    expect(typeof slim[SESSION_ID_CLAIM]).toBe('string');
  });

  it('stores the tokens encrypted, never in plaintext', async () => {
    const set = vi.fn<IGRPSessionStore['set']>().mockResolvedValue(undefined);
    const store: IGRPSessionStore = { get: vi.fn(), set, delete: vi.fn() };
    const token = sessionToken();
    await createSessionTokenEncoder({ store })({ token, secret: SECRET, maxAge: 600 });

    const [key, value, ttl] = set.mock.calls[0]!;
    expect(key.startsWith(SESSION_STORE_KEY_PREFIX)).toBe(true);
    expect(ttl).toBe(600);
    expect(value).not.toContain(token.refreshToken!);
    expect(value).not.toContain('permissao_de_gestao');
    // A stored value is not a session cookie: it does not decode as one.
    await expect(plainDecode({ token: value, secret: SECRET })).rejects.toThrow();
  });

  it('restores the full token on a Node read', async () => {
    const store = createMemorySessionStore();
    const token = sessionToken();
    const cookie = await createSessionTokenEncoder({ store })({ token, secret: SECRET });
    const decoded = await createSessionTokenDecoder({ store })({ token: cookie, secret: SECRET });
    expect(decoded?.accessToken).toBe(token.accessToken);
    expect(decoded?.refreshToken).toBe(token.refreshToken);
    expect(decoded?.idToken).toBe(token.idToken);
  });

  it('keeps the session id across refreshes and mints one at sign-in', async () => {
    const store = createMemorySessionStore();
    const encode = createSessionTokenEncoder({ store });
    const decode = createSessionTokenDecoder({ store });

    const first = await decode({
      token: await encode({ token: sessionToken(), secret: SECRET }),
      secret: SECRET,
    });
    const refreshed = await decode({
      token: await encode({ token: { ...first!, accessToken: 'at-2' }, secret: SECRET }),
      secret: SECRET,
    });
    expect(refreshed?.[SESSION_ID_CLAIM]).toBe(first?.[SESSION_ID_CLAIM]);
    expect(refreshed?.accessToken).toBe('at-2');

    const other = await decode({
      token: await encode({ token: sessionToken(), secret: SECRET }),
      secret: SECRET,
    });
    expect(other?.[SESSION_ID_CLAIM]).not.toBe(first?.[SESSION_ID_CLAIM]);
  });

  it('treats the stored expiry as authoritative over a stale cookie', async () => {
    // A refresh inside an RSC render updates the store but cannot rewrite the
    // cookie; the next Node read must see the refreshed expiry.
    const store = createMemorySessionStore();
    const encode = createSessionTokenEncoder({ store });
    const decode = createSessionTokenDecoder({ store });
    const staleCookie = await encode({ token: sessionToken({ expiresAt: 1000 }), secret: SECRET });
    const session = await decode({ token: staleCookie, secret: SECRET });
    await encode({
      token: { ...session!, accessToken: 'at-2', expiresAt: 9_999_999_999_999 },
      secret: SECRET,
    });

    const reread = await decode({ token: staleCookie, secret: SECRET });
    expect(reread?.expiresAt).toBe(9_999_999_999_999);
    expect(reread?.accessToken).toBe('at-2');
  });

  it('reads a full cookie written before the store existed as-is', async () => {
    const token = sessionToken();
    const legacy = await plainEncode({ token, secret: SECRET });
    const decoded = await createSessionTokenDecoder({ store: createMemorySessionStore() })({
      token: legacy,
      secret: SECRET,
    });
    expect(decoded?.accessToken).toBe(token.accessToken);
  });

  it('reads as signed out on Node, and as the cookie claims at Edge, when the entry is gone', async () => {
    const store = createMemorySessionStore();
    const cookie = await createSessionTokenEncoder({ store })({
      token: sessionToken(),
      secret: SECRET,
    });
    const session = await createSessionTokenDecoder({ store })({ token: cookie, secret: SECRET });
    await deleteStoredSession(session, { store });

    expect(
      await createSessionTokenDecoder({ store })({ token: cookie, secret: SECRET }),
    ).toBeNull();
    const edge = await createSessionTokenDecoder({ store, hydrate: 'optional' })({
      token: cookie,
      secret: SECRET,
    });
    expect(edge?.expiresAt).toBeTypeOf('number');
    expect(edge?.accessToken).toBeUndefined();
  });

  it('reads as signed out on Node when no store is registered for a store-backed cookie', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cookie = await createSessionTokenEncoder({ store: createMemorySessionStore() })({
      token: sessionToken(),
      secret: SECRET,
    });
    expect(await createSessionTokenDecoder()({ token: cookie, secret: SECRET })).toBeNull();
    expect(
      await createSessionTokenDecoder({ hydrate: 'optional' })({ token: cookie, secret: SECRET }),
    ).not.toBeNull();
  });

  it('falls back to a full cookie when the store write fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const store: IGRPSessionStore = {
      get: vi.fn(),
      set: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      delete: vi.fn(),
    };
    const token = sessionToken();
    const cookie = await createSessionTokenEncoder({ store })({ token, secret: SECRET });
    const decoded = (await plainDecode({ token: cookie, secret: SECRET })) as JWT;
    expect(decoded.accessToken).toBe(token.accessToken);
    expect(decoded[SESSION_ID_CLAIM]).toBeUndefined();
  });

  it('reads as signed out on Node when the store read fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const working = createMemorySessionStore();
    const cookie = await createSessionTokenEncoder({ store: working })({
      token: sessionToken(),
      secret: SECRET,
    });
    const broken: IGRPSessionStore = {
      get: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      set: vi.fn(),
      delete: vi.fn(),
    };
    expect(
      await createSessionTokenDecoder({ store: broken })({ token: cookie, secret: SECRET }),
    ).toBeNull();
  });

  it('does not let a failed refresh overwrite a concurrent successful rotation', async () => {
    const store = createMemorySessionStore();
    const encode = createSessionTokenEncoder({ store });
    const decode = createSessionTokenDecoder({ store });
    const session = await decode({
      token: await encode({ token: sessionToken({ refreshToken: 'rt-1' }), secret: SECRET }),
      secret: SECRET,
    });

    // Request A rotated rt-1 → rt-2. Request B, holding rt-1, then failed.
    await encode({
      token: { ...session!, accessToken: 'at-2', refreshToken: 'rt-2' },
      secret: SECRET,
    });
    const losingCookie = await encode({
      token: { ...session!, error: 'RefreshAccessTokenError', forceLogout: true },
      secret: SECRET,
    });

    const after = await decode({ token: losingCookie, secret: SECRET });
    expect(after?.refreshToken).toBe('rt-2');
    expect(after?.error).toBeUndefined();
    expect(
      ((await plainDecode({ token: losingCookie, secret: SECRET })) as JWT).error,
    ).toBeUndefined();
  });

  it('records a refresh failure when nothing newer is stored', async () => {
    const store = createMemorySessionStore();
    const encode = createSessionTokenEncoder({ store });
    const decode = createSessionTokenDecoder({ store });
    const session = await decode({
      token: await encode({ token: sessionToken(), secret: SECRET }),
      secret: SECRET,
    });
    const failed = await encode({
      token: { ...session!, error: 'RefreshAccessTokenError', forceLogout: true },
      secret: SECRET,
    });
    expect((await decode({ token: failed, secret: SECRET }))?.error).toBe(
      'RefreshAccessTokenError',
    );
  });

  it('leaves a session without tokens (a provider that has none) in the cookie', async () => {
    const set = vi.fn();
    const store: IGRPSessionStore = { get: vi.fn(), set, delete: vi.fn() };
    await createSessionTokenEncoder({ store })({ token: { name: 'x', sub: '1' }, secret: SECRET });
    expect(set).not.toHaveBeenCalled();
  });
});

describe('refresh lock', () => {
  /** A store-backed session about to expire, as the jwt callback sees it. */
  async function expiringSession(store: IGRPSessionStore): Promise<JWT> {
    const cookie = await createSessionTokenEncoder({ store })({
      token: sessionToken({
        accessToken: 'at-1',
        refreshToken: 'rt-1',
        expiresAt: Date.now() + 1000,
      }),
      secret: SECRET,
    });
    return (await createSessionTokenDecoder({ store })({ token: cookie, secret: SECRET }))!;
  }

  /** A refresh that takes `ms` and returns rotated tokens. */
  function slowRefresh(ms: number, accessToken = 'at-2') {
    return vi.fn(async (token: JWT): Promise<JWT> => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return {
        ...token,
        accessToken,
        refreshToken: `${accessToken}-rt`,
        expiresAt: Date.now() + 3_600_000,
      };
    });
  }

  it('lets only one of two concurrent replicas refresh; the other adopts its result', async () => {
    const store = createMemorySessionStore();
    const session = await expiringSession(store);
    // Two replicas: same store, independent refresh functions.
    const replicaA = slowRefresh(300);
    const replicaB = slowRefresh(300, 'at-B');

    const [a, b] = await Promise.all([
      refreshUnderSessionLock(session, { store, secret: SECRET }, replicaA),
      refreshUnderSessionLock(session, { store, secret: SECRET }, replicaB),
    ]);

    expect(replicaA.mock.calls.length + replicaB.mock.calls.length).toBe(1);
    expect(a.accessToken).toBe(b.accessToken);
    expect(a.refreshToken).toBe(b.refreshToken);
  });

  it('adopts a refresh that landed before the lock was taken, without refreshing', async () => {
    const store = createMemorySessionStore();
    const session = await expiringSession(store);
    // Another replica already refreshed and wrote the store.
    await createSessionTokenEncoder({ store })({
      token: {
        ...session,
        accessToken: 'at-2',
        refreshToken: 'rt-2',
        expiresAt: Date.now() + 3_600_000,
      },
      secret: SECRET,
    });

    const refresh = slowRefresh(0, 'at-3');
    const result = await refreshUnderSessionLock(session, { store, secret: SECRET }, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(result.accessToken).toBe('at-2');
  });

  it('takes over the lock of a holder that died, then refreshes under it', async () => {
    const store = createMemorySessionStore();
    const session = await expiringSession(store);
    const key = `${SESSION_STORE_KEY_PREFIX}lock:${session[SESSION_ID_CLAIM]}`;
    // A replica took the lock and died; its lock expires after 300 ms.
    await store.acquireLock!(key, 'dead', 300);

    const refresh = slowRefresh(0, 'at-mine');
    const result = await refreshUnderSessionLock(
      session,
      { store, secret: SECRET, waitMs: 2000 },
      refresh,
    );

    expect(result.accessToken).toBe('at-mine');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await store.acquireLock!(key, 'next', 1000)).toBe(true); // and released it
  });

  it('never refreshes while a live holder keeps the lock — returns the session unchanged', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createMemorySessionStore();
    const session = await expiringSession(store);
    // A replica is mid-refresh and slower than this request is willing to wait.
    await store.acquireLock!(
      `${SESSION_STORE_KEY_PREFIX}lock:${session[SESSION_ID_CLAIM]}`,
      'slow',
      60_000,
    );

    const refresh = slowRefresh(0, 'at-mine');
    const result = await refreshUnderSessionLock(
      session,
      { store, secret: SECRET, waitMs: 400 },
      refresh,
    );

    // Refreshing here would present a token the holder may already have spent.
    expect(refresh).not.toHaveBeenCalled();
    expect(result.accessToken).toBe(session.accessToken);
    expect(result.error).toBeUndefined();
  });

  it('releases the lock afterwards, so the next refresh can take it', async () => {
    const store = createMemorySessionStore();
    const session = await expiringSession(store);
    await refreshUnderSessionLock(session, { store, secret: SECRET }, slowRefresh(0));

    const key = `${SESSION_STORE_KEY_PREFIX}lock:${session[SESSION_ID_CLAIM]}`;
    expect(await store.acquireLock!(key, 'next', 1000)).toBe(true);
  });

  it('never releases a lock another owner holds', async () => {
    const store = createMemorySessionStore();
    await store.acquireLock!('k', 'owner-a', 60_000);
    await store.releaseLock!('k', 'owner-b');
    expect(await store.acquireLock!('k', 'owner-c', 60_000)).toBe(false);
  });

  it('refreshes directly when the store has no lock methods', async () => {
    const memory = createMemorySessionStore();
    const store: IGRPSessionStore = { get: memory.get, set: memory.set, delete: memory.delete };
    const session = await expiringSession(store);
    const refresh = slowRefresh(0);
    await refreshUnderSessionLock(session, { store, secret: SECRET }, refresh);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes directly when the lock cannot be taken (store down)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const memory = createMemorySessionStore();
    const session = await expiringSession(memory);
    const store: IGRPSessionStore = {
      ...memory,
      acquireLock: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    };
    const refresh = slowRefresh(0);
    expect(
      (await refreshUnderSessionLock(session, { store, secret: SECRET }, refresh)).accessToken,
    ).toBe('at-2');
  });
});

describe('no store in production', () => {
  afterEach(async () => {
    vi.unstubAllEnvs();
    (await import('../_global-state')).resetGlobalStateForTests();
  });

  it('warns once that the tokens stay in the cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const encode = createSessionTokenEncoder();
    await encode({ token: sessionToken(), secret: SECRET });
    await encode({ token: sessionToken(), secret: SECRET });

    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.filter((m) => m.includes('IGRP_SESSION_STORE_URL'))).toHaveLength(1);
  });

  it('stays quiet in development, and whenever a store is registered', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');
    await createSessionTokenEncoder()({ token: sessionToken(), secret: SECRET });
    vi.stubEnv('NODE_ENV', 'production');
    await createSessionTokenEncoder({ store: createMemorySessionStore() })({
      token: sessionToken(),
      secret: SECRET,
    });

    expect(warn.mock.calls.some((c) => String(c[0]).includes('IGRP_SESSION_STORE_URL'))).toBe(
      false,
    );
  });
});

describe('registered store', () => {
  it('is what decodeIGRPSessionToken and an option-less codec use', async () => {
    const store = createMemorySessionStore();
    configureIGRPSessionStore(store);
    const token = sessionToken();
    const cookie = await createSessionTokenEncoder()({ token, secret: SECRET });
    expect(
      ((await plainDecode({ token: cookie, secret: SECRET })) as JWT).accessToken,
    ).toBeUndefined();
    expect((await decodeIGRPSessionToken({ token: cookie, secret: SECRET }))?.accessToken).toBe(
      token.accessToken,
    );
  });
});

// ─── R8: header budget ───────────────────────────────────────────────────────
//
// The 2026-10-13 incident: the app-center at `/` (session cookie at `Path=/`,
// sent to every app) plus one basePath app's own session cookie pushed the
// `Cookie` header past nginx's default 8 KB. Budget: a user signed in to the
// center and one app stays under 6 KB on a request to that app, which leaves
// room for the transient login cookies and the other request headers.

const CHUNK_SIZE = 4096; // next-auth's SessionStore chunk ceiling (name + value)

/** Bytes this cookie adds to a `Cookie` header, chunked as NextAuth writes it. */
function cookieHeaderBytes(name: string, value: string): number {
  const chunkValue = CHUNK_SIZE - name.length - 2 - 163; // next-auth's own overhead estimate
  if (name.length + 1 + value.length <= CHUNK_SIZE) return name.length + 1 + value.length + 2;
  let total = 0;
  for (let i = 0, n = 0; i < value.length; i += chunkValue, n++) {
    total += `${name}.${n}`.length + 1 + Math.min(chunkValue, value.length - i) + 2;
  }
  return total;
}

async function requestCookieHeaderBytes(store: IGRPSessionStore | null): Promise<number> {
  const encode = createSessionTokenEncoder({ store });
  const center = await encode({ token: sessionToken(), secret: SECRET });
  const app = await encode({ token: sessionToken(), secret: SECRET });
  const csrf = 'c'.repeat(64) + '%7C' + 'h'.repeat(64);
  return (
    cookieHeaderBytes('__Secure-next-auth.session-token~', center) +
    cookieHeaderBytes('__Secure-next-auth.session-token.apps-demo_p~', app) +
    // One CSRF cookie per app at Path=/ (`__Host-` mandates it): center, demo, app-b.
    cookieHeaderBytes('__Host-next-auth.csrf-token~', csrf) +
    cookieHeaderBytes('__Host-next-auth.csrf-token.apps-demo~', csrf) +
    cookieHeaderBytes('__Host-next-auth.csrf-token.apps-app-b~', csrf)
  );
}

describe('cookie header budget (center + one co-hosted app)', () => {
  it('reproduces the incident without a store: over the 8 KB nginx default', async () => {
    expect(await requestCookieHeaderBytes(null)).toBeGreaterThan(8 * 1024);
  });

  it('stays under 6 KB with a store', async () => {
    expect(await requestCookieHeaderBytes(createMemorySessionStore())).toBeLessThan(6 * 1024);
  });

  it('keeps one store-backed session cookie under 1 KB, whatever the permission count', async () => {
    const encode = createSessionTokenEncoder({ store: createMemorySessionStore() });
    const cookie = await encode({
      token: sessionToken({ accessToken: fakeAccessToken(400) }),
      secret: SECRET,
    });
    expect(cookie.length).toBeLessThan(1024);
  });
});
