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
vi.mock('next/navigation', () => ({
  unstable_rethrow: (e: unknown) => {
    if (e instanceof Error && e.message.startsWith('NEXT_')) throw e;
  },
}));

const igrpEnsureAccessClientConfig = vi.fn();
const isIgrpAuthBypass = vi.fn(() => false);
const igrpAssertAuthBypassAllowed = vi.fn();
vi.mock('../../lib/permissions.js', () => ({
  igrpAssertAuthBypassAllowed,
  igrpEnsureAccessClientConfig,
  isIgrpAuthBypass,
}));

const igrpGetAccessClientConfig = vi.fn(() => ({ baseUrl: '', token: '' }));
vi.mock('../../lib/api-config.js', () => ({ igrpGetAccessClientConfig }));

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

    expect(result).toEqual({
      ok: false,
      error: 'Sessão inválida ou expirada.',
      code: 'SESSION_INVALID',
    });
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

  it('refuses quietly in bypass when no AM credentials are configured', async () => {
    isIgrpAuthBypass.mockReturnValue(true);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await actions.fetchMenusAction('APP')).toMatchObject({
      ok: false,
      code: 'AUTH_BYPASSED',
    });
    expect(fetchMenus).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('skips the gate when auth is bypassed and AM credentials are configured', async () => {
    isIgrpAuthBypass.mockReturnValue(true);
    igrpGetAccessClientConfig.mockReturnValueOnce({ baseUrl: 'http://am', token: 'AT' });
    fetchCurrentUser.mockResolvedValue({ id: 1 });

    expect(await actions.fetchCurrentUserAction()).toEqual({ ok: true, data: { id: 1 } });
    expect(igrpEnsureAccessClientConfig).not.toHaveBeenCalled();
    expect(igrpAssertAuthBypassAllowed).toHaveBeenCalledTimes(1);
  });

  it('still surfaces a downstream failure as a failure result', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
    fetchAppsByUser.mockRejectedValue(new Error('500'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await actions.fetchAppsByUserAction()).toMatchObject({ ok: false });
  });

  it.each(['../../../admin/x?q=', 'APP/x', 'A', '', 'APP ', undefined])(
    'rejects appCode %j before any AM call',
    async (appCode) => {
      igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });

      expect(await actions.fetchMenusAction(appCode as string)).toMatchObject({
        ok: false,
        code: 'MENUS_LOAD_FAILED',
      });
      expect(fetchMenus).not.toHaveBeenCalled();
    },
  );

  it('accepts a valid appCode in any case, passed through unchanged', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
    fetchMenus.mockResolvedValue([]);

    expect(await actions.fetchMenusAction('my_app_1')).toEqual({ ok: true, data: [] });
    expect(fetchMenus).toHaveBeenCalledWith('my_app_1');
  });

  it('lets a 401 session-ended redirect from the fetch escape the action', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
    fetchMenus.mockRejectedValue(new Error('NEXT_REDIRECT:/login?reason=session_ended'));

    await expect(actions.fetchMenusAction('APP')).rejects.toThrow('NEXT_REDIRECT');
  });
});
