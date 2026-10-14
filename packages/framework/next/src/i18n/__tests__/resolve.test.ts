import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();
const headerGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => ({ get: headerGet }),
}));
// React `cache` is per-request in RSC; in tests it would memoise across cases.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}));

const { igrpDefineI18n } = await import('../config.js');
const { igrpResolveLocale, igrpResolveFormatLocale } = await import('../server/resolve.js');
const { igrpCreateRequestConfig } = await import('../server/request-config.js');

beforeEach(() => {
  cookieGet.mockReset();
  headerGet.mockReset();
});

describe('igrpResolveLocale', () => {
  it('reads cookie, session and Accept-Language and applies the strategy', async () => {
    cookieGet.mockReturnValue({ value: 'fr' });
    headerGet.mockReturnValue('en');
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      getSessionLocale: async () => 'en-GB',
      persistLocale: async () => {},
    });
    expect(await igrpResolveLocale(i18n)).toBe('en');
    expect(await igrpResolveFormatLocale(i18n)).toBe('en-GB');
  });

  it('treats a failing getSessionLocale as unknown', async () => {
    cookieGet.mockReturnValue(undefined);
    headerGet.mockReturnValue('fr');
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      getSessionLocale: async () => {
        throw new Error('boom');
      },
    });
    expect(await igrpResolveLocale(i18n)).toBe('fr');
  });

  it('rethrows Next control-flow errors from getSessionLocale', async () => {
    const bailout = Object.assign(new Error('bail'), { digest: 'DYNAMIC_SERVER_USAGE' });
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      getSessionLocale: async () => {
        throw bailout;
      },
    });
    await expect(igrpResolveLocale(i18n)).rejects.toBe(bailout);
  });
});

describe('igrpCreateRequestConfig', () => {
  it('returns locale, merged messages, timeZone and the fallback handlers', async () => {
    cookieGet.mockReturnValue({ value: 'fr' });
    headerGet.mockReturnValue(null);
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', timeZone: 'Atlantic/Cape_Verde' });
    const factory = igrpCreateRequestConfig(i18n, {
      pt: { app: { hi: 'Olá' } },
      fr: { app: { hi: 'Salut' } },
    });
    const config = await factory({ requestLocale: Promise.resolve(undefined) } as never);
    expect(config.locale).toBe('fr');
    expect((config.messages as { app: { hi: string } }).app.hi).toBe('Salut');
    expect(config.timeZone).toBe('Atlantic/Cape_Verde');
    expect(typeof config.onError).toBe('function');
    expect(typeof config.getMessageFallback).toBe('function');
  });
});
