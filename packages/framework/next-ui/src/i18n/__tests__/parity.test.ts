import { describe, expect, it } from 'vitest';

import { IGRP_CHROME_STRINGS_PT, type IGRPChromeStrings } from '../strings.js';
import { IGRP_CHROME_STRINGS_EN } from '../strings.en.js';
import { IGRP_CHROME_STRINGS_FR } from '../strings.fr.js';
import { igrpChromeStringsFor } from '../catalogs.js';

function flatten(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object') {
      for (const [k, v] of flatten(child, path)) out.set(k, v);
    } else {
      out.set(path, child as string);
    }
  }
  return out;
}

const tokens = (message: string) => [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

const PT = flatten(IGRP_CHROME_STRINGS_PT);

describe.each([
  ['en', IGRP_CHROME_STRINGS_EN],
  ['fr', IGRP_CHROME_STRINGS_FR],
] as const)('%s chrome catalog parity with pt', (_locale, catalog: IGRPChromeStrings) => {
  const flat = flatten(catalog);

  it('has exactly the pt keys', () => {
    expect([...flat.keys()].sort()).toEqual([...PT.keys()].sort());
  });

  it('uses the same {token} arguments as pt', () => {
    for (const [key, ptValue] of PT) {
      expect(tokens(flat.get(key) ?? ''), key).toEqual(tokens(ptValue));
    }
  });

  it('has no empty value', () => {
    for (const [key, value] of flat) {
      expect(typeof value, key).toBe('string');
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });
});

describe('igrpChromeStringsFor', () => {
  it('selects by base language, case-insensitively, with regional tags', () => {
    expect(igrpChromeStringsFor('fr-FR')).toBe(IGRP_CHROME_STRINGS_FR);
    expect(igrpChromeStringsFor('EN_gb')).toBe(IGRP_CHROME_STRINGS_EN);
    expect(igrpChromeStringsFor('pt-CV')).toBe(IGRP_CHROME_STRINGS_PT);
  });

  it('falls back to pt for unsupported or empty tags', () => {
    expect(igrpChromeStringsFor('de')).toBe(IGRP_CHROME_STRINGS_PT);
    expect(igrpChromeStringsFor('')).toBe(IGRP_CHROME_STRINGS_PT);
    expect(igrpChromeStringsFor(undefined)).toBe(IGRP_CHROME_STRINGS_PT);
  });
});
