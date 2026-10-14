import { describe, expect, it, vi } from 'vitest';

import { igrpRunLocaleChange } from '../client/locale-change.js';

const ok = { success: true as const, data: { locale: 'fr' as const, persisted: false } };
const persistedOk = { success: true as const, data: { locale: 'fr' as const, persisted: true } };

describe('igrpRunLocaleChange', () => {
  it('calls action, then onChanged, then refresh on success', async () => {
    const calls: string[] = [];
    const failed = await igrpRunLocaleChange('fr', {
      action: async () => {
        calls.push('action');
        return ok;
      },
      onChanged: async (locale) => {
        calls.push(`changed:${locale}`);
      },
      refresh: () => calls.push('refresh'),
    });
    expect(failed).toBe(false);
    expect(calls).toEqual(['action', 'changed:fr', 'refresh']);
  });

  it('passes the persisted flag from the action result to onChanged', async () => {
    const onChanged = vi.fn();
    await igrpRunLocaleChange('fr', {
      action: async () => persistedOk,
      onChanged,
      refresh: vi.fn(),
    });
    await igrpRunLocaleChange('fr', { action: async () => ok, onChanged, refresh: vi.fn() });
    expect(onChanged.mock.calls).toEqual([
      ['fr', true],
      ['fr', false],
    ]);
  });

  it('reports failure and skips onChanged and refresh when the action fails', async () => {
    const onChanged = vi.fn();
    const refresh = vi.fn();
    const failed = await igrpRunLocaleChange('fr', {
      action: async () => ({ success: false, error: 'x', status: 400 }),
      onChanged,
      refresh,
    });
    expect(failed).toBe(true);
    expect(onChanged).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('never throws: an action that throws is a failure with no refresh', async () => {
    const refresh = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failed = await igrpRunLocaleChange('fr', {
      action: async () => {
        throw new Error('network');
      },
      refresh,
    });
    expect(failed).toBe(true);
    expect(refresh).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('still refreshes when onChanged throws after the locale was saved', async () => {
    const refresh = vi.fn();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failed = await igrpRunLocaleChange('fr', {
      action: async () => ok,
      onChanged: async () => {
        throw new Error('update() rejected');
      },
      refresh,
    });
    expect(failed).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });
});
