import { renderToString } from 'react-dom/server';
import { useTranslations } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const { IGRPIntlTestProvider } = await import('../testing/index.js');
const { IGRPLocaleSwitcher, useIGRPFormat, useIGRPLocaleInfo } = await import('../client/index.js');

function Probe() {
  const { locale, formatLocale, locales } = useIGRPLocaleInfo();
  const { formatNumber } = useIGRPFormat();
  return <p>{`${locale}|${formatLocale}|${locales.join(',')}|${formatNumber(1234.5)}`}</p>;
}

describe('client i18n', () => {
  it('useIGRPLocaleInfo / useIGRPFormat read the provider', () => {
    const html = renderToString(
      <IGRPIntlTestProvider locale="en">
        <Probe />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('en|en-GB|pt,en,fr|1,234.5');
  });

  it('useIGRPFormat formats in the provider time zone', () => {
    function ZoneProbe() {
      const { timeZone } = useIGRPLocaleInfo();
      const { formatDateTime } = useIGRPFormat();
      return <p>{`${timeZone}|${formatDateTime(new Date(Date.UTC(2026, 9, 12, 23, 30)))}`}</p>;
    }
    const html = renderToString(
      <IGRPIntlTestProvider locale="en" timeZone="Asia/Tokyo">
        <ZoneProbe />
      </IGRPIntlTestProvider>,
    );
    expect(html).toMatch(/Asia\/Tokyo\|13\/10\/2026,? 08:30/);
  });

  it('useIGRPFormat exposes formatRelativeTime bound to the format locale', () => {
    function RelativeProbe() {
      const { formatRelativeTime } = useIGRPFormat();
      const now = new Date(Date.UTC(2026, 9, 12, 12, 0, 0));
      return <p>{formatRelativeTime(new Date(now.getTime() - 3 * 3_600_000), now)}</p>;
    }
    const html = renderToString(
      <IGRPIntlTestProvider locale="fr">
        <RelativeProbe />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('il y a 3 heures');
  });

  it('IGRPIntlTestProvider falls back to the pt app catalog like production', () => {
    function Greeting() {
      const t = useTranslations('app');
      return <p>{t('hello')}</p>;
    }
    const messages = { pt: { app: { hello: 'Olá' } }, en: { app: {} } };
    const html = renderToString(
      <IGRPIntlTestProvider locale="en" messages={messages}>
        <Greeting />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('Olá');
  });

  it('IGRPIntlTestProvider honours an explicit defaultLocale', () => {
    function Greeting() {
      const t = useTranslations('app');
      return <p>{t('hello')}</p>;
    }
    const messages = { pt: { app: { hello: 'Olá' } }, en: { app: { hello: 'Hello' } } };
    const html = renderToString(
      <IGRPIntlTestProvider locale="fr" defaultLocale="en" messages={messages}>
        <Greeting />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('Hello');
  });

  it('fall back to pt / pt-CV without a provider', () => {
    expect(renderToString(<Probe />)).toContain('pt|pt-CV|pt,en,fr|1234,5');
  });

  it('IGRPLocaleSwitcher renders the native names and the current code', () => {
    const html = renderToString(
      <IGRPIntlTestProvider locale="fr">
        <IGRPLocaleSwitcher
          action={async () => ({ success: true, data: { locale: 'fr', persisted: false } })}
        />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('FR');
    expect(html).toContain('Langue');
  });

  it('IGRPLocaleSwitcher renders nothing with a single enabled locale', () => {
    const html = renderToString(
      <IGRPIntlTestProvider locale="pt" locales={['pt']}>
        <IGRPLocaleSwitcher
          action={async () => ({ success: true, data: { locale: 'pt', persisted: false } })}
        />
      </IGRPIntlTestProvider>,
    );
    expect(html).toBe('');
  });
});
