import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Every export of `actions/index.ts` is a Server Action — a POST endpoint any
 * browser can address by action id. Two defects had to be fixed together:
 *
 *  • the access-client ALS store is empty in an action, so these built a client
 *    with no base URL and an empty bearer and failed opaquely;
 *  • recovering the token without a gate would have made an unauthenticated
 *    POST with a caller-supplied `appCode` start succeeding.
 */

const fetchMenus = vi.fn();
const fetchCurrentUser = vi.fn();
const fetchAppsByUser = vi.fn();
const fetchAppByCode = vi.fn();
vi.mock('../../hooks/use-menus.js', () => ({ fetchMenus }));
vi.mock('../../hooks/use-user.js', () => ({ fetchCurrentUser }));
vi.mock('../../hooks/use-applications.js', () => ({ fetchAppsByUser, fetchAppByCode }));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => {} }));

const igrpEnsureAccessClientConfig = vi.fn();
const isIgrpAuthBypass = vi.fn(() => false);
vi.mock('../../lib/permissions.js', () => ({ igrpEnsureAccessClientConfig, isIgrpAuthBypass }));

const actions = await import('../index.js');

beforeEach(() => {
  vi.clearAllMocks();
  isIgrpAuthBypass.mockReturnValue(false);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('server actions refuse before contacting Access Management', () => {
  it('returns a failure result when no session can be recovered', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: '', baseUrl: 'http://am' });

    const result = await actions.fetchMenusAction('SOME_OTHER_APP');

    expect(result).toEqual({ ok: false, error: 'Sessão inválida ou expirada.' });
    expect(fetchMenus).not.toHaveBeenCalled();
  });

  it('refuses fetchAppByCodeAction the same way', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: '', baseUrl: 'http://am' });

    expect(await actions.fetchAppByCodeAction('X')).toMatchObject({ ok: false });
    expect(fetchAppByCode).not.toHaveBeenCalled();
  });

  it('recovers the token and proceeds when a session exists', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
    fetchMenus.mockResolvedValue([{ code: 'M' }]);

    expect(await actions.fetchMenusAction('APP')).toEqual({ ok: true, data: [{ code: 'M' }] });
    expect(igrpEnsureAccessClientConfig).toHaveBeenCalledTimes(1);
  });

  it('skips the gate entirely when auth is bypassed', async () => {
    isIgrpAuthBypass.mockReturnValue(true);
    fetchCurrentUser.mockResolvedValue({ id: 1 });

    expect(await actions.fetchCurrentUserAction()).toEqual({ ok: true, data: { id: 1 } });
    expect(igrpEnsureAccessClientConfig).not.toHaveBeenCalled();
  });

  it('still surfaces a downstream failure as a failure result', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
    fetchAppsByUser.mockRejectedValue(new Error('500'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await actions.fetchAppsByUserAction()).toMatchObject({ ok: false });
  });
});
