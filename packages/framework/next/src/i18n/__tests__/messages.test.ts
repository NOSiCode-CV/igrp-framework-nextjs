import { createTranslator } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { igrpDefineI18n } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import {
  IGRP_MESSAGES_EN,
  IGRP_MESSAGES_FR,
  IGRP_MESSAGES_PT,
  igrpDeepMergeMessages,
  igrpMergeMessages,
} from '../messages/index.js';

afterEach(() => vi.restoreAllMocks());

const flat = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' ? flat(v as object, `${p}${k}.`) : [`${p}${k}`],
  );

describe('framework catalogs', () => {
  it('en and fr have exactly the pt keys', () => {
    expect(flat(IGRP_MESSAGES_EN).sort()).toEqual(flat(IGRP_MESSAGES_PT).sort());
    expect(flat(IGRP_MESSAGES_FR).sort()).toEqual(flat(IGRP_MESSAGES_PT).sort());
  });
});

describe('igrpDeepMergeMessages', () => {
  it('override wins per key, base keeps the rest, inputs untouched', () => {
    const base = { a: { x: '1', y: '2' }, b: '3' };
    const merged = igrpDeepMergeMessages(base, { a: { x: '9' } });
    expect(merged).toEqual({ a: { x: '9', y: '2' }, b: '3' });
    expect(base.a.x).toBe('1');
  });
});

describe('igrpMergeMessages', () => {
  const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
  const app = {
    pt: { users: { title: 'Utilizadores', hello: 'Olá' }, common: { actions: { retry: 'Repetir' } } },
    fr: { users: { title: 'Utilisateurs' } },
  };

  it('layers framework[locale] ⊕ app[default] ⊕ app[locale]', () => {
    const fr = igrpMergeMessages(i18n, 'fr', app) as Record<string, Record<string, unknown>>;
    expect((fr.users as Record<string, string>).title).toBe('Utilisateurs');
    expect((fr.users as Record<string, string>).hello).toBe('Olá');
    expect((fr.i18n as { localeSwitcher: { label: string } }).localeSwitcher.label).toBe('Langue');
  });

  it('lets the app shadow a framework key', () => {
    const pt = igrpMergeMessages(i18n, 'pt', app) as {
      common: { actions: { retry: string; backHome: string } };
    };
    expect(pt.common.actions.retry).toBe('Repetir');
    expect(pt.common.actions.backHome).toBe(IGRP_MESSAGES_PT.common.actions.backHome);
  });

  it('caches per catalogs object and locale', () => {
    expect(igrpMergeMessages(i18n, 'fr', app)).toBe(igrpMergeMessages(i18n, 'fr', app));
    expect(igrpMergeMessages(i18n, 'fr', { ...app })).not.toBe(igrpMergeMessages(i18n, 'fr', app));
  });
});

describe('fallback handlers', () => {
  it('render the key path and warn once for a missing message', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = createTranslator({
      locale: 'pt',
      messages: { users: { title: 'x' } },
      onError: igrpOnIntlError,
      getMessageFallback: igrpGetMessageFallback,
    });
    expect((t as unknown as (k: string) => string)('users.missing')).toBe('users.missing');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
