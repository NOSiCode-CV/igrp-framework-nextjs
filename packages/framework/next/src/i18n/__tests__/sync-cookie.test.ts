import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { igrpDefineI18n } from '../config.js';
import { igrpSyncLocaleCookie } from '../sync-cookie.js';

const request = (cookie?: string) =>
  new NextRequest('https://app.example/x', {
    headers: cookie ? { cookie: `IGRP_LOCALE=${cookie}` } : {},
  });

describe('igrpSyncLocaleCookie', () => {
  const sessionFirst = igrpDefineI18n({ defaultLocale: 'pt', persistLocale: async () => {} });
  const cookieFirst = igrpDefineI18n({ defaultLocale: 'pt' });

  it('is a no-op under cookie-first', () => {
    const res = igrpSyncLocaleCookie(request('fr'), NextResponse.next(), 'en', cookieFirst);
    expect(res.cookies.get('IGRP_LOCALE')).toBeUndefined();
  });

  it('rewrites the cookie to the (normalised) token locale under session-first when they differ', () => {
    const res = igrpSyncLocaleCookie(request('fr'), NextResponse.next(), 'en-GB', sessionFirst);
    expect(res.cookies.get('IGRP_LOCALE')?.value).toBe('en');
    expect(res.cookies.get('IGRP_LOCALE')?.secure).toBe(true);
  });

  it('leaves an equal cookie, an unsupported token locale and a disabled locale alone', () => {
    expect(
      igrpSyncLocaleCookie(request('en'), NextResponse.next(), 'en', sessionFirst).cookies.get(
        'IGRP_LOCALE',
      ),
    ).toBeUndefined();
    expect(
      igrpSyncLocaleCookie(request('en'), NextResponse.next(), 'de', sessionFirst).cookies.get(
        'IGRP_LOCALE',
      ),
    ).toBeUndefined();
    const ptOnly = igrpDefineI18n({
      defaultLocale: 'pt',
      locales: ['pt'],
      persistLocale: async () => {},
    });
    expect(
      igrpSyncLocaleCookie(request('pt'), NextResponse.next(), 'fr', ptOnly).cookies.get(
        'IGRP_LOCALE',
      ),
    ).toBeUndefined();
  });

  it('marks the cookie Secure behind a TLS proxy', () => {
    const req = new NextRequest('http://app.internal/x', {
      headers: { 'x-forwarded-proto': 'https' },
    });
    const res = igrpSyncLocaleCookie(req, NextResponse.next(), 'en', sessionFirst);
    expect(res.cookies.get('IGRP_LOCALE')?.secure).toBe(true);
  });
});
