import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SidebarProvider } from '@igrp/igrp-framework-react-design-system';
import type { IGRPApplicationArgs } from '@igrp/framework-next-types';

import { IGRPTemplateAppSwitcher } from '../app-switcher.js';

const apps = [
  { id: 1, code: 'crm', name: 'CRM', url: 'https://crm.example' },
  { id: 2, code: 'hr', name: 'HR', url: 'https://hr.example' },
] as unknown as IGRPApplicationArgs[];

const render = (appCode: string, appCenterUrl?: string) =>
  renderToString(
    <SidebarProvider>
      <IGRPTemplateAppSwitcher apps={apps} appCode={appCode} appCenterUrl={appCenterUrl} />
    </SidebarProvider>,
  );

describe('IGRPTemplateAppSwitcher', () => {
  it('matches appCode case-insensitively', () => {
    // `igrpBuildConfig` uppercases appCode; the AM returned it lowercase.
    expect(render('CRM')).toContain('CRM');
    expect(render('CRM')).not.toContain('disabled=""');
  });

  /** Regression: an unknown appCode rendered a disabled button with no way to switch apps. */
  it('keeps the menu usable when appCode is not in apps', () => {
    const html = render('UNKNOWN', 'https://center.example');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('aria-haspopup="menu"');
  });
});
