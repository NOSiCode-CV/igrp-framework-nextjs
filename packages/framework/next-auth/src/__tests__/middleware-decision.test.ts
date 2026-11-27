import { beforeEach, describe, expect, it, vi } from 'vitest';

import { igrpMiddlewareDecision, type IGRPMiddlewareAuth } from '../middleware';
import { isAuthDisabled, isPreviewModeEnabled } from '../providers';

const ORIGIN = 'https://public.example';
const auth = {
  getTokenFromRequest: vi.fn(),
  isTokenExpiredOrFailed: vi.fn(() => false),
  isEndedByHostLogout: vi.fn(() => false),
  getLoginRedirectUrl: () => new URL('/app/login', ORIGIN),
  resolveAppUrl: (path: string) => new URL(`/app${path}`, ORIGIN),
  isPreviewMode: vi.fn(() => false),
  isAuthDisabled: vi.fn(() => false),
} satisfies IGRPMiddlewareAuth;

const request = (path: string, cookies: string[] = []) => {
  const url = new URL(path, 'http://internal:3000');
  return {
    url: url.href,
    nextUrl: { pathname: url.pathname, search: url.search },
    cookies: { has: (name: string) => cookies.includes(name) },
  };
};

const OFF = { NEXT_PUBLIC_BASE_PATH: '/app' };
// The instance answers from its env, as `withIGRPAuth` does with no `provider`.
const decide = (path: string, env: Record<string, string> = OFF, cookies?: string[]) => {
  auth.isPreviewMode.mockReturnValue(isPreviewModeEnabled(env));
  auth.isAuthDisabled.mockReturnValue(isAuthDisabled(env));
  return igrpMiddlewareDecision(request(path, cookies), auth, {
    env,
    publicPaths: ['/api/health'],
    logoutPendingCookie: 'logout_pending',
  });
};

beforeEach(() => {
  auth.getTokenFromRequest.mockReset().mockResolvedValue({ expiresAt: Date.now() + 60_000 });
  auth.isTokenExpiredOrFailed.mockReturnValue(false);
  auth.isEndedByHostLogout.mockReturnValue(false);
  auth.isPreviewMode.mockReturnValue(false);
  auth.isAuthDisabled.mockReturnValue(false);
});

describe.each([
  ['IGRP_PREVIEW_MODE', 'true'],
  ['AUTH_PROVIDER', 'none'],
])('bypass on (%s=%s)', (key, value) => {
  const env = { ...OFF, [key]: value };

  it.each(['/login', '/logout/confirm', '/api/auth/session'])('sends %s to /', async (path) => {
    expect(await decide(path, env)).toEqual({ type: 'redirect', url: new URL('/app/', ORIGIN) });
  });

  it('passes a protected route without reading a token', async () => {
    expect(await decide('/clientes', env, ['logout_pending'])).toEqual({ type: 'pass' });
    expect(auth.getTokenFromRequest).not.toHaveBeenCalled();
  });
});

describe('bypass off', () => {
  it('follows the instance, not the env: `provider:` with a leftover AUTH_PROVIDER=none', async () => {
    auth.getTokenFromRequest.mockResolvedValue(null);
    const decision = igrpMiddlewareDecision(request('/clientes'), auth, {
      env: { ...OFF, AUTH_PROVIDER: 'none' },
    });
    expect((await decision).type).toBe('redirect');
  });

  it.each(['/login', '/api/auth/callback/x', '/api/health', '/_next/static/a.js', '/logo.svg'])(
    'passes public path %s without a token',
    async (path) => {
      auth.getTokenFromRequest.mockResolvedValue(null);
      expect(await decide(path)).toEqual({ type: 'pass' });
    },
  );

  it('checks a dotted route and an /api asset like any protected path', async () => {
    auth.getTokenFromRequest.mockResolvedValue(null);
    expect((await decide('/users/john.doe')).type).toBe('redirect');
    expect((await decide('/api/reports/x.pdf')).type).toBe('redirect');
  });

  it('passes a live session', async () => {
    expect(await decide('/clientes')).toEqual({ type: 'pass' });
  });

  it('redirects without a token, keeping a sanitized callbackUrl', async () => {
    auth.getTokenFromRequest.mockResolvedValue(null);
    const decision = await decide('/clientes?page=2');
    expect(decision.type === 'redirect' && decision.url.href).toBe(
      `${ORIGIN}/app/login?callbackUrl=%2Fclientes%3Fpage%3D2`,
    );
  });

  it('leaves out a callbackUrl of /', async () => {
    auth.getTokenFromRequest.mockResolvedValue(null);
    const decision = await decide('/');
    expect(decision.type === 'redirect' && decision.url.search).toBe('');
  });

  it('redirects an expired token and a failed decode', async () => {
    auth.isTokenExpiredOrFailed.mockReturnValue(true);
    expect((await decide('/clientes')).type).toBe('redirect');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    auth.getTokenFromRequest.mockRejectedValue(new Error('JWEDecryptionFailed'));
    expect((await decide('/clientes')).type).toBe('redirect');
    error.mockRestore();
  });

  it('marks a session ended by a co-hosted logout', async () => {
    auth.isEndedByHostLogout.mockReturnValue(true);
    const decision = await decide('/clientes');
    expect(decision.type === 'redirect' && decision.url.searchParams.get('reason')).toBe(
      'session_ended',
    );
  });

  it('sends a protected route with a logout_pending marker to login, no callbackUrl', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const decision = await decide('/clientes', OFF, ['logout_pending']);
    expect(decision).toEqual({ type: 'redirect', url: new URL('/app/login', ORIGIN) });
    expect(auth.getTokenFromRequest).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
