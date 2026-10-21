# Framework i18n v2, Plan 4 of 5: `@igrp/framework-next/i18n` and `@igrp/framework-next-i18n`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the framework i18n runtime as subpaths of `@igrp/framework-next` (config and resolution, server request config and `setLocale`, client provider and switcher, generic messages, test helper), wire it into the layouts and the access client, and ship the catalog and literal checks as the `igrp-i18n` CLI in a new dev-only package.

**Architecture:** `src/i18n/` in `framework-next` is split by runtime: `config.ts`, `format.ts`, `sync-cookie.ts` (Edge-safe, exported as `./i18n`), `messages/` (pure, `./i18n/messages`), `server/` (`server-only`, `./i18n/server`), `client/` (`'use client'` leaves, `./i18n/client`), `testing/`. `igrpBuildConfig({ i18n })` carries the config; `IGRPRootLayout` resolves the locale, loads messages and catalogs and mounts `IGRPIntlProvider`; `IGRPLayoutFull` / `IGRPLayoutBlank` seed `Accept-Language`. `@igrp/framework-next-i18n` is built like `template-migrator` (tsup, Vitest) and ports the application center's two guard tests into `check-catalogs` and `check-literals`.

**Tech Stack:** Next.js 15 (`next/headers`, `next/server`, React `cache`), next-intl 4.14, React 19, TypeScript 6, Vitest 5, Babel file-per-module build, tsup for the CLI, `typescript` compiler API and `@formatjs/icu-messageformat-parser` in the CLI.

**Spec:** `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (sections "framework-next", "@igrp/framework-next-i18n", "Locales and resolution").

**Series:** Plan 1 auth/types → Plan 2 design-system → Plan 3 next-ui → **Plan 4 (this)** → Plan 5 template + migration.

**Deviation from the spec, recorded here:** `./i18n/testing` exports `IGRPIntlTestProvider` (a wrapper component) instead of `igrpRenderWithIntl`, so `framework-next` needs no dependency on `@testing-library/react`. Apps call `render(ui, { wrapper })` themselves.

## Global Constraints

- `src/i18n/config.ts`, `format.ts`, `sync-cookie.ts` and `src/i18n/index.ts` must import nothing from the root barrel, from `next/headers`, from React, or from `node:*`: middleware imports `./i18n`. `src/errors.ts` is allowed (pure classes).
- Relative imports carry `.js` (`check:dist`). Explicit named exports in every barrel, no wildcards.
- `'use client'` on each leaf under `src/i18n/client/`; `import 'server-only'` at the top of `src/i18n/server/index.ts`.
- The framework reads no `process.env` for configuration. `NODE_ENV` for dev-only warnings is the one exception, as `api-config.ts` already does.
- `next-intl`'s `locale` is the base `IGRPLocale` (D-4). Formatting uses the format locale through the framework helpers only.
- `IGRP_LOCALE_COOKIE` here must equal `@igrp/framework-next-ui`'s; a test asserts it.
- New dependencies of `framework-next`: `next-intl` (`^4.14.0`), `@igrp/igrp-framework-react-design-system` (`workspace:*`, already transitive through `next-ui`; declared because `./i18n` types and the root layout import it directly).
- Changesets `patch`: `@igrp/framework-next`, `@igrp/framework-next-i18n`. Root `build:framework` gains `pnpm build:i18n-tools` at the end.
- ESLint + Prettier in framework packages.

## Review Focus

1. A cookie holding a locale the app did not enable (`en` when `locales: ['pt']`) must be skipped under both strategies, so an app that narrows its locales never renders one it does not ship. Test in Task 1.
2. `igrpSetLocale` whose `persistLocale` throws must write no cookie and return `success: false`, so the cookie and profile never disagree. Test in Task 4.
3. `Accept-Language: fr;q=0.8, en;q=0.9` must pick `en` (q order), and `*` alone must pick nothing. Test in Task 1.
4. `igrpParseFormatLocales('pt-AO,en-US')` must map `pt` and `en`; `'de-DE'` and `'pt-PT,pt-BR'` must throw with code `IGRP_I18N_CONFIG_INVALID`. Test in Task 1.
5. `check-literals` must accept symbols-only text (`<span>—</span>`, `{"→"}`) and reject `useFormatter` imports, so the template's existing icon-only markup passes and the D-4 rule holds. Test in Task 9.

---

### Task 1: Edge-safe config, resolution and format helpers (`./i18n`)

**Files:**
- Create: `packages/framework/next/src/i18n/config.ts`
- Create: `packages/framework/next/src/i18n/format.ts`
- Create: `packages/framework/next/src/i18n/sync-cookie.ts`
- Create: `packages/framework/next/src/i18n/index.ts`
- Create: `packages/framework/next/src/i18n/__tests__/config.test.ts`
- Create: `packages/framework/next/src/i18n/__tests__/format.test.ts`
- Create: `packages/framework/next/src/i18n/__tests__/sync-cookie.test.ts`
- Modify: `packages/framework/next/package.json` (dependencies, `exports`)

**Interfaces:**
- Produces (all exported from `@igrp/framework-next/i18n`): `IGRP_LOCALES`, `IGRP_LOCALE_NATIVE_NAMES`, `IGRP_LOCALE_COOKIE`, `IGRP_DEFAULT_FORMAT_LOCALES`, `igrpLocaleCookieOptions(secure)`, `igrpIsLocale`, `igrpNormalizeLocale`, `igrpParseAcceptLanguage`, `igrpParseFormatLocales`, `igrpDefineI18n`, `igrpPickLocale`, `igrpSyncLocaleCookie`, `igrpFormatDate`, `igrpFormatDateTime`, `igrpFormatNumber`, `igrpCompare`, types `IGRPLocale`, `IGRPI18nConfig`, `IGRPI18nOptions`, `IGRPI18nOverrides`, `IGRPChromeStringsOverride`, `IGRPLocaleCandidates`, `IGRPDateInput`.

- [x] **Step 1: Declare dependencies and exports**

In `packages/framework/next/package.json`:

```json
"dependencies": {
  "@igrp/framework-next-auth": "workspace:*",
  "@igrp/framework-next-types": "workspace:*",
  "@igrp/framework-next-ui": "workspace:*",
  "@igrp/igrp-framework-react-design-system": "workspace:*",
  "@igrp/platform-access-management-client-ts": "^0.2.0-beta.17",
  "next-intl": "^4.14.0",
  "server-only": "^0.0.1"
}
```

Add to `exports` (keep the existing entries):

```json
"./i18n": {
  "types": "./dist/i18n/index.d.ts",
  "import": "./dist/i18n/index.js",
  "default": "./dist/i18n/index.js"
},
"./i18n/server": {
  "types": "./dist/i18n/server/index.d.ts",
  "import": "./dist/i18n/server/index.js",
  "default": "./dist/i18n/server/index.js"
},
"./i18n/client": {
  "types": "./dist/i18n/client/index.d.ts",
  "import": "./dist/i18n/client/index.js",
  "default": "./dist/i18n/client/index.js"
},
"./i18n/messages": {
  "types": "./dist/i18n/messages/index.d.ts",
  "import": "./dist/i18n/messages/index.js",
  "default": "./dist/i18n/messages/index.js"
},
"./i18n/testing": {
  "types": "./dist/i18n/testing/index.d.ts",
  "import": "./dist/i18n/testing/index.js",
  "default": "./dist/i18n/testing/index.js"
}
```

Run `pnpm install` at the repo root (`pnpm install:deps` if the registry needs the `.env` credentials) so `next-intl` resolves.

- [x] **Step 2: Write the failing tests**

`packages/framework/next/src/i18n/__tests__/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import {
  IGRP_DEFAULT_FORMAT_LOCALES,
  IGRP_LOCALE_COOKIE,
  igrpDefineI18n,
  igrpLocaleCookieOptions,
  igrpNormalizeLocale,
  igrpParseAcceptLanguage,
  igrpParseFormatLocales,
  igrpPickLocale,
} from '../config.js';

describe('igrpNormalizeLocale', () => {
  it('maps regional and oddly-cased tags to the base language', () => {
    expect(igrpNormalizeLocale('pt-CV')).toBe('pt');
    expect(igrpNormalizeLocale('pt_PT')).toBe('pt');
    expect(igrpNormalizeLocale('PT-br')).toBe('pt');
    expect(igrpNormalizeLocale(' en ')).toBe('en');
  });
  it('returns undefined for unsupported or non-string input', () => {
    expect(igrpNormalizeLocale('de')).toBeUndefined();
    expect(igrpNormalizeLocale('')).toBeUndefined();
    expect(igrpNormalizeLocale(null)).toBeUndefined();
    expect(igrpNormalizeLocale(7)).toBeUndefined();
  });
});

describe('igrpParseAcceptLanguage', () => {
  it('honours q-values and skips wildcard, q=0 and unsupported entries', () => {
    expect(igrpParseAcceptLanguage('fr;q=0.8, en;q=0.9')).toBe('en');
    expect(igrpParseAcceptLanguage('de-DE,fr-FR;q=0.9,en;q=0.8')).toBe('fr');
    expect(igrpParseAcceptLanguage('*')).toBeUndefined();
    expect(igrpParseAcceptLanguage('en;q=0, pt')).toBe('pt');
    expect(igrpParseAcceptLanguage('')).toBeUndefined();
    expect(igrpParseAcceptLanguage(null)).toBeUndefined();
  });
  it('keeps header order on ties', () => {
    expect(igrpParseAcceptLanguage('fr, en')).toBe('fr');
  });
});

describe('igrpParseFormatLocales', () => {
  it('returns {} for unset or blank', () => {
    expect(igrpParseFormatLocales(undefined)).toEqual({});
    expect(igrpParseFormatLocales('  ')).toEqual({});
  });
  it('maps each entry to its language', () => {
    expect(igrpParseFormatLocales('pt-AO,en-US')).toEqual({ pt: 'pt-AO', en: 'en-US' });
    expect(igrpParseFormatLocales(' pt-PT ')).toEqual({ pt: 'pt-PT' });
  });
  it('throws IGRP_I18N_CONFIG_INVALID for a non-platform language, a duplicate language or an invalid tag', () => {
    for (const raw of ['de-DE', 'pt-PT,pt-BR', 'pt-', 'en-GB,xx']) {
      expect(() => igrpParseFormatLocales(raw)).toThrowError(
        expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
      );
    }
  });
});

describe('igrpDefineI18n', () => {
  it('fills defaults and derives cookie-first without persistLocale', () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    expect(i18n.locales).toEqual(['pt', 'en', 'fr']);
    expect(i18n.formatLocales).toEqual(IGRP_DEFAULT_FORMAT_LOCALES);
    expect(i18n.resolution).toBe('cookie-first');
  });
  it('derives session-first with persistLocale and merges formatLocales', () => {
    const i18n = igrpDefineI18n({
      defaultLocale: 'en',
      locales: ['en', 'fr'],
      formatLocales: { en: 'en-US' },
      persistLocale: async () => {},
    });
    expect(i18n.resolution).toBe('session-first');
    expect(i18n.formatLocales).toEqual({ pt: 'pt-CV', en: 'en-US', fr: 'fr-FR' });
    expect(i18n.locales).toEqual(['en', 'fr']);
  });
  it('rejects a default outside locales, a non-platform locale, and a format locale under the wrong key', () => {
    expect(() => igrpDefineI18n({ defaultLocale: 'pt', locales: ['en'] })).toThrowError(
      expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
    );
    expect(() => igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'de' as never] })).toThrowError(
      expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
    );
    expect(() => igrpDefineI18n({ defaultLocale: 'pt', formatLocales: { pt: 'en-GB' } })).toThrowError(
      expect.objectContaining({ code: 'IGRP_I18N_CONFIG_INVALID' }),
    );
  });
});

