import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IGRP_MESSAGES_EN } from '../../i18n/messages/en.js';
import { IGRP_MESSAGES_FR } from '../../i18n/messages/fr.js';

const getTranslations = vi.fn();
vi.mock('next-intl/server', () => ({ getTranslations: (ns: string) => getTranslations(ns) }));
let cookieValue: string | undefined;
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'IGRP_LOCALE' && cookieValue ? { value: cookieValue } : undefined,
  }),
}));
vi.mock('../../hooks/use-applications.js', () => ({
  fetchAppByCode: async (code: string) => ({ name: `App ${code}` }),
}));

import { IGRPGlobalLoading } from '../global-loading.js';

const enTranslator = async (ns: string) => (key: string, values?: Record<string, string>) => {
  const group = ns.split('.').reduce<any>((acc, k) => acc[k], IGRP_MESSAGES_EN);
  return String(group[key]).replace('{name}', values?.name ?? '');
};

beforeEach(() => {
  getTranslations.mockReset();
  getTranslations.mockImplementation(enTranslator);
  cookieValue = undefined;
});

describe('IGRPGlobalLoading', () => {
  it('reads the generic label from the catalog', async () => {
    expect(renderToStaticMarkup(await IGRPGlobalLoading({ appCode: 'IGRP' }))).toBe(
      '<div>Loading...</div>',
    );
  });

  it('names the app being loaded from the catalog', async () => {
    expect(renderToStaticMarkup(await IGRPGlobalLoading({ appCode: 'crm' }))).toBe(
      '<div>Loading App crm...</div>',
    );
  });

  it('without next-intl config, uses the built-in copy for the IGRP_LOCALE cookie', async () => {
    getTranslations.mockRejectedValue(new Error("Couldn't find next-intl config file"));
    cookieValue = 'fr';
    const { loadingApp } = IGRP_MESSAGES_FR.common.actions;
    expect(renderToStaticMarkup(await IGRPGlobalLoading({ appCode: 'crm' }))).toBe(
      `<div>${loadingApp.replace('{name}', 'App crm')}</div>`,
    );
  });
});
