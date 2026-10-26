import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../hooks/use-menus.js', () => ({ fetchMenus: vi.fn() }));
vi.mock('../../hooks/use-user.js', () => ({ fetchCurrentUser: vi.fn() }));
vi.mock('../../hooks/use-applications.js', () => ({
  fetchAppsByUser: vi.fn(),
  fetchAppByCode: vi.fn(),
}));
vi.mock('next/navigation', () => ({ unstable_rethrow: () => {} }));

const igrpEnsureAccessClientConfig = vi.fn();
const isIgrpAuthBypass = vi.fn(() => false);
vi.mock('../../lib/permissions.js', () => ({ igrpEnsureAccessClientConfig, isIgrpAuthBypass }));

const checkSession = vi.fn();
const igrpGetAccessClient = vi.fn(() => ({ sessions: { checkSession } }));
vi.mock('../../lib/api-client.js', () => ({ igrpGetAccessClient }));

const { igrpCheckAccessSession } = await import('../index.js');

beforeEach(() => {
  vi.clearAllMocks();
  isIgrpAuthBypass.mockReturnValue(false);
  igrpEnsureAccessClientConfig.mockResolvedValue({ token: 'AT', baseUrl: 'http://am' });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('igrpCheckAccessSession', () => {
  it('reports a session AM has ended, with its reason', async () => {
    checkSession.mockResolvedValue({ data: { valid: false, reason: 'USER_LOGOUT' }, status: 200 });

    expect(await igrpCheckAccessSession()).toEqual({ valid: false, reason: 'USER_LOGOUT' });
  });

  it('reports a live session as valid', async () => {
    checkSession.mockResolvedValue({ data: { valid: true }, status: 200 });

    expect(await igrpCheckAccessSession()).toEqual({ valid: true });
  });

  it('keeps the session when AM is unreachable or rejects the token', async () => {
    checkSession.mockRejectedValue(new Error('timeout'));

    expect(await igrpCheckAccessSession()).toEqual({ valid: true });
  });

  it('does not call AM without a recoverable session', async () => {
    igrpEnsureAccessClientConfig.mockResolvedValue({ token: '', baseUrl: 'http://am' });

    expect(await igrpCheckAccessSession()).toEqual({ valid: true });
    expect(checkSession).not.toHaveBeenCalled();
  });

  it('does not call AM under auth bypass', async () => {
    isIgrpAuthBypass.mockReturnValue(true);

    expect(await igrpCheckAccessSession()).toEqual({ valid: true });
    expect(igrpEnsureAccessClientConfig).not.toHaveBeenCalled();
    expect(checkSession).not.toHaveBeenCalled();
  });
});
