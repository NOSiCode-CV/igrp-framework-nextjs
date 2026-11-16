import { afterEach, describe, expect, it, vi } from 'vitest';

let ctxValue: unknown;
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useContext: () => ctxValue,
}));

const { useIGRPSession, useOptionalSession } = await import('../client');

afterEach(() => {
  ctxValue = undefined;
});

describe('useIGRPSession', () => {
  it('returns null without a provider, like useOptionalSession', () => {
    expect(useIGRPSession()).toBeNull();
    expect(useOptionalSession()).toBeNull();
  });

  it('narrows the session fields and passes update through', () => {
    const update = vi.fn();
    const data = { accessToken: 'tok', expiresAt: 42, error: 'RefreshAccessTokenError' };
    ctxValue = { status: 'authenticated', data, update };

    expect(useIGRPSession()).toEqual({
      state: {
        status: 'authenticated',
        data,
        accessToken: 'tok',
        expiresAt: 42,
        error: 'RefreshAccessTokenError',
      },
      actions: { update },
    });
  });

  it('maps a missing session to null data and undefined fields', () => {
    ctxValue = { status: 'unauthenticated', data: undefined, update: vi.fn() };

    const value = useIGRPSession();
    expect(value?.state).toEqual({
      status: 'unauthenticated',
      data: null,
      accessToken: undefined,
      expiresAt: undefined,
      error: undefined,
    });
  });
});
