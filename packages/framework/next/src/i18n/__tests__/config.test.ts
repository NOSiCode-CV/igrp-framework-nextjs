import { describe, expect, it } from 'vitest';

import {
  IGRP_DEFAULT_FORMAT_LOCALES,
  IGRP_LOCALE_COOKIE,
  igrpDefineI18n,
  igrpIsSecureRequest,
  igrpLocaleCookieOptions,
  igrpNormalizeLocale,
  igrpParseAcceptLanguage,
  igrpParseFormatLocales,
  igrpPickLocale,
} from '../config.js';

describe('igrpNormalizeLocale', () => {
  it('maps regional and oddly-cased tags to the base language', () => {
    expect(igrpNormalizeLocale('pt-CV')).toBe('pt');
    expect(igrpNormalizeLocale('pt_PT')).toBe('pt');
    expect(igrpNormalizeLocale('PT-br')).toBe('pt');
    expect(igrpNormalizeLocale(' en ')).toBe('en');
  });
  it('returns undefined for unsupported or non-string input', () => {
    expect(igrpNormalizeLocale('de')).toBeUndefined();
    expect(igrpNormalizeLocale('')).toBeUndefined();
    expect(igrpNormalizeLocale(null)).toBeUndefined();
    expect(igrpNormalizeLocale(7)).toBeUndefined();
  });
});

describe('igrpParseAcceptLanguage', () => {
  it('honours q-values and skips wildcard, q=0 and unsupported entries', () => {
    expect(igrpParseAcceptLanguage('fr;q=0.8, en;q=0.9')).toBe('en');
    expect(igrpParseAcceptLanguage('de-DE,fr-FR;q=0.9,en;q=0.8')).toBe('fr');
    expect(igrpParseAcceptLanguage('*')).toBeUndefined();
    expect(igrpParseAcceptLanguage('en;q=0, pt')).toBe('pt');
    expect(igrpParseAcceptLanguage('')).toBeUndefined();
    expect(igrpParseAcceptLanguage(null)).toBeUndefined();
  });
  it('keeps header order on ties', () => {
    expect(igrpParseAcceptLanguage('fr, en')).toBe('fr');
  });
  it('restricts to an allowed set while keeping q order and honouring q=0', () => {
    expect(igrpParseAcceptLanguage('en, pt;q=0.1, fr;q=0.9', ['pt', 'fr'])).toBe('fr');
    expect(igrpParseAcceptLanguage('en, fr;q=0', ['pt', 'fr'])).toBeUndefined();
  });
});

describe('igrpParseFormatLocales', () => {
  it('returns {} for unset or blank', () => {
    expect(igrpParseFormatLocales(undefined)).toEqual({});
    expect(igrpParseFormatLocales('  ')).toEqual({});
  });
  it('maps each entry to its language', () => {
    expect(igrpParseFormatLocales('pt-AO,en-US')).toEqual({ pt: 'pt-AO', en: 'en-US' });
    expect(igrpParseFormatLocales(' pt-PT ')).toEqual({ pt: 'pt-PT' });
  });
  it('throws IGRP_I18N_CONFIG_INVALID for a non-platform language, a duplicate language, an invalid tag or a bare language', () => {
    for (const raw of ['de-DE', 'pt-PT,pt-BR', 'pt-', 'en-GB,xx', 'pt', 'pt-PT,en']) {
      expect(() => igrpParseFormatLocales(raw)).toThrowError(
        expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
      );
    }
  });
});

