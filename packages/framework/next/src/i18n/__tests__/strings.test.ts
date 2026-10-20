import { describe, expect, it } from 'vitest';
import { IGRP_CHROME_STRINGS_EN, IGRP_CHROME_STRINGS_PT } from '@igrp/framework-next-ui';
import { IGRP_I18N_DEFAULTS_FR } from '@igrp/igrp-framework-react-design-system';

import { igrpDefineI18n } from '../config.js';
import { igrpGetChromeStrings, igrpGetDesignSystemStrings } from '../server/strings.js';

describe('catalog selection with overrides', () => {
  const i18n = igrpDefineI18n({
    defaultLocale: 'pt',
    overrides: {
      en: { chrome: { navUser: { logout: 'Log out' } } },
      fr: { designSystem: { dataTable: { notFound: 'Rien.' } } },
    },
  });

  it('design-system: locale catalog with overrides merged', () => {
    const fr = igrpGetDesignSystemStrings(i18n, 'fr');
    expect(fr.dataTable.notFound).toBe('Rien.');
    expect(fr.dataTable.clearFilters).toBe(IGRP_I18N_DEFAULTS_FR.dataTable.clearFilters);
    expect(igrpGetDesignSystemStrings(i18n, 'en').dataTable.notFound).toBe('No records found.');
  });

  it('chrome: locale catalog with overrides merged, group by group', () => {
    const en = igrpGetChromeStrings(i18n, 'en');
    expect(en.navUser.logout).toBe('Log out');
    expect(en.navUser.profile).toBe(IGRP_CHROME_STRINGS_EN.navUser.profile);
    expect(igrpGetChromeStrings(i18n, 'pt')).toBe(igrpGetChromeStrings(i18n, 'pt'));
  });
});

describe('chrome overrides', () => {
  it('ignores undefined chrome overrides', () => {
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      overrides: { pt: { chrome: { navUser: { logout: undefined } } } },
    });
    expect(igrpGetChromeStrings(i18n, 'pt').navUser.logout).toBe(
      IGRP_CHROME_STRINGS_PT.navUser.logout,
    );
  });
  it('applies object-valued errorCodes overrides', () => {
    const copy = { title: 'Sem codigo', description: 'Defina o codigo.' };
    const i18n = igrpDefineI18n({
      defaultLocale: 'pt',
      overrides: { pt: { chrome: { errorCodes: { IGRP_APP_CODE_MISSING: copy } } } },
    });
    expect(igrpGetChromeStrings(i18n, 'pt').errorCodes.IGRP_APP_CODE_MISSING).toEqual(copy);
  });
});