describe('igrpPickLocale', () => {
  const cookieFirst = igrpDefineI18n({ defaultLocale: 'pt' });
  const sessionFirst = igrpDefineI18n({ defaultLocale: 'pt', persistLocale: async () => {} });

  it('cookie-first: cookie → session → Accept-Language → default', () => {
    expect(igrpPickLocale({ cookie: 'fr', session: 'en', acceptLanguage: 'en' }, cookieFirst)).toBe('fr');
    expect(igrpPickLocale({ session: 'en-GB', acceptLanguage: 'fr' }, cookieFirst)).toBe('en');
    expect(igrpPickLocale({ acceptLanguage: 'fr-FR' }, cookieFirst)).toBe('fr');
    expect(igrpPickLocale({}, cookieFirst)).toBe('pt');
  });

  it('session-first: session → cookie → Accept-Language → default', () => {
    expect(igrpPickLocale({ cookie: 'fr', session: 'en', acceptLanguage: 'fr' }, sessionFirst)).toBe('en');
    expect(igrpPickLocale({ cookie: 'fr', acceptLanguage: 'en' }, sessionFirst)).toBe('fr');
  });

  it('skips candidates outside the enabled locales', () => {
    const ptOnly = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt'] });
    expect(igrpPickLocale({ cookie: 'en', session: 'fr', acceptLanguage: 'en' }, ptOnly)).toBe('pt');
    const ptEn = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'en'] });
    expect(igrpPickLocale({ cookie: 'fr', acceptLanguage: 'fr, en;q=0.5' }, ptEn)).toBe('en');
  });
});

describe('cookie', () => {
  it('has the shared name and one-year lax options; secure only when asked', () => {
    expect(IGRP_LOCALE_COOKIE).toBe('IGRP_LOCALE');
    expect(igrpLocaleCookieOptions(false)).toEqual({ path: '/', maxAge: 31_536_000, sameSite: 'lax', secure: false, httpOnly: false });
    expect(igrpLocaleCookieOptions(true).secure).toBe(true);
  });
});
```

`packages/framework/next/src/i18n/__tests__/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { igrpCompare, igrpFormatDate, igrpFormatDateTime, igrpFormatNumber } from '../format.js';

const date = new Date(Date.UTC(2026, 9, 12, 14, 5));

describe('format helpers', () => {
  it('format dates as dd/mm/yyyy in the three default regions', () => {
    expect(igrpFormatDate(date, 'pt-CV')).toBe('12/10/2026');
    expect(igrpFormatDate(date, 'en-GB')).toBe('12/10/2026');
    expect(igrpFormatDate(date, 'fr-FR')).toBe('12/10/2026');
  });
  it('return "" for missing or invalid input', () => {
    expect(igrpFormatDate(null, 'pt-CV')).toBe('');
    expect(igrpFormatDate('not a date', 'pt-CV')).toBe('');
    expect(igrpFormatDateTime(undefined, 'pt-CV')).toBe('');
  });
  it('append HH:mm for date-times', () => {
    expect(igrpFormatDateTime(date, 'en-GB', { timeZone: 'UTC' })).toMatch(/12\/10\/2026,? 14:05/);
  });
  it('format numbers per region', () => {
    expect(igrpFormatNumber(1234.5, 'en-GB')).toBe('1,234.5');
    expect(igrpFormatNumber(1234.5, 'fr-FR')).toBe('1 234,5');
  });
  it('compare case- and accent-insensitively, numeric-aware', () => {
    expect(igrpCompare('ação', 'Acao', 'pt-CV')).toBe(0);
    expect(igrpCompare('item2', 'item10', 'en-GB')).toBeLessThan(0);
    expect(igrpCompare(undefined, 'a', 'en-GB')).toBeLessThan(0);
  });
});
```

`packages/framework/next/src/i18n/__tests__/sync-cookie.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { igrpDefineI18n } from '../config.js';
import { igrpSyncLocaleCookie } from '../sync-cookie.js';

const request = (cookie?: string) =>
  new NextRequest('https://app.example/x', { headers: cookie ? { cookie: `IGRP_LOCALE=${cookie}` } : {} });

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
    expect(igrpSyncLocaleCookie(request('en'), NextResponse.next(), 'en', sessionFirst).cookies.get('IGRP_LOCALE')).toBeUndefined();
    expect(igrpSyncLocaleCookie(request('en'), NextResponse.next(), 'de', sessionFirst).cookies.get('IGRP_LOCALE')).toBeUndefined();
    const ptOnly = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt'], persistLocale: async () => {} });
    expect(igrpSyncLocaleCookie(request('pt'), NextResponse.next(), 'fr', ptOnly).cookies.get('IGRP_LOCALE')).toBeUndefined();
  });
});
```

- [x] **Step 3: Run them to see them fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/config.test.ts src/i18n/__tests__/format.test.ts src/i18n/__tests__/sync-cookie.test.ts`
Expected: FAIL, modules not found.

- [x] **Step 4: Implement `config.ts`**

`packages/framework/next/src/i18n/config.ts`:

```ts
// Edge-safe: imported by app middleware. No React, no next/headers, no root
// barrel (which reaches node:async_hooks), no process.env for configuration.
import type { IGRPI18nConfigBase, IGRPLocale } from '@igrp/framework-next-types';
import type { IGRPChromeStrings } from '@igrp/framework-next-ui';
import type { IGRPI18nStringsOverride } from '@igrp/igrp-framework-react-design-system';

import { IgrpConfigError } from '../errors.js';

export type { IGRPLocale };

/** Platform locales. An app enables a subset, never others. */
export const IGRP_LOCALES = ['pt', 'en', 'fr'] as const satisfies readonly IGRPLocale[];

/** Native language names: a language is always shown in its own name, untranslated. */
export const IGRP_LOCALE_NATIVE_NAMES: Record<IGRPLocale, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
};

/** Shared with `@igrp/framework-next-ui` (its cookie fallback); a test asserts equality. */
export const IGRP_LOCALE_COOKIE = 'IGRP_LOCALE';

export const IGRP_DEFAULT_FORMAT_LOCALES: Readonly<Record<IGRPLocale, string>> = {
  pt: 'pt-CV',
  en: 'en-GB',
  fr: 'fr-FR',
};

/**
 * `path=/` so every IGRP app behind the gateway shares the choice; not
 * `httpOnly` because `global-error.tsx` reads it from `document.cookie`.
 */
export function igrpLocaleCookieOptions(secure: boolean) {
  return { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const, secure, httpOnly: false };
}

export function igrpIsLocale(value: unknown): value is IGRPLocale {
  return typeof value === 'string' && (IGRP_LOCALES as readonly string[]).includes(value);
}

/** `pt-CV`, `pt_PT`, `PT-br`, ` en ` → base language; unsupported → `undefined`. */
export function igrpNormalizeLocale(tag: unknown): IGRPLocale | undefined {
  if (typeof tag !== 'string') return undefined;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return igrpIsLocale(base) ? base : undefined;
}

/** First supported language of an `Accept-Language` header, by q-value then header order. */
export function igrpParseAcceptLanguage(header: string | null | undefined): IGRPLocale | undefined {
  if (!header) return undefined;
  const entries = header
    .split(',')
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(';');
      const qParam = params.map((p) => p.trim()).find((p) => p.toLowerCase().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: rawTag?.trim() ?? '', q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((e) => e.tag && e.tag !== '*' && e.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const entry of entries) {
    const locale = igrpNormalizeLocale(entry.tag);
    if (locale) return locale;
  }
  return undefined;
}

function invalid(message: string): IgrpConfigError {
  return new IgrpConfigError('IGRP_I18N_CONFIG_INVALID', `[igrp-i18n] ${message}`);
}

function assertFormatLocale(locale: IGRPLocale, tag: string): void {
  let canonical: string | undefined;
  try {
    canonical = Intl.getCanonicalLocales(tag)[0];
  } catch {
    canonical = undefined;
  }
  if (!canonical) throw invalid(`"${tag}" is not a valid BCP-47 tag.`);
  if (igrpNormalizeLocale(canonical) !== locale) {
    throw invalid(`format locale "${tag}" must be a region of "${locale}".`);
  }
}

/**
 * Parses `IGRP_FORMAT_LOCALES` (`pt-PT` or `pt-AO,en-US`) into a partial map
 * keyed by language. The template reads the env var and passes the string;
 * the framework itself never reads `process.env`.
 */
export function igrpParseFormatLocales(raw: string | undefined): Partial<Record<IGRPLocale, string>> {
  const out: Partial<Record<IGRPLocale, string>> = {};
  if (!raw || !raw.trim()) return out;
  for (const entry of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const locale = igrpNormalizeLocale(entry);
    if (!locale) throw invalid(`"${entry}" is not a region of a platform language (pt, en, fr).`);
    if (out[locale]) throw invalid(`language "${locale}" appears twice in IGRP_FORMAT_LOCALES.`);
    assertFormatLocale(locale, entry);
    out[locale] = entry;
  }
  return out;
}

/** Deep-partial of the chrome catalog, group by group. */
export type IGRPChromeStringsOverride = {
  [G in keyof IGRPChromeStrings]?: Partial<IGRPChromeStrings[G]>;
};

export type IGRPI18nOverrides = Partial<
  Record<IGRPLocale, { designSystem?: IGRPI18nStringsOverride; chrome?: IGRPChromeStringsOverride }>
>;

export interface IGRPI18nConfig extends IGRPI18nConfigBase {
  readonly overrides?: IGRPI18nOverrides;
}

export interface IGRPI18nOptions {
  defaultLocale: IGRPLocale;
  /** Defaults to all platform locales, in this order. */
  locales?: readonly IGRPLocale[];
  /** Merged over `IGRP_DEFAULT_FORMAT_LOCALES`. */
  formatLocales?: Partial<Record<IGRPLocale, string>>;
  timeZone?: string;
  getSessionLocale?: () => Promise<string | null | undefined>;
  /** Its presence selects `session-first` resolution. */
  persistLocale?: (locale: IGRPLocale) => Promise<void>;
  overrides?: IGRPI18nOverrides;
}

/** Validates and freezes the app's i18n configuration. Throws `IgrpConfigError('IGRP_I18N_CONFIG_INVALID')`. */
export function igrpDefineI18n(options: IGRPI18nOptions): IGRPI18nConfig {
  const locales = options.locales ?? IGRP_LOCALES;
  if (locales.length === 0) throw invalid('`locales` must not be empty.');
  for (const locale of locales) {
    if (!igrpIsLocale(locale)) throw invalid(`"${String(locale)}" is not a platform locale (pt, en, fr).`);
  }
  if (!locales.includes(options.defaultLocale)) {
    throw invalid(`defaultLocale "${options.defaultLocale}" is not in locales [${locales.join(', ')}].`);
  }
  const formatLocales = { ...IGRP_DEFAULT_FORMAT_LOCALES } as Record<IGRPLocale, string>;
  for (const [locale, tag] of Object.entries(options.formatLocales ?? {}) as [IGRPLocale, string | undefined][]) {
    if (!tag) continue;
    if (!igrpIsLocale(locale)) throw invalid(`formatLocales key "${locale}" is not a platform locale.`);
    assertFormatLocale(locale, tag);
    formatLocales[locale] = tag;
  }
  return Object.freeze({
    defaultLocale: options.defaultLocale,
    locales: Object.freeze([...locales]),
    formatLocales: Object.freeze(formatLocales),
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    resolution: options.persistLocale ? 'session-first' : 'cookie-first',
    ...(options.getSessionLocale ? { getSessionLocale: options.getSessionLocale } : {}),
    ...(options.persistLocale ? { persistLocale: options.persistLocale } : {}),
    ...(options.overrides ? { overrides: options.overrides } : {}),
  });
}

export type IGRPLocaleCandidates = {
  /** `IGRP_LOCALE` cookie value. */
  cookie?: string | null;
  /** `session.user.locale`, raw. */
  session?: string | null;
  /** Raw `Accept-Language` header. */
  acceptLanguage?: string | null;
};

/** Pure resolution. Candidates outside the enabled locales are skipped. */
export function igrpPickLocale(
  candidates: IGRPLocaleCandidates,
  i18n: Pick<IGRPI18nConfig, 'locales' | 'defaultLocale' | 'resolution'>,
): IGRPLocale {
  const enabled = (value: IGRPLocale | undefined) =>
    value && i18n.locales.includes(value) ? value : undefined;
  const cookie = enabled(igrpNormalizeLocale(candidates.cookie));
  const session = enabled(igrpNormalizeLocale(candidates.session));
  const header = () => {
    const picked = igrpParseAcceptLanguage(candidates.acceptLanguage);
    if (enabled(picked)) return picked;
    // The first supported language may be disabled for this app; re-scan with
    // only enabled locales accepted.
    const header = candidates.acceptLanguage ?? '';
    for (const part of header.split(',')) {
      const value = enabled(igrpNormalizeLocale(part.split(';')[0]));
      if (value) return value;
    }
    return undefined;
  };
  const ordered =
    i18n.resolution === 'session-first' ? [session, cookie] : [cookie, session];
  return ordered.find(Boolean) ?? header() ?? i18n.defaultLocale;
}
```