describe('igrpDefineI18n', () => {
  it('fills defaults and derives cookie-first without persistLocale', () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    expect(i18n.locales).toEqual(['pt', 'en', 'fr']);
    expect(i18n.formatLocales).toEqual(IGRP_DEFAULT_FORMAT_LOCALES);
    expect(i18n.resolution).toBe('cookie-first');
  });
  it('derives session-first with persistLocale and merges formatLocales', () => {
    const i18n = igrpDefineI18n({
      defaultLocale: 'en',
      locales: ['en', 'fr'],
      formatLocales: { en: 'en-US' },
      persistLocale: async () => {},
    });
    expect(i18n.resolution).toBe('session-first');
    expect(i18n.formatLocales).toEqual({ pt: 'pt-CV', en: 'en-US', fr: 'fr-FR' });
    expect(i18n.locales).toEqual(['en', 'fr']);
  });
  it('rejects a default outside locales, a non-platform locale, and a format locale under the wrong key', () => {
    expect(() => igrpDefineI18n({ defaultLocale: 'pt', locales: ['en'] })).toThrowError(
      expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
    );
    expect(() =>
      igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'de' as never] }),
    ).toThrowError(expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }));
    expect(() =>
      igrpDefineI18n({ defaultLocale: 'pt', formatLocales: { pt: 'en-GB' } }),
    ).toThrowError(expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }));
  });
  it('rejects a bare language as a format locale (Intl would resolve pt to Brazilian conventions)', () => {
    expect(() => igrpDefineI18n({ defaultLocale: 'pt', formatLocales: { pt: 'pt' } })).toThrowError(
      expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
    );
  });
});

describe('igrpPickLocale', () => {
  const cookieFirst = igrpDefineI18n({ defaultLocale: 'pt' });
  const sessionFirst = igrpDefineI18n({ defaultLocale: 'pt', persistLocale: async () => {} });

  it('cookie-first: cookie → session → Accept-Language → default', () => {
    expect(igrpPickLocale({ cookie: 'fr', session: 'en', acceptLanguage: 'en' }, cookieFirst)).toBe(
      'fr',
    );
    expect(igrpPickLocale({ session: 'en-GB', acceptLanguage: 'fr' }, cookieFirst)).toBe('en');
    expect(igrpPickLocale({ acceptLanguage: 'fr-FR' }, cookieFirst)).toBe('fr');
    expect(igrpPickLocale({}, cookieFirst)).toBe('pt');
  });

  it('session-first: session → cookie → Accept-Language → default', () => {
    expect(
      igrpPickLocale({ cookie: 'fr', session: 'en', acceptLanguage: 'fr' }, sessionFirst),
    ).toBe('en');
    expect(igrpPickLocale({ cookie: 'fr', acceptLanguage: 'en' }, sessionFirst)).toBe('fr');
  });

  it('skips candidates outside the enabled locales', () => {
    const ptOnly = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt'] });
    expect(igrpPickLocale({ cookie: 'en', session: 'fr', acceptLanguage: 'en' }, ptOnly)).toBe(
      'pt',
    );
    const ptEn = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'en'] });
    expect(igrpPickLocale({ cookie: 'fr', acceptLanguage: 'fr, en;q=0.5' }, ptEn)).toBe('en');
  });
});

describe('cookie', () => {
  it('has the shared name and one-year lax options; secure only when asked', () => {
    expect(IGRP_LOCALE_COOKIE).toBe('IGRP_LOCALE');
    expect(igrpLocaleCookieOptions(false)).toEqual({
      path: '/',
      maxAge: 31_536_000,
      sameSite: 'lax',
      secure: false,
      httpOnly: false,
    });
    expect(igrpLocaleCookieOptions(true).secure).toBe(true);
  });
});

describe('igrpIsSecureRequest', () => {
  it('trusts the first x-forwarded-proto value', () => {
    expect(igrpIsSecureRequest(new Headers({ 'x-forwarded-proto': 'https' }))).toBe(true);
    expect(igrpIsSecureRequest(new Headers({ 'x-forwarded-proto': 'https,http' }))).toBe(true);
    expect(igrpIsSecureRequest(new Headers({ 'x-forwarded-proto': 'http' }), 'https:')).toBe(false);
    expect(igrpIsSecureRequest(new Headers({ 'x-forwarded-proto': 'HTTPS' }))).toBe(true);
  });

  it('falls back to the given protocol, then to origin', () => {
    expect(igrpIsSecureRequest(new Headers(), 'https:')).toBe(true);
    expect(igrpIsSecureRequest(new Headers({ origin: 'https://a.b' }))).toBe(true);
    expect(igrpIsSecureRequest(new Headers())).toBe(false);
  });
});
