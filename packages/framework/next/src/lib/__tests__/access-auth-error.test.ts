import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ApiClientError, redirect, forbidden, currentPath, sanitizeRedirectUrl, warn } = vi.hoisted(
  () => {
    class ApiClientError extends Error {
      status: number;
      details?: { error_description?: string };
      constructor(status: number, details?: { error_description?: string }) {
        super(`status ${status}`);
        this.status = status;
        this.details = details;
      }
    }
    return {
      ApiClientError,
      redirect: vi.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
      }),
      forbidden: vi.fn(() => {
        throw new Error('NEXT_FORBIDDEN');
      }),
      currentPath: vi.fn<() => string | null>(() => null),
      sanitizeRedirectUrl: vi.fn((url: string | null) => url ?? ''),
      warn: vi.fn(),
    };
  },
);

vi.mock('@igrp/platform-access-management-client-ts', () => ({ ApiClientError }));
vi.mock('next/navigation', () => ({ redirect, forbidden }));
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => (name === 'x-current-path' ? currentPath() : null),
  }),
}));
vi.mock('@igrp/framework-next-auth/sanitize', () => ({ sanitizeRedirectUrl }));
vi.mock('../../logger.js', () => ({ logger: { warn } }));

const { igrpThrowOnAccessAuthError } = await import('../access-auth-error.js');

describe('igrpThrowOnAccessAuthError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentPath.mockReturnValue(null);
  });

  it.each([
    ['a plain Error', new Error('boom')],
    ['a string', 'boom'],
    ['null', null],
    ['an object shaped like a 401', { status: 401 }],
    ['an ApiClientError 500', new ApiClientError(500)],
    ['an ApiClientError 404', new ApiClientError(404)],
  ])('returns without control flow for %s', async (_, error) => {
    await expect(igrpThrowOnAccessAuthError(error)).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('calls forbidden() on 403 without logging or redirecting', async () => {
    await expect(igrpThrowOnAccessAuthError(new ApiClientError(403))).rejects.toThrow(
      'NEXT_FORBIDDEN',
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('redirects to login without a callbackUrl when there is no current path', async () => {
    await expect(igrpThrowOnAccessAuthError(new ApiClientError(401))).rejects.toThrow(
      /^NEXT_REDIRECT:\/login\?reason=session_ended$/,
    );
    expect(forbidden).not.toHaveBeenCalled();
  });

  it('carries the sanitised current path as an encoded callbackUrl on 401', async () => {
    currentPath.mockReturnValue('/apps/x?tab=a&b=1');

    await expect(igrpThrowOnAccessAuthError(new ApiClientError(401))).rejects.toThrow(
      `NEXT_REDIRECT:/login?reason=session_ended&callbackUrl=${encodeURIComponent('/apps/x?tab=a&b=1')}`,
    );
    expect(sanitizeRedirectUrl).toHaveBeenCalledWith('/apps/x?tab=a&b=1', undefined, '');
  });

  it('drops a callbackUrl the sanitiser rejects', async () => {
    currentPath.mockReturnValue('https://evil.example/');
    sanitizeRedirectUrl.mockReturnValueOnce('');

    await expect(igrpThrowOnAccessAuthError(new ApiClientError(401))).rejects.toThrow(
      /^NEXT_REDIRECT:\/login\?reason=session_ended$/,
    );
  });

  it('logs only the 401 reason before redirecting', async () => {
    await expect(
      igrpThrowOnAccessAuthError(new ApiClientError(401, { error_description: 'token expired' })),
    ).rejects.toThrow();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.any(String), { reason: 'token expired' });
  });

  it('logs an undefined reason when the 401 has no details', async () => {
    await expect(igrpThrowOnAccessAuthError(new ApiClientError(401))).rejects.toThrow();

    expect(warn).toHaveBeenCalledWith(expect.any(String), { reason: undefined });
  });
});