Add `'IGRP_I18N_CONFIG_INVALID'` to the `IgrpErrorCode` union in `packages/framework/next/src/errors.ts` (it is `IgrpErrorCode | (string & {})` at the constructor, so this is for completions and the chrome map; the chrome catalog does not need an entry for it: it falls to the generic copy).

- [x] **Step 5: Implement `format.ts` and `sync-cookie.ts`**

`packages/framework/next/src/i18n/format.ts`:

```ts
// Pure Intl helpers over the format locale (`pt-CV`, `en-GB`, …). Never a bare
// `pt`: Intl resolves it to Brazilian conventions.
export type IGRPDateInput = Date | string | number | null | undefined;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' };

function toDate(value: IGRPDateInput): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** `dd/mm/yyyy` in every platform region; `''` for missing or invalid input. */
export function igrpFormatDate(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_OPTIONS,
): string {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat(formatLocale, options).format(date) : '';
}

/** Date plus `HH:mm`. */
export function igrpFormatDateTime(
  value: IGRPDateInput,
  formatLocale: string,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS,
): string {
  return igrpFormatDate(value, formatLocale, { ...DATE_TIME_OPTIONS, ...options });
}

export function igrpFormatNumber(
  value: number | bigint,
  formatLocale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(formatLocale, options).format(value);
}

const collators = new Map<string, Intl.Collator>();

/** Case- and accent-insensitive, numeric-aware comparison for `Array#sort`. */
export function igrpCompare(
  a: string | null | undefined,
  b: string | null | undefined,
  formatLocale: string,
): number {
  let collator = collators.get(formatLocale);
  if (!collator) {
    collator = new Intl.Collator(formatLocale, { sensitivity: 'base', numeric: true });
    collators.set(formatLocale, collator);
  }
  return collator.compare(a ?? '', b ?? '');
}
```

`packages/framework/next/src/i18n/sync-cookie.ts`:

```ts
import type { NextRequest, NextResponse } from 'next/server';

import { IGRP_LOCALE_COOKIE, igrpLocaleCookieOptions, igrpNormalizeLocale, type IGRPI18nConfig } from './config.js';

/**
 * Session-first apps call this from middleware with the token they already
 * decoded: when the profile locale differs from the cookie, the cookie is
 * rewritten so pages rendered without a session (login after logout, public
 * flows) follow the last signed-in user. A no-op under cookie-first, where a
 * seeded cookie would be indistinguishable from a choice (ADR 0001).
 */
export function igrpSyncLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  tokenLocale: unknown,
  i18n: Pick<IGRPI18nConfig, 'locales' | 'resolution'>,
): NextResponse {
  if (i18n.resolution !== 'session-first') return response;
  const locale = igrpNormalizeLocale(tokenLocale);
  if (!locale || !i18n.locales.includes(locale)) return response;
  if (request.cookies.get(IGRP_LOCALE_COOKIE)?.value === locale) return response;
  const secure = request.nextUrl.protocol === 'https:';
  response.cookies.set(IGRP_LOCALE_COOKIE, locale, igrpLocaleCookieOptions(secure));
  return response;
}
```

`packages/framework/next/src/i18n/index.ts`:

```ts
// `@igrp/framework-next/i18n` — Edge-safe entry. Keep it free of React,
// next/headers and the root barrel; app middleware imports it.
export {
  IGRP_LOCALES,
  IGRP_LOCALE_NATIVE_NAMES,
  IGRP_LOCALE_COOKIE,
  IGRP_DEFAULT_FORMAT_LOCALES,
  igrpLocaleCookieOptions,
  igrpIsLocale,
  igrpNormalizeLocale,
  igrpParseAcceptLanguage,
  igrpParseFormatLocales,
  igrpDefineI18n,
  igrpPickLocale,
  type IGRPLocale,
  type IGRPI18nConfig,
  type IGRPI18nOptions,
  type IGRPI18nOverrides,
  type IGRPChromeStringsOverride,
  type IGRPLocaleCandidates,
} from './config.js';
export { igrpSyncLocaleCookie } from './sync-cookie.js';
export {
  igrpFormatDate,
  igrpFormatDateTime,
  igrpFormatNumber,
  igrpCompare,
  type IGRPDateInput,
} from './format.js';
```

- [x] **Step 6: Run the tests to see them pass**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/config.test.ts src/i18n/__tests__/format.test.ts src/i18n/__tests__/sync-cookie.test.ts`
Expected: PASS. If the `fr-FR` number assertion fails on the thin-space character, compare against `(1234.5).toLocaleString('fr-FR')` instead; the ICU data decides the separator.

- [x] **Step 7: Commit**

```bash
git add packages/framework/next/package.json pnpm-lock.yaml packages/framework/next/src/errors.ts packages/framework/next/src/i18n
git commit -m "feat(next): Edge-safe i18n config, resolution, format helpers and cookie sync (./i18n)"
```

---

### Task 2: Generic messages and the merge (`./i18n/messages`)

**Files:**
- Create: `packages/framework/next/src/i18n/fallback.ts`
- Create: `packages/framework/next/src/i18n/messages/pt.ts`, `en.ts`, `fr.ts`
- Create: `packages/framework/next/src/i18n/messages/index.ts`
- Create: `packages/framework/next/src/i18n/__tests__/messages.test.ts`

**Interfaces:**
- Produces: `IGRP_MESSAGES_PT | _EN | _FR`, `IGRPFrameworkMessages`, `igrpMergeMessages(i18n, locale, appCatalogs)`, `igrpDeepMergeMessages(base, override)`, `igrpOnIntlError`, `igrpGetMessageFallback`.

- [x] **Step 1: Write the failing test**

`packages/framework/next/src/i18n/__tests__/messages.test.ts`:

```ts
import { createTranslator } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { igrpDefineI18n } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import { IGRP_MESSAGES_EN, IGRP_MESSAGES_FR, IGRP_MESSAGES_PT, igrpDeepMergeMessages, igrpMergeMessages } from '../messages/index.js';

afterEach(() => vi.restoreAllMocks());

const flat = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? flat(v as object, `${p}${k}.`) : [`${p}${k}`]));

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
    const pt = igrpMergeMessages(i18n, 'pt', app) as { common: { actions: { retry: string; backHome: string } } };
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
```

- [x] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/messages.test.ts`
Expected: FAIL, modules not found.

- [x] **Step 3: Implement**

`packages/framework/next/src/i18n/fallback.ts`:

```ts
import { type IntlError, IntlErrorCode } from 'next-intl';

