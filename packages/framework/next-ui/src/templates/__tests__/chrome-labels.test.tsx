// @vitest-environment jsdom
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { IGRPChromeI18nProvider } from '../../i18n/context.js';
import { IGRP_CHROME_STRINGS_FR } from '../../i18n/strings.fr.js';
import { IGRPForbidden } from '../../permissions/forbidden.js';
import { IGRPTemplateLoading } from '../loading.js';

describe('chrome components and the catalog', () => {
  it('render Portuguese defaults with no provider', () => {
    expect(renderToString(<IGRPForbidden homeHref={null} />)).toContain('Acesso negado');
    expect(renderToString(<IGRPTemplateLoading />)).toContain('Aguarde...');
  });

  it('render the provided catalog', () => {
    const html = renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_FR}>
        <IGRPForbidden homeHref={null} />
      </IGRPChromeI18nProvider>,
    );
    expect(html).toContain('Accès refusé');
  });

  it('let a prop win over the catalog, key by key', () => {
    const html = renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_FR}>
        <IGRPForbidden homeHref={null} title="Nope" />
      </IGRPChromeI18nProvider>,
    );
    expect(html).toContain('Nope');
    // renderToString escapes the apostrophe in "n'avez", so match a slice without it.
    expect(html).toContain('avez pas la permission');
  });
});
