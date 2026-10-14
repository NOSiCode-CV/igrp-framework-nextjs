import { describe, expect, it, vi } from 'vitest';
import { decode as plainDecode } from 'next-auth/jwt';
import type * as oidcModule from '../oidc';

import {
  configureIGRPSessionStore,
  createMemorySessionStore,
  SESSION_ID_CLAIM,
} from '../session-store';
import type { JWT } from '../jwt';

// Sign-out revokes at the IdP; keep it off the network.
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    getRecoveredToken: vi.fn().mockResolvedValue(null),
  };
});

const ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
  NEXTAUTH_URL: 'http://localhost:3000/apps/demo/api/auth',
  NEXT_PUBLIC_BASE_PATH: '/apps/demo',
};

const TOKEN: JWT = {
  sub: 'user-1',
  authProviderId: 'igrp-auth',
  accessToken: 'at-1',
  refreshToken: 'rt-1',
  idToken: 'id-1',
  expiresAt: Date.now() + 3_600_000,
};

async function instanceWith(store = createMemorySessionStore()) {
  const { withIGRPAuth } = await import('../config');
  return { store, auth: withIGRPAuth({ env: ENV, sessionStore: store }) };
}

/** A NextRequest-shaped object carrying one cookie. */
function requestWith(name: string, value: string) {
  return {
    cookies: {
      getAll: () => [{ name, value }],
      get: (n: string) => (n === name ? { name, value } : undefined),
    },
    headers: new Headers(),
  };
}

describe('withIGRPAuth — session store', () => {
  it('writes a store-backed cookie through the NextAuth jwt.encode and reads it back', async () => {
    const { auth } = await instanceWith();
    const { encode, decode } = auth.authOptions.jwt!;
    const cookie = await encode!({ token: TOKEN, secret: ENV.NEXTAUTH_SECRET });

    expect(
      ((await plainDecode({ token: cookie, secret: ENV.NEXTAUTH_SECRET })) as JWT).accessToken,
    ).toBeUndefined();
    expect((await decode!({ token: cookie, secret: ENV.NEXTAUTH_SECRET }))?.accessToken).toBe(
      'at-1',
    );
  });

  it('gives Edge middleware (no store registered there) the expiry claims but no tokens', async () => {
    const { withIGRPAuth } = await import('../config');
    // Node registers the store (instrumentation.ts) and writes the cookie…
    configureIGRPSessionStore(createMemorySessionStore());
    const cookie = await withIGRPAuth({ env: ENV }).authOptions.jwt!.encode!({
      token: TOKEN,
      secret: ENV.NEXTAUTH_SECRET,
    });
    // …while the Edge runtime never registers one.
    configureIGRPSessionStore(null);
    const auth = withIGRPAuth({ env: ENV });
    const token = await auth.getTokenFromRequest(
      requestWith('next-auth.session-token.apps-demo_p~', cookie),
    );
    expect(token?.expiresAt).toBe(TOKEN.expiresAt);
    expect(auth.isTokenExpiredOrFailed(token!)).toBe(false);
    expect(token?.accessToken).toBeUndefined();
  });

  it('deletes the stored session on sign-out', async () => {
    const { auth } = await instanceWith();
    const { encode, decode } = auth.authOptions.jwt!;
    const cookie = await encode!({ token: TOKEN, secret: ENV.NEXTAUTH_SECRET });
    const session = await decode!({ token: cookie, secret: ENV.NEXTAUTH_SECRET });
    expect(session?.[SESSION_ID_CLAIM]).toBeTypeOf('string');

    await auth.authOptions.events!.signOut!({ token: session! } as never);

    expect(await decode!({ token: cookie, secret: ENV.NEXTAUTH_SECRET })).toBeNull();
  });
});
