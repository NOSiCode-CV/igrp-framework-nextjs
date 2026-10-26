// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
let pathname = '/apps/hr';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => pathname,
}));
vi.mock('@igrp/framework-next-auth/client', () => ({
  useSession: () => ({ data: { expiresAt: Date.now() + 3_600_000 }, status: 'authenticated' }),
  getSession: vi.fn().mockResolvedValue(null),
}));

const { IGRPSessionWatcher, SESSION_CHECK_MIN_INTERVAL_MS } = await import('../session-watcher.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

beforeEach(() => {
  replace.mockClear();
  pathname = '/apps/hr';
  window.history.replaceState(null, '', '/apps/hr?tab=2');
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  vi.useRealTimers();
});

function mount(checkSession?: () => Promise<{ valid: boolean; reason?: string | null }>) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root!.render(<IGRPSessionWatcher checkSession={checkSession}>x</IGRPSessionWatcher>));
}

async function refocus() {
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

describe('IGRPSessionWatcher focus check', () => {
  it('sends an ended session to /login?reason=session_ended, keeping where the user was', async () => {
    const checkSession = vi.fn().mockResolvedValue({ valid: false, reason: 'USER_LOGOUT' });
    mount(checkSession);

    await refocus();

    expect(checkSession).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      `/login?reason=session_ended&callbackUrl=${encodeURIComponent('/apps/hr?tab=2')}`,
    );
  });

  it('leaves a live session alone', async () => {
    mount(vi.fn().mockResolvedValue({ valid: true }));

    await refocus();

    expect(replace).not.toHaveBeenCalled();
  });

  it('checks at most once per interval however often the tab refocuses', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const checkSession = vi.fn().mockResolvedValue({ valid: true });
    mount(checkSession);

    await refocus();
    await refocus();
    expect(checkSession).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + SESSION_CHECK_MIN_INTERVAL_MS);
    await refocus();
    expect(checkSession).toHaveBeenCalledTimes(2);
  });

  it('does not sign the user out when the check itself fails', async () => {
    mount(vi.fn().mockRejectedValue(new Error('network')));

    await refocus();

    expect(replace).not.toHaveBeenCalled();
  });

  it('does not check on the login and logout pages', async () => {
    pathname = '/login';
    const checkSession = vi.fn().mockResolvedValue({ valid: false });
    mount(checkSession);

    await refocus();

    expect(checkSession).not.toHaveBeenCalled();
  });
});