/** Missing keys warn in development and stay silent in production; other errors are logged. */
export function igrpOnIntlError(error: IntlError): void {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[igrp-i18n] ${error.message}`);
    return;
  }
  console.error('[igrp-i18n]', error);
}

/** Last step of the fallback chain: the key path itself. */
export function igrpGetMessageFallback({ namespace, key }: { namespace?: string; key: string }): string {
  return namespace ? `${namespace}.${key}` : key;
}
```

`packages/framework/next/src/i18n/messages/pt.ts`:

```ts
/** Generic namespaces every IGRP app gets. Apps own every other namespace and may shadow these keys. */
export const IGRP_MESSAGES_PT = {
  common: {
    actions: {
      backHome: 'Voltar ao início',
      retry: 'Tentar novamente',
      retrying: 'A tentar...',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      close: 'Fechar',
      search: 'Pesquisar',
      loading: 'A carregar...',
    },
    notAvailable: 'N/D',
    yes: 'Sim',
    no: 'Não',
  },
  i18n: {
    localeSwitcher: {
      label: 'Idioma',
      changeError: 'Não foi possível alterar o idioma. Tente novamente.',
    },
  },
  errors: {
    errorRef: 'ID de referência:',
    unexpected: {
      title: 'Ocorreu um erro inesperado.',
      description:
        'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
    },
    auth: {
      title: 'Não foi possível concluir a autenticação.',
      description:
        'Verifique a configuração do provedor de autenticação e as variáveis de ambiente. Se o problema persistir, contacte o suporte.',
    },
    status: {
      '401': 'Sessão necessária',
      '403': 'Acesso negado',
      '404': 'Página não encontrada',
      '500': 'Erro interno',
      '503': 'Serviço indisponível',
      fallback: 'Ocorreu um erro',
    },
  },
};

export type IGRPFrameworkMessages = typeof IGRP_MESSAGES_PT;
```

`packages/framework/next/src/i18n/messages/en.ts`:

```ts
import type { IGRPFrameworkMessages } from './pt.js';

export const IGRP_MESSAGES_EN: IGRPFrameworkMessages = {
  common: {
    actions: {
      backHome: 'Back to home',
      retry: 'Try again',
      retrying: 'Retrying...',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      close: 'Close',
      search: 'Search',
      loading: 'Loading...',
    },
    notAvailable: 'N/A',
    yes: 'Yes',
    no: 'No',
  },
  i18n: {
    localeSwitcher: {
      label: 'Language',
      changeError: 'The language could not be changed. Please try again.',
    },
  },
  errors: {
    errorRef: 'Reference ID:',
    unexpected: {
      title: 'An unexpected error occurred.',
      description:
        'Please try again. If the problem persists, contact the support team and quote the reference ID shown below.',
    },
    auth: {
      title: 'Authentication could not be completed.',
      description:
        'Check the authentication provider configuration and the environment variables. If the problem persists, contact support.',
    },
    status: {
      '401': 'Sign-in required',
      '403': 'Access denied',
      '404': 'Page not found',
      '500': 'Internal error',
      '503': 'Service unavailable',
      fallback: 'Something went wrong',
    },
  },
};
```

`packages/framework/next/src/i18n/messages/fr.ts`:

```ts
import type { IGRPFrameworkMessages } from './pt.js';

export const IGRP_MESSAGES_FR: IGRPFrameworkMessages = {
  common: {
    actions: {
      backHome: "Retour à l'accueil",
      retry: 'Réessayer',
      retrying: 'Nouvelle tentative...',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      close: 'Fermer',
      search: 'Rechercher',
      loading: 'Chargement...',
    },
    notAvailable: 'N/D',
    yes: 'Oui',
    no: 'Non',
  },
  i18n: {
    localeSwitcher: {
      label: 'Langue',
      changeError: "Impossible de changer la langue. Veuillez réessayer.",
    },
  },
  errors: {
    errorRef: 'Identifiant de référence :',
    unexpected: {
      title: "Une erreur inattendue s'est produite.",
      description:
        "Veuillez réessayer. Si le problème persiste, contactez l'équipe d'assistance en indiquant l'identifiant de référence ci-dessous.",
    },
    auth: {
      title: "L'authentification n'a pas pu être finalisée.",
      description:
        "Vérifiez la configuration du fournisseur d'authentification et les variables d'environnement. Si le problème persiste, contactez l'assistance.",
    },
    status: {
      '401': 'Connexion requise',
      '403': 'Accès refusé',
      '404': 'Page introuvable',
      '500': 'Erreur interne',
      '503': 'Service indisponible',
      fallback: "Une erreur s'est produite",
    },
  },
};
```

`packages/framework/next/src/i18n/messages/index.ts`:

```ts
import type { AbstractIntlMessages } from 'next-intl';

import type { IGRPI18nConfig, IGRPLocale } from '../config.js';
import { IGRP_MESSAGES_EN } from './en.js';
import { IGRP_MESSAGES_FR } from './fr.js';
import { IGRP_MESSAGES_PT, type IGRPFrameworkMessages } from './pt.js';

export { IGRP_MESSAGES_PT, IGRP_MESSAGES_EN, IGRP_MESSAGES_FR, type IGRPFrameworkMessages };

const FRAMEWORK: Record<IGRPLocale, AbstractIntlMessages> = {
  pt: IGRP_MESSAGES_PT,
  en: IGRP_MESSAGES_EN,
  fr: IGRP_MESSAGES_FR,
};

const isTree = (v: unknown): v is AbstractIntlMessages =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every key of `override` wins; keys missing from it keep `base`'s value. Neither input is mutated. */
export function igrpDeepMergeMessages(
  base: AbstractIntlMessages,
  override: AbstractIntlMessages,
): AbstractIntlMessages {
  const result: AbstractIntlMessages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isTree(current) && isTree(value) ? igrpDeepMergeMessages(current, value) : value;
  }
  return result;
}

export type IGRPAppCatalogs = Partial<Record<IGRPLocale, AbstractIntlMessages>>;

const cache = new WeakMap<IGRPAppCatalogs, Map<IGRPLocale, AbstractIntlMessages>>();

/**
 * Messages for `locale`: framework[locale] ⊕ (app[defaultLocale] ⊕ app[locale]).
 * The framework catalogs are complete in all three languages, so they need
 * no fallback of their own; the app's default catalog is the per-key
 * fallback for its other languages, and app keys shadow framework keys.
 * Cached per catalogs object and locale.
 */
export function igrpMergeMessages(
  i18n: Pick<IGRPI18nConfig, 'defaultLocale'>,
  locale: IGRPLocale,
  appCatalogs: IGRPAppCatalogs,
): AbstractIntlMessages {
  let perLocale = cache.get(appCatalogs);
  if (!perLocale) {
    perLocale = new Map();
    cache.set(appCatalogs, perLocale);
  }
  const hit = perLocale.get(locale);
  if (hit) return hit;

  const appDefault = appCatalogs[i18n.defaultLocale] ?? {};
  const appLocale = appCatalogs[locale] ?? {};
  const app = locale === i18n.defaultLocale ? appDefault : igrpDeepMergeMessages(appDefault, appLocale);
  const merged = igrpDeepMergeMessages(FRAMEWORK[locale], app);
  perLocale.set(locale, merged);
  return merged;
}
```

- [x] **Step 4: Run the test to see it pass**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/messages.test.ts`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add packages/framework/next/src/i18n/fallback.ts packages/framework/next/src/i18n/messages packages/framework/next/src/i18n/__tests__/messages.test.ts
git commit -m "feat(next): generic pt/en/fr message namespaces and the layered merge (./i18n/messages)"
```

---

### Task 3: Server resolution, request config and catalog selection (`./i18n/server`)

**Files:**
- Create: `packages/framework/next/src/i18n/server/resolve.ts`
- Create: `packages/framework/next/src/i18n/server/request-config.ts`
- Create: `packages/framework/next/src/i18n/server/strings.ts`
- Create: `packages/framework/next/src/i18n/server/index.ts`
- Create: `packages/framework/next/src/i18n/__tests__/resolve.test.ts`
- Create: `packages/framework/next/src/i18n/__tests__/strings.test.ts`

**Interfaces:**
- Produces: `igrpResolveLocale(i18n): Promise<IGRPLocale>` (React-cached per request), `igrpResolveFormatLocale(i18n): Promise<string>`, `igrpCreateRequestConfig(i18n, appCatalogs)`, `igrpGetDesignSystemStrings(i18n, locale): IGRPI18nStrings`, `igrpGetChromeStrings(i18n, locale): IGRPChromeStrings`.

- [x] **Step 1: Write the failing tests**

`packages/framework/next/src/i18n/__tests__/resolve.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();
const headerGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => ({ get: headerGet }),
}));
// React `cache` is per-request in RSC; in tests it would memoise across cases.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}));

const { igrpDefineI18n } = await import('../config.js');
const { igrpResolveLocale, igrpResolveFormatLocale } = await import('../server/resolve.js');
const { igrpCreateRequestConfig } = await import('../server/request-config.js');

beforeEach(() => {
  cookieGet.mockReset();
  headerGet.mockReset();
});

describe('igrpResolveLocale', () => {
  it('reads cookie, session and Accept-Language and applies the strategy', async () => {
    cookieGet.mockReturnValue({ value: 'fr' });
    headerGet.mockReturnValue('en');
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', getSessionLocale: async () => 'en-GB', persistLocale: async () => {} });
    expect(await igrpResolveLocale(i18n)).toBe('en');
    expect(await igrpResolveFormatLocale(i18n)).toBe('en-GB');
  });

  it('treats a failing getSessionLocale as unknown', async () => {
    cookieGet.mockReturnValue(undefined);
    headerGet.mockReturnValue('fr');
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', getSessionLocale: async () => { throw new Error('boom'); } });
    expect(await igrpResolveLocale(i18n)).toBe('fr');
  });

  it('rethrows Next control-flow errors from getSessionLocale', async () => {
    const bailout = Object.assign(new Error('bail'), { digest: 'DYNAMIC_SERVER_USAGE' });
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', getSessionLocale: async () => { throw bailout; } });
    await expect(igrpResolveLocale(i18n)).rejects.toBe(bailout);
  });
});

describe('igrpCreateRequestConfig', () => {
  it('returns locale, merged messages, timeZone and the fallback handlers', async () => {
    cookieGet.mockReturnValue({ value: 'fr' });
    headerGet.mockReturnValue(null);
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', timeZone: 'Atlantic/Cape_Verde' });
    const factory = igrpCreateRequestConfig(i18n, { pt: { app: { hi: 'Olá' } }, fr: { app: { hi: 'Salut' } } });
    const config = await factory({ requestLocale: Promise.resolve(undefined) } as never);
    expect(config.locale).toBe('fr');
    expect((config.messages as { app: { hi: string } }).app.hi).toBe('Salut');
    expect(config.timeZone).toBe('Atlantic/Cape_Verde');
    expect(typeof config.onError).toBe('function');
    expect(typeof config.getMessageFallback).toBe('function');
  });
});
```

`packages/framework/next/src/i18n/__tests__/strings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { IGRP_CHROME_STRINGS_EN } from '@igrp/framework-next-ui';
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
```

- [x] **Step 2: Run them to see them fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/resolve.test.ts src/i18n/__tests__/strings.test.ts`
Expected: FAIL, modules not found.

- [x] **Step 3: Implement**

`packages/framework/next/src/i18n/server/resolve.ts`:

```ts
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { unstable_rethrow } from 'next/navigation';

import { IGRP_LOCALE_COOKIE, type IGRPI18nConfig, type IGRPLocale, igrpPickLocale } from '../config.js';

async function sessionLocale(i18n: IGRPI18nConfig): Promise<string | null | undefined> {
  if (!i18n.getSessionLocale) return undefined;
  try {
    return await i18n.getSessionLocale();
  } catch (error) {
    // Next's dynamic-rendering bailout is control flow, not a failure.
    unstable_rethrow(error);
    return undefined;
  }
}

/** The request's locale; one resolution per request (React `cache`). */
export const igrpResolveLocale = cache(async (i18n: IGRPI18nConfig): Promise<IGRPLocale> => {
  const [session, cookieStore, headerStore] = await Promise.all([sessionLocale(i18n), cookies(), headers()]);
  return igrpPickLocale(
    {
      cookie: cookieStore.get(IGRP_LOCALE_COOKIE)?.value,
      session,
      acceptLanguage: headerStore.get('accept-language'),
    },
    i18n,
  );
});

export async function igrpResolveFormatLocale(i18n: IGRPI18nConfig): Promise<string> {
  return i18n.formatLocales[await igrpResolveLocale(i18n)];
}
```

`packages/framework/next/src/i18n/server/request-config.ts`:

```ts
import type { getRequestConfig } from 'next-intl/server';

import type { IGRPI18nConfig } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import { type IGRPAppCatalogs, igrpMergeMessages } from '../messages/index.js';
import { igrpResolveLocale } from './resolve.js';

type RequestConfigFactory = Parameters<typeof getRequestConfig>[0];

/**
 * The function an app passes to next-intl's `getRequestConfig` in its
 * `src/i18n/request.ts`. The locale comes from `igrpResolveLocale`, never from
 * the URL; messages are the layered merge of framework and app catalogs.
 */
export function igrpCreateRequestConfig(i18n: IGRPI18nConfig, appCatalogs: IGRPAppCatalogs): RequestConfigFactory {
  return async () => {
    const locale = await igrpResolveLocale(i18n);
    return {
      locale,
      messages: igrpMergeMessages(i18n, locale, appCatalogs),
      ...(i18n.timeZone ? { timeZone: i18n.timeZone } : {}),
      onError: igrpOnIntlError,
      getMessageFallback: igrpGetMessageFallback,
    };
  };
}
```

`packages/framework/next/src/i18n/server/strings.ts`:

```ts
import {
  IGRP_CHROME_STRINGS_EN,
  IGRP_CHROME_STRINGS_FR,
  IGRP_CHROME_STRINGS_PT,
  type IGRPChromeStrings,
} from '@igrp/framework-next-ui';
import {
  IGRP_I18N_DEFAULTS_EN,
  IGRP_I18N_DEFAULTS_FR,
  IGRP_I18N_DEFAULTS_PT,
  igrpMergeI18nStrings,
  type IGRPI18nStrings,
} from '@igrp/igrp-framework-react-design-system';

import type { IGRPChromeStringsOverride, IGRPI18nConfig, IGRPLocale } from '../config.js';

const DS: Record<IGRPLocale, IGRPI18nStrings> = { pt: IGRP_I18N_DEFAULTS_PT, en: IGRP_I18N_DEFAULTS_EN, fr: IGRP_I18N_DEFAULTS_FR };
const CHROME: Record<IGRPLocale, IGRPChromeStrings> = { pt: IGRP_CHROME_STRINGS_PT, en: IGRP_CHROME_STRINGS_EN, fr: IGRP_CHROME_STRINGS_FR };

const dsCache = new WeakMap<IGRPI18nConfig, Map<IGRPLocale, IGRPI18nStrings>>();
const chromeCache = new WeakMap<IGRPI18nConfig, Map<IGRPLocale, IGRPChromeStrings>>();

function memo<T>(store: WeakMap<IGRPI18nConfig, Map<IGRPLocale, T>>, i18n: IGRPI18nConfig, locale: IGRPLocale, build: () => T): T {
  let m = store.get(i18n);
  if (!m) {
    m = new Map();
    store.set(i18n, m);
  }
  const hit = m.get(locale);
  if (hit) return hit;
  const built = build();
  m.set(locale, built);
  return built;
}

function mergeChrome(base: IGRPChromeStrings, override?: IGRPChromeStringsOverride): IGRPChromeStrings {
  if (!override) return base;
  const result = { ...base } as Record<string, object>;
  for (const group of Object.keys(base) as (keyof IGRPChromeStrings)[]) {
    const patch = override[group];
    if (patch) result[group] = { ...base[group], ...patch };
  }
  return result as unknown as IGRPChromeStrings;
}

/** Design-system catalog for `locale` with the app's overrides merged. */
export function igrpGetDesignSystemStrings(i18n: IGRPI18nConfig, locale: IGRPLocale): IGRPI18nStrings {
  return memo(dsCache, i18n, locale, () => igrpMergeI18nStrings(DS[locale], i18n.overrides?.[locale]?.designSystem));
}

/** Chrome catalog for `locale` with the app's overrides merged. */
export function igrpGetChromeStrings(i18n: IGRPI18nConfig, locale: IGRPLocale): IGRPChromeStrings {
  return memo(chromeCache, i18n, locale, () => mergeChrome(CHROME[locale], i18n.overrides?.[locale]?.chrome));
}
```

`packages/framework/next/src/i18n/server/index.ts`:

```ts
import 'server-only';

export { igrpResolveLocale, igrpResolveFormatLocale } from './resolve.js';
export { igrpCreateRequestConfig } from './request-config.js';
export { igrpGetDesignSystemStrings, igrpGetChromeStrings } from './strings.js';
export { igrpSetLocale, type IGRPSetLocaleResult } from './set-locale.js';
export { igrpOnIntlError, igrpGetMessageFallback } from '../fallback.js';
```

(`set-locale.ts` is Task 4; create the barrel line now and the file next, or the type-check fails in between. Order the work so both land before Step 4's run.)

- [x] **Step 4: Run (after Task 4's file exists) and commit together with Task 4**

---

### Task 4: `igrpSetLocale`

**Files:**
- Create: `packages/framework/next/src/i18n/server/set-locale.ts`
- Create: `packages/framework/next/src/i18n/__tests__/set-locale.test.ts`

**Interfaces:**
- Produces: `igrpSetLocale(i18n, value: string): Promise<IGRPSetLocaleResult>`; `IGRPSetLocaleResult = { success: true; data: { locale: IGRPLocale; persisted: boolean } } | { success: false; error: string; status: number }`.

- [x] **Step 1: Write the failing test**

`packages/framework/next/src/i18n/__tests__/set-locale.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieSet = vi.fn();
const headerGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({ set: cookieSet }),
  headers: async () => ({ get: headerGet }),
}));

const { igrpDefineI18n } = await import('../config.js');
const { igrpSetLocale } = await import('../server/set-locale.js');

const OPTIONS = { path: '/', maxAge: 31_536_000, sameSite: 'lax', secure: false, httpOnly: false };

beforeEach(() => {
  cookieSet.mockReset();
  headerGet.mockReset().mockReturnValue(null);
});

