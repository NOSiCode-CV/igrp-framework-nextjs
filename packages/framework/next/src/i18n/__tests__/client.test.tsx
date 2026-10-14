import { renderToString } from 'react-dom/server';
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
