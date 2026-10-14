// @vitest-environment jsdom
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { IGRPChromeI18nProvider } from '../../i18n/context.js';
import { IGRP_CHROME_STRINGS_FR } from '../../i18n/strings.fr.js';
import { IGRPAuthForm } from '../../auths/form.js';
import { IGRPHeaderError } from '../header-error.js';
import { IGRPSidebarError } from '../sidebar-error.js';

// The retry hook needs the App Router; the fallbacks' copy does not.
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: () => {} }) }));

// renderToString escapes apostrophes as `&#x27;`; the French copy has several.
const unescape = (html: string) => html.replace(/&#x27;/g, "'");

const fr = (ui: React.ReactNode) =>
  unescape(
    renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_FR}>{ui}</IGRPChromeI18nProvider>,
    ),
  );

describe('layout error fallbacks and the catalog', () => {
  it('header fallback renders Portuguese with no provider and French with one', () => {
    expect(renderToString(<IGRPHeaderError />)).toContain('Falha ao carregar o cabeçalho.');
    const html = fr(<IGRPHeaderError />);
    expect(html).toContain(IGRP_CHROME_STRINGS_FR.layoutError.header);
    expect(html).toContain(IGRP_CHROME_STRINGS_FR.layoutError.retry);
  });

  it('sidebar fallback renders the provided catalog', () => {
    expect(fr(<IGRPSidebarError />)).toContain(IGRP_CHROME_STRINGS_FR.layoutError.sidebar);
  });
});

describe('auth form and the catalog', () => {
  const texts = {
    welcome: 'W',
    description: 'D',
    copyright: 'C',
    igrpLabel: 'iGRP',
    igrpUrl: 'https://igrp.example',
    nosiLabel: 'NOSi',
    nosiUrl: 'https://nosi.example',
  };
  const logo = { src: '/logo.png', width: 10, height: 10 };

  it('falls back to the catalog for the login button and the footer join', () => {
    const html = fr(<IGRPAuthForm texts={texts} logo={logo} name="App" />);
    expect(html).toContain(IGRP_CHROME_STRINGS_FR.authForm.loginButton);
    expect(html).toContain(IGRP_CHROME_STRINGS_FR.authForm.footerJoin);
    expect(html).not.toContain('>&nbsp;na&nbsp;<');
  });

  it('lets `texts.loginButton` win over the catalog', () => {
    const html = fr(
      <IGRPAuthForm texts={{ ...texts, loginButton: 'Go' }} logo={logo} name="App" />,
    );
    expect(html).toContain('Go');
    expect(html).not.toContain(IGRP_CHROME_STRINGS_FR.authForm.loginButton);
  });
});