describe('igrpSetLocale', () => {
  it('rejects an unsupported or disabled locale without side effects', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', locales: ['pt', 'en'] });
    expect(await igrpSetLocale(i18n, 'de')).toMatchObject({ success: false, status: 400 });
    expect(await igrpSetLocale(i18n, 'fr')).toMatchObject({ success: false, status: 400 });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it('writes only the cookie without persistLocale, normalising the value', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    expect(await igrpSetLocale(i18n, 'en-GB')).toEqual({ success: true, data: { locale: 'en', persisted: false } });
    expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', OPTIONS);
  });

  it('persists first, then writes the cookie', async () => {
    const calls: string[] = [];
    const persistLocale = vi.fn(async (l: string) => { calls.push(`persist:${l}`); });
    cookieSet.mockImplementation(() => calls.push('cookie'));
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', persistLocale });
    expect(await igrpSetLocale(i18n, 'fr')).toEqual({ success: true, data: { locale: 'fr', persisted: true } });
    expect(calls).toEqual(['persist:fr', 'cookie']);
  });

  it('writes no cookie when persistLocale throws', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', persistLocale: async () => { throw new Error('API down'); } });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await igrpSetLocale(i18n, 'fr')).toMatchObject({ success: false, status: 500 });
    expect(cookieSet).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it('marks the cookie secure behind an https proxy', async () => {
    headerGet.mockImplementation((name: string) => (name === 'x-forwarded-proto' ? 'https' : null));
    await igrpSetLocale(igrpDefineI18n({ defaultLocale: 'pt' }), 'en');
    expect(cookieSet).toHaveBeenCalledWith('IGRP_LOCALE', 'en', { ...OPTIONS, secure: true });
  });
});
```

- [x] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/set-locale.test.ts`
Expected: FAIL, module not found.

- [x] **Step 3: Implement**

`packages/framework/next/src/i18n/server/set-locale.ts`:

```ts
import { cookies, headers } from 'next/headers';

import { IGRP_LOCALE_COOKIE, type IGRPI18nConfig, type IGRPLocale, igrpLocaleCookieOptions, igrpNormalizeLocale } from '../config.js';

export type IGRPSetLocaleResult =
  | { success: true; data: { locale: IGRPLocale; persisted: boolean } }
  | { success: false; error: string; status: number };

/**
 * Changes the UI language. Validate → `persistLocale` (when configured; a
 * failure aborts and nothing is written, so cookie and profile never
 * disagree) → cookie. Not a server action itself: Next accepts only function
 * declarations as exports of a `'use server'` file, so the app wraps it:
 *
 * ```ts
 * 'use server';
 * export async function setLocale(value: string) { return igrpSetLocale(i18n, value); }
 * ```
 */
export async function igrpSetLocale(i18n: IGRPI18nConfig, value: string): Promise<IGRPSetLocaleResult> {
  const locale = igrpNormalizeLocale(value);
  if (!locale || !i18n.locales.includes(locale)) {
    return { success: false, error: `Unsupported locale: ${value}`, status: 400 };
  }

  let persisted = false;
  if (i18n.persistLocale) {
    try {
      await i18n.persistLocale(locale);
      persisted = true;
    } catch (error) {
      console.error('[igrp-i18n] persistLocale failed; the locale was not changed.', error);
      return { success: false, error: 'Could not save the language preference.', status: 500 };
    }
  }

  const headerStore = await headers();
  const proto = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const cookieStore = await cookies();
  cookieStore.set(IGRP_LOCALE_COOKIE, locale, igrpLocaleCookieOptions(proto === 'https'));

  return { success: true, data: { locale, persisted } };
}
```

- [x] **Step 4: Run Tasks 3 and 4 tests, then commit both**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n && pnpm --filter @igrp/framework-next typecheck`
Expected: PASS; exit 0.

```bash
git add packages/framework/next/src/i18n/server packages/framework/next/src/i18n/__tests__/resolve.test.ts packages/framework/next/src/i18n/__tests__/strings.test.ts packages/framework/next/src/i18n/__tests__/set-locale.test.ts
git commit -m "feat(next): server locale resolution, request config, catalog selection and igrpSetLocale (./i18n/server)"
```

---

### Task 5: Client provider, locale info, format hook and switcher (`./i18n/client`, `./i18n/testing`)

**Files:**
- Create: `packages/framework/next/src/i18n/client/locale-info.tsx`
- Create: `packages/framework/next/src/i18n/client/provider.tsx`
- Create: `packages/framework/next/src/i18n/client/use-format.ts`
- Create: `packages/framework/next/src/i18n/client/locale-switcher.tsx`
- Create: `packages/framework/next/src/i18n/client/index.ts`
- Create: `packages/framework/next/src/i18n/testing/index.tsx`
- Create: `packages/framework/next/src/i18n/__tests__/client.test.tsx`

**Interfaces:**
- Produces: `IGRPIntlProvider(props: IGRPIntlProviderProps)`, `useIGRPLocaleInfo(): { locale, formatLocale, locales }`, `useIGRPFormat()`, `IGRPLocaleSwitcher({ action, onChanged?, className? })`, `IGRPIntlTestProvider({ locale?, messages?, children })`.

- [x] **Step 1: Write the failing test**

`packages/framework/next/src/i18n/__tests__/client.test.tsx`:

```tsx
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
        <IGRPLocaleSwitcher action={async () => ({ success: true, data: { locale: 'fr', persisted: false } })} />
      </IGRPIntlTestProvider>,
    );
    expect(html).toContain('FR');
    expect(html).toContain('Langue');
  });

  it('IGRPLocaleSwitcher renders nothing with a single enabled locale', () => {
    const html = renderToString(
      <IGRPIntlTestProvider locale="pt" locales={['pt']}>
        <IGRPLocaleSwitcher action={async () => ({ success: true, data: { locale: 'pt', persisted: false } })} />
      </IGRPIntlTestProvider>,
    );
    expect(html).toBe('');
  });
});
```

- [x] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/client.test.tsx`
Expected: FAIL, modules not found.

- [x] **Step 3: Implement the client leaves**

`packages/framework/next/src/i18n/client/locale-info.tsx`:

```tsx
'use client';

import { createContext, useContext } from 'react';

import { IGRP_DEFAULT_FORMAT_LOCALES, IGRP_LOCALES, type IGRPLocale } from '../config.js';

export type IGRPLocaleInfo = {
  locale: IGRPLocale;
  formatLocale: string;
  locales: readonly IGRPLocale[];
};

const DEFAULT_INFO: IGRPLocaleInfo = {
  locale: 'pt',
  formatLocale: IGRP_DEFAULT_FORMAT_LOCALES.pt,
  locales: IGRP_LOCALES,
};

export const IGRPLocaleInfoContext = createContext<IGRPLocaleInfo>(DEFAULT_INFO);

/** Locale, format locale and enabled locales of the current request; pt defaults without a provider. */
export function useIGRPLocaleInfo(): IGRPLocaleInfo {
  return useContext(IGRPLocaleInfoContext);
}
```

`packages/framework/next/src/i18n/client/provider.tsx`:

```tsx
'use client';

import { useMemo, type ReactNode } from 'react';
import { type AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { IGRPChromeI18nProvider, type IGRPChromeStrings } from '@igrp/framework-next-ui';
import { IGRPI18nProvider, type IGRPI18nStrings } from '@igrp/igrp-framework-react-design-system';

import type { IGRPLocale } from '../config.js';
import { igrpGetMessageFallback, igrpOnIntlError } from '../fallback.js';
import { IGRPLocaleInfoContext, type IGRPLocaleInfo } from './locale-info.js';

export interface IGRPIntlProviderProps {
  locale: IGRPLocale;
  formatLocale: string;
  locales: readonly IGRPLocale[];
  timeZone?: string;
  /** Already merged on the server (`igrpMergeMessages`). */
  messages: AbstractIntlMessages;
  designSystemStrings: IGRPI18nStrings;
  chromeStrings: IGRPChromeStrings;
  children: ReactNode;
}

/**
 * Client i18n context: next-intl (app + framework messages), the design-system
 * catalog and the chrome catalog for the current locale. The error and
 * fallback handlers are functions, which cannot cross from the server layout,
 * so they are wired here. Mounted by `IGRPRootLayout` when `config.i18n` is set.
 */
export function IGRPIntlProvider({
  locale,
  formatLocale,
  locales,
  timeZone,
  messages,
  designSystemStrings,
  chromeStrings,
  children,
}: IGRPIntlProviderProps) {
  const info = useMemo<IGRPLocaleInfo>(() => ({ locale, formatLocale, locales }), [locale, formatLocale, locales]);
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      onError={igrpOnIntlError}
      getMessageFallback={igrpGetMessageFallback}
    >
      <IGRPLocaleInfoContext.Provider value={info}>
        <IGRPI18nProvider strings={designSystemStrings} locale={formatLocale}>
          <IGRPChromeI18nProvider strings={chromeStrings}>{children}</IGRPChromeI18nProvider>
        </IGRPI18nProvider>
      </IGRPLocaleInfoContext.Provider>
    </NextIntlClientProvider>
  );
}
```

`packages/framework/next/src/i18n/client/use-format.ts`:

```ts
'use client';

import { type IGRPDateInput, igrpCompare, igrpFormatDate, igrpFormatDateTime, igrpFormatNumber } from '../format.js';
import { useIGRPLocaleInfo } from './locale-info.js';

/** The format helpers bound to the current format locale. */
export function useIGRPFormat() {
  const { locale, formatLocale } = useIGRPLocaleInfo();
  return {
    locale,
    formatLocale,
    formatDate: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) => igrpFormatDate(value, formatLocale, options),
    formatDateTime: (value: IGRPDateInput, options?: Intl.DateTimeFormatOptions) => igrpFormatDateTime(value, formatLocale, options),
    formatNumber: (value: number | bigint, options?: Intl.NumberFormatOptions) => igrpFormatNumber(value, formatLocale, options),
    compare: (a: string | null | undefined, b: string | null | undefined) => igrpCompare(a, b, formatLocale),
  };
}
```

