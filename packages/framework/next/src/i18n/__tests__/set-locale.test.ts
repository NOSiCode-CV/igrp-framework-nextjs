import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieSet = vi.fn();
const headerGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({ set: cookieSet }),
  headers: async () => ({ get: headerGet }),
}));

// Real `next/navigation`: the redirect thrown by `persistLocale` must reach the
// framework boundary as Next's own control-flow error, not a mocked one.
const { redirect } = await import('next/navigation');
const { igrpDefineI18n } = await import('../config.js');
const { igrpSetLocale } = await import('../server/set-locale.js');

const OPTIONS = { path: '/', maxAge: 31_536_000, sameSite: 'lax', secure: false, httpOnly: false };

beforeEach(() => {
  cookieSet.mockReset();
  headerGet.mockReset().mockReturnValue(null);
});

describe('igrpSetLocale', () => {
  it('rejects an unsupported or disabled locale without side effects', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'en'] });
    expect(await igrpSetLocale(i18n, 'de')).toMatchObject({ success: false, status: 400 });
    expect(await igrpSetLocale(i18n, 'fr')).toMatchObject({ success: false, status: 400 });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('writes only the cookie without persistLocale, normalising the value', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    expect(await igrpSetLocale(i18n, 'en-GB')).toEqual({
      success: true,
      data: { locale: 'en', persisted: false },
    });
    expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', OPTIONS);
  });

  it('persists first, then writes the cookie', async () => {
    const calls: string[] = [];
    const persistLocale = vi.fn(async (l: string) => {
      calls.push(`persist:${l}`);
    });
    cookieSet.mockImplementation(() => calls.push('cookie'));
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', persistLocale });
    expect(await igrpSetLocale(i18n, 'fr')).toEqual({
      success: true,
      data: { locale: 'fr', persisted: true },
    });
    expect(calls).toEqual(['persist:fr', 'cookie']);
  });

  it('reports persisted: false when persistLocale resolves false (no session to write to)', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', persistLocale: async () => false });
    expect(await igrpSetLocale(i18n, 'en')).toEqual({
      success: true,
      data: { locale: 'en', persisted: false },
    });
    expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', OPTIONS);
  });

  it('writes no cookie when persistLocale throws', async () => {
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      persistLocale: async () => {
        throw new Error('API down');
      },
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await igrpSetLocale(i18n, 'fr')).toMatchObject({ success: false, status: 500 });
    expect(cookieSet).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('lets a redirect() thrown by persistLocale propagate instead of failing with 500', async () => {
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      persistLocale: async () => {
        redirect('/login');
      },
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(igrpSetLocale(i18n, 'fr')).rejects.toMatchObject({
      digest: expect.stringMatching(/^NEXT_REDIRECT/),
    });
    expect(cookieSet).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('marks the cookie secure behind an https proxy', async () => {
    headerGet.mockImplementation((name: string) => (name === 'x-forwarded-proto' ? 'https' : null));
    await igrpSetLocale(igrpDefineI18n({ defaultLocale: 'pt' }), 'en');
    expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', { ...OPTIONS, secure: true });
  });
});