`packages/framework/next/src/i18n/client/locale-switcher.tsx` (the application center's switcher, decoupled from next-auth):

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

import { IGRP_LOCALE_NATIVE_NAMES, type IGRPLocale } from '../config.js';
import type { IGRPSetLocaleResult } from '../server/set-locale.js';
import { useIGRPLocaleInfo } from './locale-info.js';

export interface IGRPLocaleSwitcherProps {
  /** The app's `'use server'` wrapper around `igrpSetLocale`. Server actions cross to client props. */
  action: (value: string) => Promise<IGRPSetLocaleResult>;
  /**
   * Runs after a successful change and before `router.refresh()`. An app whose
   * session token must follow calls next-auth `update({ locale })` here. A
   * function prop, so pass it from a client component.
   */
  onChanged?: (locale: IGRPLocale) => void | Promise<void>;
  className?: string;
}

/**
 * Icon-sized language selector: the current code (PT, EN, FR) opens a menu of
 * the enabled locales in their native names. Renders nothing when fewer than
 * two locales are enabled.
 */
export function IGRPLocaleSwitcher({ action, onChanged, className }: IGRPLocaleSwitcherProps) {
  const t = useTranslations('i18n.localeSwitcher');
  const { locale, locales } = useIGRPLocaleInfo();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (locales.length < 2) return null;

  const handleChange = (next: string) => {
    if (next === locale) return;
    setFailed(false);
    startTransition(async () => {
      const result = await action(next);
      if (!result.success) {
        setFailed(true);
        return;
      }
      await onChanged?.(result.data.locale);
      router.refresh();
    });
  };

  const label = failed ? t('changeError') : t('label');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative size-6', className)}
          disabled={isPending}
          aria-label={label}
          title={label}
        >
          {isPending ? (
            <IGRPIcon iconName="LoaderCircle" strokeWidth={2} className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <span aria-hidden="true" className="text-xs font-semibold">
              {locale.toUpperCase()}
            </span>
          )}
          {failed && <span aria-hidden="true" className="bg-destructive absolute top-0 right-0 size-1.5 rounded-full" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          {locales.map((code) => (
            <DropdownMenuRadioItem key={code} value={code} lang={code}>
              {IGRP_LOCALE_NATIVE_NAMES[code]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

`packages/framework/next/src/i18n/client/index.ts`:

```ts
export { IGRPIntlProvider, type IGRPIntlProviderProps } from './provider.js';
export { useIGRPLocaleInfo, type IGRPLocaleInfo } from './locale-info.js';
export { useIGRPFormat } from './use-format.js';
export { IGRPLocaleSwitcher, type IGRPLocaleSwitcherProps } from './locale-switcher.js';
export type { IGRPSetLocaleResult } from '../server/set-locale.js';
```

`packages/framework/next/src/i18n/testing/index.tsx`:

```tsx
import type { ReactNode } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import { IGRP_CHROME_STRINGS_EN, IGRP_CHROME_STRINGS_FR, IGRP_CHROME_STRINGS_PT } from '@igrp/framework-next-ui';
import { IGRP_I18N_DEFAULTS_EN, IGRP_I18N_DEFAULTS_FR, IGRP_I18N_DEFAULTS_PT } from '@igrp/igrp-framework-react-design-system';

import { IGRPIntlProvider } from '../client/provider.js';
import { IGRP_DEFAULT_FORMAT_LOCALES, IGRP_LOCALES, type IGRPLocale } from '../config.js';
import { igrpMergeMessages } from '../messages/index.js';

const DS = { pt: IGRP_I18N_DEFAULTS_PT, en: IGRP_I18N_DEFAULTS_EN, fr: IGRP_I18N_DEFAULTS_FR };
const CHROME = { pt: IGRP_CHROME_STRINGS_PT, en: IGRP_CHROME_STRINGS_EN, fr: IGRP_CHROME_STRINGS_FR };

export interface IGRPIntlTestProviderProps {
  locale?: IGRPLocale;
  locales?: readonly IGRPLocale[];
  formatLocale?: string;
  /** App catalogs keyed by locale; framework namespaces are merged underneath. */
  messages?: Partial<Record<IGRPLocale, AbstractIntlMessages>>;
  children: ReactNode;
}

/**
 * The same client context `IGRPRootLayout` mounts, for tests:
 * `render(<X />, { wrapper: ({ children }) => <IGRPIntlTestProvider locale="en">{children}</IGRPIntlTestProvider> })`.
 */
export function IGRPIntlTestProvider({
  locale = 'pt',
  locales = IGRP_LOCALES,
  formatLocale = IGRP_DEFAULT_FORMAT_LOCALES[locale],
  messages = {},
  children,
}: IGRPIntlTestProviderProps) {
  return (
    <IGRPIntlProvider
      locale={locale}
      formatLocale={formatLocale}
      locales={locales}
      messages={igrpMergeMessages({ defaultLocale: locale }, locale, messages)}
      designSystemStrings={DS[locale]}
      chromeStrings={CHROME[locale]}
    >
      {children}
    </IGRPIntlProvider>
  );
}
```

- [x] **Step 4: Run the test to see it pass**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/client.test.tsx`
Expected: PASS. If `renderToString` of the Radix dropdown complains about a missing `TooltipProvider` or similar context, wrap the switcher in the test with the design system's `TooltipProvider`; the assertions stay.

- [x] **Step 5: Commit**

```bash
git add packages/framework/next/src/i18n/client packages/framework/next/src/i18n/testing packages/framework/next/src/i18n/__tests__/client.test.tsx
git commit -m "feat(next): IGRPIntlProvider, locale info, useIGRPFormat, IGRPLocaleSwitcher and the test provider"
```

---

### Task 6: Cookie-name parity with `next-ui`

**Files:**
- Create: `packages/framework/next/src/i18n/__tests__/cookie-parity.test.ts`

- [x] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest';
import { IGRP_LOCALE_COOKIE as UI_COOKIE } from '@igrp/framework-next-ui';

import { IGRP_LOCALE_COOKIE } from '../config.js';

describe('IGRP_LOCALE cookie name', () => {
  it('is the same constant in framework-next and framework-next-ui', () => {
    expect(IGRP_LOCALE_COOKIE).toBe(UI_COOKIE);
  });
});
```

- [x] **Step 2: Run it**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/i18n/__tests__/cookie-parity.test.ts`
Expected: PASS (both are `'IGRP_LOCALE'`).

- [x] **Step 3: Commit**

```bash
git add packages/framework/next/src/i18n/__tests__/cookie-parity.test.ts
git commit -m "test(next): pin the IGRP_LOCALE cookie name to framework-next-ui's"
```

---

### Task 7: `Accept-Language` on the access client

**Files:**
- Modify: `packages/framework/next/src/lib/api-config.ts` (`IGRPClientRuntimeConfig`)
- Modify: `packages/framework/next/src/lib/api-client.ts`
- Create: `packages/framework/next/src/lib/__tests__/api-client-locale.test.ts`

**Interfaces:**
- Produces: `IGRPClientRuntimeConfig.locale?: string`; `igrpGetAccessClient()` sends `Accept-Language` when set.

- [x] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn(() => ({ marker: 'client' }));
vi.mock('@igrp/platform-access-management-client-ts', () => ({
  AccessManagementClient: { create },
}));
const getConfig = vi.fn();
vi.mock('../api-config.js', () => ({
  igrpGetAccessClientConfig: () => getConfig(),
  igrpResetAccessClientConfig: vi.fn(),
}));

const { igrpGetAccessClient } = await import('../api-client.js');

beforeEach(() => create.mockClear());

describe('igrpGetAccessClient headers', () => {
  it('adds Accept-Language when the config carries a locale', () => {
    getConfig.mockReturnValue({ baseUrl: 'http://am', token: 'T', locale: 'fr' });
    igrpGetAccessClient();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ headers: { Authorization: 'Bearer T', 'Accept-Language': 'fr' } }),
    );
  });

  it('sends only Authorization without a locale', () => {
    getConfig.mockReturnValue({ baseUrl: 'http://am', token: 'T' });
    igrpGetAccessClient();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ headers: { Authorization: 'Bearer T' } }));
  });
});
```

- [x] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib/__tests__/api-client-locale.test.ts`
Expected: FAIL on the first case.

- [x] **Step 3: Implement**

`api-config.ts`:

```ts
export type IGRPClientRuntimeConfig = {
  token: string;
  baseUrl: string;
  timeout?: number;
  /** Sent as `Accept-Language` so the API translates its problem details. Base locale (`pt`, `en`, `fr`). */
  locale?: string;
};
```

`api-client.ts`:

```ts
export function igrpGetAccessClient(): AccessManagementClient {
  const { baseUrl, token, timeout, locale } = igrpGetAccessClientConfig();
  if (!baseUrl || !token) {
    throw new Error(
      'Access Management client is not configured. Call igrpSetAccessClientConfig() first.',
    );
  }
  return AccessManagementClient.create({
    baseUrl,
    timeout: timeout ?? 10_000,
    headers: { Authorization: `Bearer ${token}`, ...(locale ? { 'Accept-Language': locale } : {}) },
  });
}
```

If `igrpSetAccessClientConfig` copies fields explicitly rather than spreading, add `locale` to that copy; the existing `api-config.test.ts` tells you which.

- [x] **Step 4: Run and commit**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/lib`
Expected: PASS.

```bash
git add packages/framework/next/src/lib/api-config.ts packages/framework/next/src/lib/api-client.ts packages/framework/next/src/lib/__tests__/api-client-locale.test.ts
git commit -m "feat(next): optional locale on the access-client config, sent as Accept-Language"
```

---

### Task 8: Layouts mount the provider and seed the locale

**Files:**
- Modify: `packages/framework/next/src/layouts/igrp-root-layout.tsx`
- Modify: `packages/framework/next/src/layouts/igrp-layout-full.tsx`
- Modify: `packages/framework/next/src/layouts/igrp-layout-blank.tsx`
- Modify: `packages/framework/next/src/layouts/providers/header-data-provider.tsx`
- Modify: `packages/framework/next/src/layouts/providers/sidebar-data-provider.tsx`
- Modify: `packages/framework/next/src/index.ts` (no new root exports; the i18n API lives on subpaths)
- Create: `packages/framework/next/src/layouts/__tests__/igrp-root-layout-i18n.test.tsx`
- Modify: `packages/framework/next/src/layouts/__tests__/igrp-layout-full.test.tsx` (one new case)

**Interfaces:**
- Consumes: `config.i18n` (typed `IGRPI18nConfigBase`, narrowed to `IGRPI18nConfig` at the call site), `igrpResolveLocale`, `igrpGetDesignSystemStrings`, `igrpGetChromeStrings`, `IGRPIntlProvider`.

- [x] **Step 1: Write the failing tests**

`packages/framework/next/src/layouts/__tests__/igrp-root-layout-i18n.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('next-intl/server', () => ({ getMessages: vi.fn(async () => ({ app: { hi: 'Salut' } })) }));
vi.mock('../../lib/startup-sync.js', () => ({ igrpStartupSync: vi.fn() }));
vi.mock('../../lib/sync-plan.js', () => ({ planAccessManagementSync: () => null }));
const Nested = (p: unknown) => ({ __marker: 'nested', p });
vi.mock('@igrp/framework-next-ui', () => ({ IGRPNestedProviders: Nested, IGRP_CHROME_STRINGS_PT: {}, IGRP_CHROME_STRINGS_EN: {}, IGRP_CHROME_STRINGS_FR: {} }));
const Intl = (p: unknown) => ({ __marker: 'intl', p });
vi.mock('../../i18n/client/index.js', () => ({ IGRPIntlProvider: Intl }));
const resolveLocale = vi.fn(async () => 'fr');
vi.mock('../../i18n/server/resolve.js', () => ({ igrpResolveLocale: resolveLocale }));
vi.mock('../../i18n/server/strings.js', () => ({
  igrpGetDesignSystemStrings: () => ({ ds: true }),
  igrpGetChromeStrings: () => ({ chrome: true }),
}));

const { IGRPRootLayout } = await import('../igrp-root-layout.js');
const { igrpDefineI18n } = await import('../../i18n/config.js');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function find(node: any, type: unknown): any {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) return node.map((n) => find(n, type)).find(Boolean) ?? null;
  if (node.type === type) return node;
  return node.props ? find(node.props.children ?? null, type) : null;
}

const base = () =>
  ({
    previewMode: true,
    syncAccess: false,
    appCode: 'X',
    appInformation: { name: 'x' },
    layout: { session: null },
    toasterConfig: { showToaster: false },
    layoutData: { getHeaderData: async () => ({}), getSidebarData: async () => ({}) },
  }) as never;

beforeEach(() => resolveLocale.mockClear());

describe('IGRPRootLayout i18n', () => {
  it('without config.i18n keeps lang="pt" and mounts no intl provider', async () => {
    const tree = await IGRPRootLayout({ config: base(), children: 'kids' });
    expect(tree.props.lang).toBe('pt');
    expect(find(tree, Intl)).toBeNull();
    expect(resolveLocale).not.toHaveBeenCalled();
  });

  it('with config.i18n sets <html lang> to the format locale and mounts IGRPIntlProvider inside the nested providers', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt', formatLocales: { fr: 'fr-CA' } });
    const tree = await IGRPRootLayout({ config: { ...base(), i18n }, children: 'kids' });
    expect(tree.props.lang).toBe('fr-CA');
    const nested = find(tree, Nested);
    const intl = find(nested, Intl);
    expect(intl.props).toMatchObject({
      locale: 'fr',
      formatLocale: 'fr-CA',
      locales: ['pt', 'en', 'fr'],
      messages: { app: { hi: 'Salut' } },
      designSystemStrings: { ds: true },
      chromeStrings: { chrome: true },
      children: 'kids',
    });
  });

  it('an explicit lang prop still wins', async () => {
    const i18n = igrpDefineI18n({ defaultLocale: 'pt' });
    const tree = await IGRPRootLayout({ config: { ...base(), i18n }, children: null, lang: 'pt-PT' });
    expect(tree.props.lang).toBe('pt-PT');
  });
});
```

Add to `igrp-layout-full.test.tsx` (it already mocks `api-config.js`; add `vi.mock('../../i18n/server/resolve.js', () => ({ igrpResolveLocale: async () => 'en' }))` next to its other mocks):

```tsx
  it('seeds the access-client config with the resolved locale when config.i18n is set', async () => {
    const i18n = { defaultLocale: 'pt', locales: ['pt', 'en'], formatLocales: {}, resolution: 'cookie-first' };
    await IGRPLayoutFull({ config: config({ i18n }), children: null });
    expect(setConfig).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }));
    const header = findElement(/* the rendered tree as the other cases do */ undefined, HeaderDataProvider);
    void header;
  });
```

Keep the assertion on `setConfig`; mirror the file's existing way of obtaining the rendered tree for the `HeaderDataProvider` `locale` prop assertion (`expect(header.props.locale).toBe('en')`).

- [x] **Step 2: Run them to see them fail**

Run: `pnpm --filter @igrp/framework-next exec vitest run src/layouts`
Expected: FAIL on the i18n cases.

- [x] **Step 3: Implement the root layout**

`packages/framework/next/src/layouts/igrp-root-layout.tsx`: add imports

```ts
import { getMessages } from 'next-intl/server';

import { IGRPIntlProvider } from '../i18n/client/index.js';
import type { IGRPI18nConfig } from '../i18n/config.js';
import { igrpResolveLocale } from '../i18n/server/resolve.js';
import { igrpGetChromeStrings, igrpGetDesignSystemStrings } from '../i18n/server/strings.js';
```

Change the signature to `{ children, config, lang }: IGRPRootLayoutArgs` (no default) and the JSDoc of `lang` to: "BCP-47 language of the document (`<html lang>`). Defaults to the i18n format locale when `config.i18n` is set, else `"pt"`." After the `syncPlan` block add:

```ts
  // i18n: resolve once, load the merged messages (next-intl request config,
  // registered by the app's createNextIntlPlugin) and the two framework
  // catalogs, then mount the client provider below the session/theme providers.
  const i18n = config.i18n as IGRPI18nConfig | undefined;
  const intl = i18n
    ? await (async () => {
        const locale = await igrpResolveLocale(i18n);
        return {
          locale,
          formatLocale: i18n.formatLocales[locale],
          locales: i18n.locales,
          timeZone: i18n.timeZone,
          messages: await getMessages(),
          designSystemStrings: igrpGetDesignSystemStrings(i18n, locale),
          chromeStrings: igrpGetChromeStrings(i18n, locale),
        };
      })()
    : undefined;
  const htmlLang = lang ?? intl?.formatLocale ?? 'pt';
```

and render:

```tsx
    <html lang={htmlLang} suppressHydrationWarning className={font}>
      <body className={bodyClassName}>
        <IGRPNestedProviders session={session} activeThemeValue={activeThemeValue} sessionArgs={sessionArgs}>
          {intl ? <IGRPIntlProvider {...intl}>{children}</IGRPIntlProvider> : children}
        </IGRPNestedProviders>
      </body>
    </html>
```

- [x] **Step 4: Seed the locale in the full and blank layouts and the providers**

`igrp-layout-full.tsx`: import `igrpResolveLocale` and `IGRPI18nConfig` as above; after `const accessTimeout = ...`:

```ts
  // Base locale for `Accept-Language` on framework API calls (menus, user).
  const locale = config.i18n ? await igrpResolveLocale(config.i18n as IGRPI18nConfig) : undefined;
```

include `...(locale ? { locale } : {})` in the `igrpSetAccessClientConfig({...})` call and pass `locale={locale}` to both `SidebarDataProvider` and `HeaderDataProvider`.

`igrp-layout-blank.tsx`: same resolution; call `igrpSetAccessClientConfig` only if the file already does (it does not today: leave it, the blank layout has no framework fetches). Only the root layout mounts the provider, so no change is needed here beyond nothing. Record that in a one-line comment.

`header-data-provider.tsx` and `sidebar-data-provider.tsx`: add `locale?: string;` to the props type (JSDoc: "Base locale for `Accept-Language`; see igrp-layout-full.tsx.") and spread `...(locale ? { locale } : {})` into their `igrpSetAccessClientConfig` calls.

- [x] **Step 5: Run the layout tests and the whole package**

Run: `pnpm --filter @igrp/framework-next format && pnpm --filter @igrp/framework-next typecheck && pnpm --filter @igrp/framework-next test && pnpm --filter @igrp/framework-next build`
Expected: all exit 0; `check:dist` passes (every relative import carries `.js`).

- [x] **Step 6: Commit**

```bash
git add packages/framework/next/src/layouts
git commit -m "feat(next): IGRPRootLayout mounts IGRPIntlProvider and sets <html lang>; layouts seed Accept-Language"
```

---

### Task 9: `@igrp/framework-next-i18n` package with `check-catalogs` and `check-literals`

**Files:**
- Create: `packages/framework/i18n-tools/package.json`, `tsconfig.json`, `tsconfig.build.json`, `tsup.config.ts`, `vitest.config.ts`, `README.md`
- Create: `packages/framework/i18n-tools/src/catalogs.ts`, `src/literals.ts`, `src/cli.ts`, `src/index.ts`
- Create: `packages/framework/i18n-tools/src/__tests__/catalogs.test.ts`, `src/__tests__/literals.test.ts`
- Modify: `package.json` (root): `build:i18n-tools`, append to `build:framework`

**Interfaces:**
- Produces: bin `igrp-i18n check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors]` and `igrp-i18n check-literals <path...>`; library `checkCatalogs(options): CatalogReport`, `checkLiterals(paths): string[]`.

- [x] **Step 1: Scaffold the package**

`packages/framework/i18n-tools/package.json`:

```json
{
  "name": "@igrp/framework-next-i18n",
  "version": "0.2.0-beta.0",
  "description": "Catalog and literal-string checks for IGRP Next.js apps (igrp-i18n CLI)",
  "author": "IGRP Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+http://git.nosi.cv/igrp-3_0/igrp-framework-frontend/igrp-framework-nextjs.git",
    "directory": "packages/framework/i18n-tools"
  },
  "type": "module",
  "bin": { "igrp-i18n": "dist/cli.js" },
  "main": "dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "scripts": {
    "build:js": "tsup",
    "build:types": "tsc -p tsconfig.build.json --emitDeclarationOnly",
    "build": "rimraf dist && pnpm build:js && pnpm build:types",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "format": "prettier --write .",
    "release": "pnpm typecheck && pnpm test && pnpm build && pnpm publish --registry=https://sonatype.nosi.cv/repository/igrp/ --tag latest --no-git-checks",
    "clean": "rimraf dist",
    "clean-all": "rimraf node_modules && rimraf dist"
  },
  "dependencies": {
    "@formatjs/icu-messageformat-parser": "3.5.21",
    "typescript": "~6.0.3"
  },
  "devDependencies": {
    "@types/node": "^24",
    "prettier": "^3.9.9",
    "rimraf": "^6.1.3",
    "tsup": "^8.5.1",
    "vitest": "^5.0.1"
  },
  "engines": { "node": ">=22" },
  "publishConfig": { "registry": "https://sonatype.nosi.cv/repository/igrp/", "tag": "latest", "access": "public" }
}
```

`tsconfig.json`, `tsconfig.build.json` and `tsup.config.ts`: copy from `packages/framework/template-migrator/` verbatim (same shape: ES2022, bundler resolution, `types: ["node"]`; build excludes `src/**/__tests__/**`; tsup entries `{ cli: 'src/cli.ts' }` and `{ index: 'src/index.ts' }`, esm, no shims, no sourcemap). `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['src/**/__tests__/**/*.test.ts'], passWithNoTests: false } });
```

`src/cli.ts` starts with `#!/usr/bin/env node` on line 1.

Root `package.json`: add `"build:i18n-tools": "pnpm --filter @igrp/framework-next-i18n build"` and change `build:framework` to `"pnpm build:auth && pnpm build:next-types && pnpm build:ds && pnpm build:next-ui && pnpm build:next && pnpm build:i18n-tools"`. Run `pnpm install` so the workspace links the new package.

- [x] **Step 2: Write the failing tests**

`src/__tests__/catalogs.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkCatalogs } from '../catalogs.js';

function dir(files: Record<string, unknown>): string {
  const d = mkdtempSync(join(tmpdir(), 'igrp-i18n-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(d, name), JSON.stringify(content));
  return d;
}

describe('checkCatalogs', () => {
  it('passes a consistent set and reports coverage', () => {
    const report = checkCatalogs({
      dir: dir({
        'pt.json': { users: { title: 'Olá {name}', count: '{n, plural, one {# item} other {# itens}}' } },
        'en.json': { users: { title: 'Hi {name}' } },
      }),
      defaultLocale: 'pt',
    });
    expect(report.errors).toEqual([]);
    expect(report.coverage).toEqual({ pt: 100, en: 50 });
  });

  it('fails on orphan keys, non-string values, invalid ICU, argument mismatch and bad key names', () => {
    const report = checkCatalogs({
      dir: dir({
        'pt.json': { users: { title: 'Olá {name}', Bad_Key: 'x', broken: '{name' } },
        'fr.json': { users: { title: 'Salut {prenom}', extra: 'orphan', nested: { v: 1 } } },
      }),
      defaultLocale: 'pt',
    });
    const text = report.errors.join('\n');
    expect(text).toMatch(/fr: orphan key "users.extra"/);
    expect(text).toMatch(/fr: "users.nested.v" is not a string/);
    expect(text).toMatch(/pt: invalid ICU in "users.broken"/);
    expect(text).toMatch(/fr: arguments of "users.title" differ from pt/);
    expect(text).toMatch(/pt: key segment "Bad_Key" is not camelCase/);
  });

  it('lists keys under framework namespaces as info, not errors', () => {
    const report = checkCatalogs({
      dir: dir({ 'pt.json': { common: { actions: { retry: 'Repetir' } }, app: { x: 'y' } } }),
      defaultLocale: 'pt',
      frameworkNamespaces: ['common', 'i18n', 'errors'],
    });
    expect(report.errors).toEqual([]);
    expect(report.info).toEqual(['pt: "common.actions.retry" shadows a framework namespace']);
  });

  it('fails when the default catalog is missing', () => {
    const report = checkCatalogs({ dir: dir({ 'en.json': {} }), defaultLocale: 'pt' });
    expect(report.errors[0]).toMatch(/default catalog pt.json not found/);
  });
});
```

`src/__tests__/literals.test.ts`:

```ts
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { checkLiterals, findLiteralStrings } from '../literals.js';

describe('findLiteralStrings', () => {
  it('flags JSX text, literal children and user-facing props', () => {
    const src = `
      export function X() {
        return (
          <div>
            <p>Olá</p>
            <span>{"Olá"}</span>
            <input placeholder="Nome" aria-label="Campo" />
            <Comp description="Desc" helperText={\`Ajuda\`} />
          </div>
        );
      }`;
    expect(findLiteralStrings(src)).toHaveLength(6);
  });

  it('accepts text without letters, translated values and non-user-facing props', () => {
    const src = `
      export function X({ t }) {
        return (
          <div className="p-2" data-x="y">
            <span>—</span>
            <span>{"→"}</span>
            <p>{t("title")}</p>
            <input placeholder={t("ph")} />
            <b>42</b>
          </div>
        );
      }`;
    expect(findLiteralStrings(src)).toEqual([]);
  });

  it('flags next-intl formatter imports (format through the framework helpers)', () => {
    expect(findLiteralStrings(`import { useFormatter } from "next-intl";`)).toEqual([
      '1: import of useFormatter from next-intl (use useIGRPFormat / igrpFormatDate)',
    ]);
    expect(findLiteralStrings(`import { getFormatter } from "next-intl/server";`)).toHaveLength(1);
    expect(findLiteralStrings(`import { useTranslations } from "next-intl";`)).toEqual([]);
  });
});

describe('checkLiterals', () => {
  it('walks folders, skips tests, and prefixes findings with the file', () => {
    const d = mkdtempSync(join(tmpdir(), 'igrp-i18n-lit-'));
    writeFileSync(join(d, 'a.tsx'), `export const A = () => <p>Olá</p>;`);
    writeFileSync(join(d, 'a.test.tsx'), `export const T = () => <p>Olá</p>;`);
    writeFileSync(join(d, 'b.ts'), `export const b = "Olá";`);
    const findings = checkLiterals([d]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatch(/a\.tsx:1: JSX text "Olá"/);
  });
});
```

- [x] **Step 3: Run them to see them fail**

Run: `pnpm --filter @igrp/framework-next-i18n exec vitest run`
Expected: FAIL, modules not found.

- [x] **Step 4: Implement `catalogs.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { type MessageFormatElement, parse, TYPE } from '@formatjs/icu-messageformat-parser';

export interface CheckCatalogsOptions {
  /** Folder holding `<locale>.json` files. */
  dir: string;
  /** The complete catalog every other file is checked against. */
  defaultLocale: string;
  /** Top-level namespaces the framework ships; keys under them are reported as info. */
  frameworkNamespaces?: string[];
}

export interface CatalogReport {
  errors: string[];
  info: string[];
  /** Percentage of default-catalog keys present per locale. */
  coverage: Record<string, number>;
}

type Tree = { [key: string]: unknown };
const CAMEL = /^[a-z][a-zA-Z0-9]*$/;

function flatten(tree: Tree, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Tree, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

/** Names and kinds of every ICU argument and tag, sorted; `undefined` when the message does not parse. */
function icuArguments(message: string): string[] | undefined {
  const names = new Set<string>();
  const visit = (elements: MessageFormatElement[]) => {
    for (const el of elements) {
      switch (el.type) {
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          names.add(`${el.value}:${TYPE[el.type]}`);
          break;
        case TYPE.select:
        case TYPE.plural:
          names.add(`${el.value}:${TYPE[el.type]}`);
          for (const option of Object.values(el.options)) visit(option.value);
          break;
        case TYPE.tag:
          names.add(`<${el.value}>`);
          visit(el.children);
          break;
        default:
          break;
      }
    }
  };
  try {
    visit(parse(message));
  } catch {
    return undefined;
  }
  return [...names].sort();
}

export function checkCatalogs(options: CheckCatalogsOptions): CatalogReport {
  const errors: string[] = [];
  const info: string[] = [];
  const coverage: Record<string, number> = {};
  const frameworkNamespaces = new Set(options.frameworkNamespaces ?? []);

  const defaultFile = join(options.dir, `${options.defaultLocale}.json`);
  if (!existsSync(defaultFile)) {
    return { errors: [`default catalog ${options.defaultLocale}.json not found in ${options.dir}`], info, coverage };
  }
  const files = readdirSync(options.dir).filter((f) => f.endsWith('.json'));
  const catalogs = new Map<string, Map<string, unknown>>();
  for (const file of files) {
    const locale = basename(file, '.json');
    catalogs.set(locale, flatten(JSON.parse(readFileSync(join(options.dir, file), 'utf8')) as Tree));
  }
  const base = catalogs.get(options.defaultLocale)!;
  const baseArgs = new Map<string, string[] | undefined>();

  for (const [locale, flat] of catalogs) {
    for (const [key, value] of flat) {
      if (locale !== options.defaultLocale && !base.has(key)) errors.push(`${locale}: orphan key "${key}" (missing from ${options.defaultLocale})`);
      if (typeof value !== 'string') {
        errors.push(`${locale}: "${key}" is not a string`);
        continue;
      }
      for (const segment of key.split('.')) {
        if (!CAMEL.test(segment)) errors.push(`${locale}: key segment "${segment}" is not camelCase (in "${key}")`);
      }
      const args = icuArguments(value);
      if (!args) {
        errors.push(`${locale}: invalid ICU in "${key}"`);
        continue;
      }
      if (locale === options.defaultLocale) {
        baseArgs.set(key, args);
        if (frameworkNamespaces.has(key.split('.')[0]!)) info.push(`${locale}: "${key}" shadows a framework namespace`);
      } else if (base.has(key)) {
        const expected = baseArgs.get(key) ?? icuArguments(String(base.get(key)));
        if (expected && JSON.stringify(expected) !== JSON.stringify(args)) {
          errors.push(`${locale}: arguments of "${key}" differ from ${options.defaultLocale} (${expected.join(', ')} vs ${args.join(', ')})`);
        }
      }
    }
    const present = [...base.keys()].filter((k) => flat.has(k)).length;
    coverage[locale] = base.size === 0 ? 100 : Math.round((present / base.size) * 100);
  }
  return { errors, info, coverage };
}
```

Note the camelCase rule is applied per segment of the default locale's keys too; `errors.status.401` style numeric segments fail it. If the framework's `errors.status` namespace (digit keys) is ever placed in an app JSON, rename to `s401`; the framework catalogs are TypeScript objects and are not checked by this tool.

- [x] **Step 5: Implement `literals.ts`**

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const USER_FACING_PROPS = new Set([
  'placeholder', 'title', 'label', 'aria-label', 'aria-description', 'description', 'alt',
  'helperText', 'errorText', 'searchText', 'selectLabel',
]);
const HAS_LETTER = /\p{L}/u;
const FORMATTER_IMPORTS = new Set(['useFormatter', 'getFormatter']);

function literalText(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(' ');
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression);
  return undefined;
}

/** `line: finding` for every hardcoded user-facing string or formatter import in `source`. */
export function findLiteralStrings(source: string, fileName = 'x.tsx'): string[] {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: string[] = [];
  const line = (node: ts.Node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const report = (node: ts.Node, what: string) => findings.push(`${line(node)}: ${what}`);

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && /^next-intl(\/server)?$/.test(node.moduleSpecifier.text)) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          const name = (el.propertyName ?? el.name).text;
          if (FORMATTER_IMPORTS.has(name)) report(node, `import of ${name} from next-intl (use useIGRPFormat / igrpFormatDate)`);
        }
      }
    }
    if (ts.isJsxText(node)) {
      const text = node.getText(sf).trim();
      if (HAS_LETTER.test(text)) report(node, `JSX text "${text}"`);
    }
    if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const text = literalText(node.expression);
      if (text !== undefined && HAS_LETTER.test(text)) report(node, `literal child "${text}"`);
    }
    if (ts.isJsxAttribute(node) && USER_FACING_PROPS.has(node.name.getText(sf))) {
      const init = node.initializer;
      const text = init && ts.isJsxExpression(init) ? literalText(init.expression) : literalText(init);
      if (text !== undefined && HAS_LETTER.test(text)) report(node, `literal prop ${node.name.getText(sf)}="${text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return findings;
}

function listTsxFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile()) return path.endsWith('.tsx') && !/\.test\.tsx$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((name) => listTsxFiles(join(path, name)));
}

/** Findings as `relative/path.tsx:line: what`, for every non-test `.tsx` under `paths`. */
export function checkLiterals(paths: string[], cwd = process.cwd()): string[] {
  return paths.flatMap((p) =>
    listTsxFiles(p).flatMap((file) =>
      findLiteralStrings(readFileSync(file, 'utf8'), file).map((f) => `${relative(cwd, file).replaceAll('\\', '/')}:${f}`),
    ),
  );
}
```

- [x] **Step 6: Implement `cli.ts` and `index.ts`**

`src/index.ts`:

```ts
export { checkCatalogs, type CatalogReport, type CheckCatalogsOptions } from './catalogs.js';
export { checkLiterals, findLiteralStrings } from './literals.js';
```

`src/cli.ts`:

```ts
#!/usr/bin/env node
import { checkCatalogs } from './catalogs.js';
import { checkLiterals } from './literals.js';

const USAGE = `igrp-i18n <command>

  check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors]
      Orphan keys, non-string values, invalid ICU, argument mismatches, camelCase segments.
  check-literals <path...>
      Hardcoded user-facing strings in non-test .tsx files; next-intl formatter imports.
`;

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(argv: string[]): number {
  const [command, ...rest] = argv;
  if (command === 'check-catalogs') {
    const dir = rest.find((a) => !a.startsWith('--'));
    const defaultLocale = option(rest, '--default');
    if (!dir || !defaultLocale) {
      console.error(USAGE);
      return 2;
    }
    const namespaces = option(rest, '--framework-namespaces') ?? 'common,i18n,errors';
    const report = checkCatalogs({ dir, defaultLocale, frameworkNamespaces: namespaces.split(',').filter(Boolean) });
    for (const line of report.info) console.log(`info  ${line}`);
    console.log(`coverage ${Object.entries(report.coverage).map(([l, c]) => `${l}: ${c}%`).join(', ')}`);
    for (const line of report.errors) console.error(`error ${line}`);
    return report.errors.length ? 1 : 0;
  }
  if (command === 'check-literals') {
    const paths = rest.filter((a) => !a.startsWith('--'));
    if (paths.length === 0) {
      console.error(USAGE);
      return 2;
    }
    const findings = checkLiterals(paths);
    for (const line of findings) console.error(`error ${line}`);
    console.log(findings.length ? `${findings.length} hardcoded string(s)` : 'no hardcoded strings');
    return findings.length ? 1 : 0;
  }
  console.error(USAGE);
  return 2;
}

process.exit(main(process.argv.slice(2)));
```

`README.md`: the `USAGE` block above plus one paragraph: "Run from an app as `pnpm igrp-i18n check-catalogs src/i18n/messages --default pt && pnpm igrp-i18n check-literals src/components`; add folders as they are migrated. Framework catalogs are TypeScript modules in `@igrp/framework-next/i18n/messages` and are not checked here."

- [x] **Step 7: Run the tests, typecheck, build, and smoke the bin**

Run: `pnpm --filter @igrp/framework-next-i18n test && pnpm --filter @igrp/framework-next-i18n typecheck && pnpm --filter @igrp/framework-next-i18n build && node packages/framework/i18n-tools/dist/cli.js`
Expected: tests PASS; the bare invocation prints the usage and exits 2.

- [x] **Step 8: Commit**

```bash
git add packages/framework/i18n-tools package.json pnpm-lock.yaml
git commit -m "feat(i18n-tools): igrp-i18n CLI with check-catalogs and check-literals"
```

---

### Task 10: Changesets, full build

**Files:**
- Create: `.changeset/framework-next-i18n.md`
- Create: `.changeset/i18n-tools-initial.md`

- [x] **Step 1: Changesets**

`.changeset/framework-next-i18n.md`:

```md
---
'@igrp/framework-next': patch
---

i18n runtime as subpath entries: `./i18n` (Edge-safe config, `igrpDefineI18n`, `igrpPickLocale`, `igrpSyncLocaleCookie`, format helpers), `./i18n/server` (`igrpResolveLocale`, `igrpCreateRequestConfig`, `igrpSetLocale`, catalog selection), `./i18n/client` (`IGRPIntlProvider`, `IGRPLocaleSwitcher`, `useIGRPFormat`, `useIGRPLocaleInfo`), `./i18n/messages` (generic `common`, `i18n`, `errors` namespaces and the layered merge) and `./i18n/testing` (`IGRPIntlTestProvider`). `igrpBuildConfig({ i18n })` makes `IGRPRootLayout` resolve the locale, mount the providers and set `<html lang>` to the format locale; `IGRPLayoutFull` seeds `Accept-Language` on framework API calls. Apps without `i18n` are unchanged. New dependencies: `next-intl`, the design system (already transitive).
```

`.changeset/i18n-tools-initial.md`:

```md
---
'@igrp/framework-next-i18n': patch
---

New dev-only package: the `igrp-i18n` CLI with `check-catalogs` (orphan keys, invalid ICU, argument parity, camelCase segments, coverage, framework-namespace shadowing as info) and `check-literals` (hardcoded user-facing strings in `.tsx`, next-intl formatter imports).
```

If `pnpm changeset version` later complains that `@igrp/framework-next-i18n` is unknown to the pre-release, add `"@igrp/framework-next-i18n": "0.2.0-beta.0"` to `initialVersions` in `.changeset/pre.json`.

- [x] **Step 2: Build everything and type-check the template**

Run: `pnpm build:framework && pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0.

- [x] **Step 3: Commit**

```bash
git add .changeset/framework-next-i18n.md .changeset/i18n-tools-initial.md
git commit -m "chore: changesets for the framework-next i18n runtime and i18n-tools"
```

---

## Self-review

- Spec coverage: `./i18n` exports (constants, native names, cookie, options, normalise, Accept-Language, format-locale parsing, `igrpDefineI18n` with validation and derived `resolution`, `igrpPickLocale`, `igrpSyncLocaleCookie`, format helpers); `./i18n/server` (resolve with React cache, format locale, request config with timeZone and handlers, `igrpSetLocale` persist-then-cookie, catalog selection with overrides); `./i18n/client` (provider mounting next-intl + DS + chrome, switcher hidden under two locales, `useIGRPFormat`, `useIGRPLocaleInfo`); `./i18n/messages` (three generic namespaces, layered merge, shadowing, dev-only warning); `./i18n/testing`; `igrpBuildConfig({ i18n })` through `IGRPConfigArgs.i18n` (Plan 1) and the layouts; `Accept-Language`; the CLI with both commands and the `useFormatter` rule; cookie-name parity. Covered.
- Type consistency: `IGRPSetLocaleResult` shape used by the switcher test and `igrpSetLocale`; `igrpMergeMessages(i18n, locale, appCatalogs)` used by request config and the test provider; `IGRPIntlProviderProps` fields match what the root layout passes; `igrpPickLocale(candidates, i18n)` used by resolve.
- Review Focus: 1 and 3 and 4 in Task 1's tests; 2 in Task 4; 5 in Task 9.
