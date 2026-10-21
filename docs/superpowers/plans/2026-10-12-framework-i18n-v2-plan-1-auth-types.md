# Framework i18n v2, Plan 1 of 5: `framework-next-auth` locale claim and `framework-next-types` config types

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the identity provider's `locale` claim onto the JWT and the session, accept `update({ locale })` from the client, and declare the i18n config type that `igrpBuildConfig` will accept.

**Architecture:** Two root packages of the dependency chain change. `framework-next-auth` maps `profile.locale` in the default provider, copies it to `token.locale` in the `jwt` callback (sign-in and `update` trigger) and exposes it as `session.user.locale`, all as raw strings. `framework-next-types` gains `IGRPI18nConfigBase` and `IGRPConfigArgs.i18n`. No behaviour changes for apps that do not use i18n.

**Tech Stack:** TypeScript 6, next-auth 4.24 (JWT sessions), Vitest 5, tsup (next-auth), tsc (next-types), ESLint + Prettier.

**Spec:** `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (sections "framework-next-auth", "Type placement", "Resolution (D-1)").

**Series:** Plan 1 (this) → Plan 2 design-system → Plan 3 next-ui → Plan 4 framework-next + i18n-tools → Plan 5 template + migration. Each plan leaves `pnpm build:framework` green.

## Global Constraints

- Changesets are always `patch` (pre-release `0.2.0-beta.*`); one per publishable package touched.
- No `Co-Authored-By` trailers in commits.
- Framework packages: ESLint + Prettier (`pnpm format` in each package before commit). Never Biome here.
- Relative imports inside `next-types` carry an explicit `.js` extension (`check:barrel` / `check:dist` enforce it). `next-auth` uses extensionless relative imports (tsup bundles).
- `next-auth/src/config.ts` top-level imports must stay Edge-safe; nothing added here imports `next-auth` or `next/headers` at module scope.
- The locale is stored raw (`string | undefined`). No normalisation, no validation beyond `typeof === 'string'`, in this package.
- Run `pnpm build:framework` from the repo root at the end; `templates/demo-v1` must still type-check.

## Review Focus

Inputs the spec implies but which only these tests pin:

1. A `locale` claim that is not a string (an IdP sending `null` or a number) must leave `token.locale` undefined, not crash sign-in. Test in Task 2.
2. `update({ locale })` with a non-string payload must not overwrite a valid `token.locale`. Test in Task 2.
3. `update()` with an unrelated payload (`{ name }`) must keep the existing `token.locale`. Test in Task 2.
4. A custom (non-OIDC-managed) provider must still get `locale` from `user.locale` on sign-in, because the mapping runs before the managed-token early return. Test in Task 2.
5. The session callback must not create `session.user.locale: undefined` when the token has none, so `JSON.stringify(session)` is unchanged for apps without i18n. Test in Task 2.

---

### Task 1: Types for the locale on JWT, Session and User

**Files:**
- Modify: `packages/framework/next-auth/src/jwt.ts`
- Modify: `packages/framework/next-auth/src/session.ts`
- Modify: `packages/framework/next-auth/src/types.ts`
- Modify: `packages/framework/next-auth/src/__tests__/types-augmentation.type-check.ts`

**Interfaces:**
- Produces: `JWT.locale?: string`, `Session.user.locale?: string`, next-auth `User.locale?: string` (augmentation). Plan 4's `getSessionLocale` reads `session.user.locale`.

- [x] **Step 1: Extend the type-check guard first (it is the failing "test")**

In `packages/framework/next-auth/src/__tests__/types-augmentation.type-check.ts`, add one field to each exported constant:

```ts
export const _session: {
  accessToken: string | undefined;
  idToken: string | undefined;
  expiresAt: number | undefined;
  forceLogout: boolean | undefined;
  userId: string | undefined;
  userName: string | null | undefined;
  /** OIDC `locale` claim, raw. Read by `@igrp/framework-next/i18n` resolution. */
  userLocale: string | undefined;
  authProviderId: string | undefined;
} = {
  accessToken: s.accessToken,
  idToken: s.idToken,
  expiresAt: s.expiresAt,
  forceLogout: s.forceLogout,
  userId: s.user?.id,
  userName: s.user?.name,
  userLocale: s.user?.locale,
  authProviderId: s.authProviderId,
};

export const _jwt: {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  idToken: string | undefined;
  expiresAt: number | undefined;
  forceLogout: boolean | undefined;
  userId: string | undefined;
  sub: string | undefined;
  authProviderId: string | undefined;
  /** OIDC `locale` claim, raw. */
  locale: string | undefined;
} = {
  accessToken: j.accessToken,
  refreshToken: j.refreshToken,
  idToken: j.idToken,
  expiresAt: j.expiresAt,
  forceLogout: j.forceLogout,
  userId: j.user?.id,
  sub: j.sub,
  authProviderId: j.authProviderId,
  locale: j.locale,
};
```

- [x] **Step 2: Run the type-check to see it fail**

Run: `pnpm --filter @igrp/framework-next-auth typecheck`
Expected: FAIL with `Property 'locale' does not exist on type ...` for both `s.user?.locale` and `j.locale`.

- [x] **Step 3: Add the fields to the exported interfaces**

`packages/framework/next-auth/src/jwt.ts`:

```ts
export interface JWT extends DefaultJWT {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  authProviderId?: SessionAuthProviderId;
  expiresAt?: number;
  // `(string & {})` keeps the literal visible in completions; a bare `| string`
  // collapses the union to `string` and loses it.
  error?: 'RefreshAccessTokenError' | (string & {});
  forceLogout?: boolean;
  user?: NextAuthUser;
  /**
   * The identity provider's OIDC `locale` claim, carried raw (`pt-CV`, `en`,
   * …). Seeded at sign-in from the provider profile, replaced by a client
   * `update({ locale })`. Normalisation and validation belong to
   * `@igrp/framework-next/i18n`, never here.
   */
  locale?: string;
}
```

`packages/framework/next-auth/src/session.ts`, inside `Session`:

```ts
  user?: {
    id?: string;
    /** The OIDC `locale` claim, raw. Mirrors `JWT.locale`. */
    locale?: string;
  } & DefaultSession['user'];
```

`packages/framework/next-auth/src/types.ts`: add `locale` to the three augmented shapes, and augment `User` so a provider `profile()` may return it:

```ts
declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    idToken?: string;
    authProviderId?: SessionAuthProviderId;
    error?: string;
    expiresAt?: number;
    forceLogout?: boolean;
    user?: {
      id?: string;
      locale?: string;
    } & DefaultSession['user'];
  }

  /** Lets a provider `profile()` mapper return the OIDC `locale` claim. */
  interface User {
    locale?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    authProviderId?: SessionAuthProviderId;
    expiresAt?: number;
    error?: 'RefreshAccessTokenError' | (string & {});
    forceLogout?: boolean;
    locale?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      locale?: string;
    } & NextAuthUser;
  }
}
```

Keep the existing JSDoc block above `declare module 'next-auth'` untouched.

- [x] **Step 4: Run the type-check to see it pass**

Run: `pnpm --filter @igrp/framework-next-auth typecheck`
Expected: exit 0.

- [x] **Step 5: Commit**

```bash
git add packages/framework/next-auth/src/jwt.ts packages/framework/next-auth/src/session.ts packages/framework/next-auth/src/types.ts packages/framework/next-auth/src/__tests__/types-augmentation.type-check.ts
git commit -m "feat(next-auth): declare the OIDC locale claim on JWT, Session and User"
```

---

### Task 2: Map the claim in the provider, the `jwt` callback and the `session` callback

**Files:**
- Modify: `packages/framework/next-auth/src/providers.ts` (the `profile()` mapper, around line 138)
- Modify: `packages/framework/next-auth/src/config.ts` (the `jwt` callback after the `if (account)` block, around line 1030; the `session` callback user block, around line 1155)
- Create: `packages/framework/next-auth/src/__tests__/locale-claim.test.ts`

**Interfaces:**
- Consumes: `JWT.locale`, `Session.user.locale` from Task 1.
- Produces: runtime behaviour: `token.locale` after sign-in and after `update({ locale })`; `session.user.locale` present only when the token has one.

- [x] **Step 1: Write the failing tests**

`packages/framework/next-auth/src/__tests__/locale-claim.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as oidcModule from '../oidc';

// Same isolation as config.test.ts: no network from the OIDC helpers.
vi.mock('../oidc', async (importOriginal) => {
  const original = await importOriginal<typeof oidcModule>();
  return {
    ...original,
    revokeOidcSession: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    introspectOidcToken: vi.fn().mockResolvedValue(true),
    refreshOidcAccessToken: vi
      .fn()
      .mockResolvedValue({ accessToken: 'refreshed-at', forceLogout: false }),
    getRecoveredToken: vi.fn().mockResolvedValue(null),
    configureOidcTokenRecoveryStore: vi.fn(),
  };
});

const VALID_ENV = {
  AUTH_PROVIDER: 'igrp-auth',
  IGRP_AUTH_CLIENT_ID: 'test-client',
  IGRP_AUTH_CLIENT_SECRET: 'test-secret',
  IGRP_AUTH_ISSUER: 'http://localhost:9090',
  NEXTAUTH_SECRET: 'test-secret-key',
};

/** A still-valid access token, so the managed-token path returns it unchanged. */
const ACCOUNT = {
  provider: 'igrp-auth',
  type: 'oauth',
  providerAccountId: 'u-1',
  access_token: 'at',
  refresh_token: 'rt',
  id_token: 'it',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

async function callbacks() {
  const { withIGRPAuth } = await import('../config');
  const instance = withIGRPAuth({ env: VALID_ENV });
  return instance.authOptions.callbacks!;
}

beforeEach(() => vi.clearAllMocks());

describe('default provider profile()', () => {
  it('maps a string locale claim and leaves a missing one undefined', async () => {
    const { createAuthProviderFromEnv } = await import('../providers');
    const provider = createAuthProviderFromEnv(VALID_ENV) as unknown as {
      profile: (p: Record<string, unknown>) => { locale?: string };
    };
    expect(provider.profile({ sub: '1', locale: 'pt-CV' }).locale).toBe('pt-CV');
    expect(provider.profile({ sub: '1' }).locale).toBeUndefined();
    expect(provider.profile({ sub: '1', locale: 42 }).locale).toBeUndefined();
  });
});

describe('jwt callback — locale', () => {
  it('seeds token.locale from user.locale at sign-in', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1', locale: 'fr' },
      profile: { sub: 'u-1', locale: 'fr' },
    } as never);
    expect(token.locale).toBe('fr');
  });

  it('falls back to the raw profile claim when user.locale is absent (custom mappers)', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1' },
      profile: { sub: 'u-1', locale: 'en-GB' },
    } as never);
    expect(token.locale).toBe('en-GB');
  });

  it('leaves token.locale undefined when the claim is missing or not a string', async () => {
    const { jwt } = await callbacks();
    const missing = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1' },
      profile: { sub: 'u-1' },
    } as never);
    expect(missing.locale).toBeUndefined();
    const wrongType = await jwt!({
      token: { sub: 'u-1' },
      account: ACCOUNT,
      user: { id: 'u-1', locale: null },
      profile: { sub: 'u-1', locale: 7 },
    } as never);
    expect(wrongType.locale).toBeUndefined();
  });

  it('seeds the locale for a provider the package does not manage', async () => {
    const { jwt } = await callbacks();
    const token = await jwt!({
      token: { sub: 'u-1' },
      account: { ...ACCOUNT, provider: 'github' },
      user: { id: 'u-1', locale: 'pt' },
      profile: { sub: 'u-1' },
    } as never);
    expect(token.locale).toBe('pt');
  });

  it('replaces token.locale on update({ locale }) and ignores non-string payloads', async () => {
    const { jwt } = await callbacks();
    const base = { sub: 'u-1', locale: 'pt', authProviderId: 'igrp-auth', accessToken: 'at', expiresAt: Date.now() + 3_600_000 };
    const updated = await jwt!({ token: base, trigger: 'update', session: { locale: 'en' } } as never);
    expect(updated.locale).toBe('en');
    const ignored = await jwt!({ token: base, trigger: 'update', session: { locale: 3 } } as never);
    expect(ignored.locale).toBe('pt');
    const unrelated = await jwt!({ token: base, trigger: 'update', session: { name: 'X' } } as never);
    expect(unrelated.locale).toBe('pt');
  });
});

describe('session callback — locale', () => {
  it('exposes token.locale as session.user.locale', async () => {
    const { session } = await callbacks();
    const result = (await session!({
      session: { user: { name: 'Ana' }, expires: '2099-01-01' },
      token: { sub: 'u-1', locale: 'fr' },
    } as never)) as { user?: { locale?: string; id?: string } };
    expect(result.user?.locale).toBe('fr');
    expect(result.user?.id).toBe('u-1');
  });

  it('adds no locale key when the token has none', async () => {
    const { session } = await callbacks();
    const result = (await session!({
      session: { user: { name: 'Ana' }, expires: '2099-01-01' },
      token: { sub: 'u-1' },
    } as never)) as { user?: Record<string, unknown> };
    expect(result.user).not.toHaveProperty('locale');
  });
});
```

- [x] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/locale-claim.test.ts`
Expected: FAIL. `profile().locale` is undefined for `'pt-CV'`; `token.locale` undefined after sign-in; `session.user.locale` undefined.

- [x] **Step 3: Map the claim in the provider**

In `packages/framework/next-auth/src/providers.ts`, inside the `profile(profile: OAuth2Profile)` return object (after `image:`):

```ts
          image: typeof profile.picture === 'string' ? profile.picture : null,
          // OIDC `locale` claim, carried raw. The i18n layer normalises it.
          locale: typeof profile.locale === 'string' ? profile.locale : undefined,
```

If `OAuth2Profile` does not declare `locale`, extend that type where it is defined in the same file: `locale?: unknown;`.

- [x] **Step 4: Seed and update the token in the `jwt` callback**

In `packages/framework/next-auth/src/config.ts`, directly after the closing brace of `if (account) { ... }` in the `jwt` callback and before the `withJwtExtension` declaration, insert:

```ts
        // Locale claim. Runs before the managed-token early return so a custom
        // provider's `profile()` mapper gets the same treatment. Raw string,
        // no validation: `@igrp/framework-next/i18n` normalises on read.
        if (account) {
          const userLocale = (params.user as { locale?: unknown } | undefined)?.locale;
          const profileLocale = (params.profile as { locale?: unknown } | undefined)?.locale;
          const claim = typeof userLocale === 'string' ? userLocale : profileLocale;
          if (typeof claim === 'string') igrpToken = { ...igrpToken, locale: claim };
        }
        if (params.trigger === 'update') {
          const requested = (params.session as { locale?: unknown } | undefined)?.locale;
          if (typeof requested === 'string') igrpToken = { ...igrpToken, locale: requested };
        }
```

- [x] **Step 5: Expose it in the `session` callback**

Replace the `tokenUserId` block in the `session` callback with:

```ts
          const tokenUserId = tokenTyped.user?.id ?? tokenTyped.sub;
          const tokenLocale = tokenTyped.locale;
          if (tokenUserId || tokenLocale) {
            igrpSession = {
              ...igrpSession,
              user: {
                ...igrpSession.user,
                ...(tokenUserId ? { id: tokenUserId } : {}),
                // Only when present: apps without i18n keep an identical
                // session shape (no `locale: undefined` key).
                ...(tokenLocale ? { locale: tokenLocale } : {}),
              },
            };
          }
```

Keep the explanatory comment that precedes the original block.

- [x] **Step 6: Run the tests to see them pass, then the whole package**

Run: `pnpm --filter @igrp/framework-next-auth exec vitest run src/__tests__/locale-claim.test.ts`
Expected: PASS (8 tests).

Run: `pnpm --filter @igrp/framework-next-auth format && pnpm --filter @igrp/framework-next-auth build && pnpm --filter @igrp/framework-next-auth typecheck && pnpm --filter @igrp/framework-next-auth test`
Expected: all exit 0. `dist-contract.test.ts` still passes (nothing new reaches the root barrel).

- [x] **Step 7: Commit**

```bash
git add packages/framework/next-auth/src/providers.ts packages/framework/next-auth/src/config.ts packages/framework/next-auth/src/__tests__/locale-claim.test.ts
git commit -m "feat(next-auth): carry the OIDC locale claim on the token and session, accept update({ locale })"
```

---

### Task 3: `IGRPI18nConfigBase` and `IGRPConfigArgs.i18n` in `framework-next-types`

**Files:**
- Create: `packages/framework/next-types/src/types/i18n.ts`
- Modify: `packages/framework/next-types/src/types/igrp.ts` (add `i18n?` to `IGRPConfigArgs`)
- Modify: `packages/framework/next-types/src/index.ts` (barrel)
- Modify: `packages/framework/next-types/README.md` (export table; `check:barrel` fails otherwise)
- Modify: `packages/framework/next-types/tsconfig.contract.json` consumers, if the contract test enumerates exports (read `scripts/check-barrel.mjs` output to see what it demands)

**Interfaces:**
- Produces: `IGRPLocale`, `IGRPLocaleResolution`, `IGRPI18nConfigBase`, `IGRPConfigArgs['i18n']`. Plan 4's `igrpDefineI18n` returns an `IGRPI18nConfig extends IGRPI18nConfigBase`.

- [x] **Step 1: Create the type module**

`packages/framework/next-types/src/types/i18n.ts`:

```ts
/**
 * i18n configuration as the framework config carries it.
 *
 * This package precedes the design system and `next-ui` in the dependency
 * order, so it cannot name their string catalogs. `overrides` is therefore
 * typed as `object` here; `@igrp/framework-next/i18n` declares
 * `IGRPI18nConfig extends IGRPI18nConfigBase` narrowing it to deep partials of
 * `IGRPI18nStrings` and `IGRPChromeStrings`. `igrpDefineI18n` returns the
 * narrow type, which is assignable to this base.
 */

/** Platform locales. Fixed: an app may enable fewer, never others. */
export type IGRPLocale = 'pt' | 'en' | 'fr';

/**
 * Which source wins when the browser holds a locale choice AND the session
 * carries one. `session-first` is only valid for apps that persist the choice
 * (a `persistLocale` is configured); see ADR 0001 and its amendment.
 */
export type IGRPLocaleResolution = 'cookie-first' | 'session-first';

export interface IGRPI18nConfigBase {
  /** The enabled locale used when nothing about the request names another. */
  readonly defaultLocale: IGRPLocale;
  /** Enabled locales, in switcher order. Always contains `defaultLocale`. */
  readonly locales: readonly IGRPLocale[];
  /** Region-qualified tag per locale, used for `Intl`, the design system and `<html lang>`. */
  readonly formatLocales: Readonly<Record<IGRPLocale, string>>;
  /** Forwarded to next-intl so server and client format dates in one zone. */
  readonly timeZone?: string;
  /** Derived from the presence of `persistLocale`. */
  readonly resolution: IGRPLocaleResolution;
  /** The signed-in user's locale (`session.user.locale`), raw; `undefined` when unknown. */
  readonly getSessionLocale?: () => Promise<string | null | undefined>;
  /** Persists an explicit choice for the signed-in user. Its presence selects `session-first`. */
  readonly persistLocale?: (locale: IGRPLocale) => Promise<void>;
  /** Per-locale overrides of the design-system and chrome catalogs. */
  readonly overrides?: Partial<Record<IGRPLocale, { designSystem?: object; chrome?: object }>>;
}
```

- [x] **Step 2: Add the field to `IGRPConfigArgs`**

In `packages/framework/next-types/src/types/igrp.ts`, add the import and the field (place the field after `sessionArgs?`):

```ts
import type { IGRPI18nConfigBase } from './i18n.js';
```

```ts
  sessionArgs?: Partial<SessionProviderProps>;
  /**
   * Localisation, built with `igrpDefineI18n` from `@igrp/framework-next/i18n`.
   * When set, `IGRPRootLayout` resolves the locale, mounts the intl providers
   * and sets `<html lang>`; `IGRPLayoutFull` / `IGRPLayoutBlank` send
   * `Accept-Language` on framework API calls. Apps without it change nothing.
   */
  i18n?: IGRPI18nConfigBase;
```

- [x] **Step 3: Export from the barrel and document**

In `packages/framework/next-types/src/index.ts`, after the `./types/igrp.js` export line:

```ts
export type { IGRPLocale, IGRPLocaleResolution, IGRPI18nConfigBase } from './types/i18n.js';
```

Add three rows to the README export table (same column layout as its neighbours):

```md
| `IGRPLocale` | Platform locale code: `pt`, `en` or `fr`. |
| `IGRPLocaleResolution` | `cookie-first` or `session-first`; see the i18n spec. |
| `IGRPI18nConfigBase` | i18n configuration carried on `IGRPConfigArgs.i18n`; built by `igrpDefineI18n`. |
```

- [x] **Step 4: Build and check**

Run: `pnpm --filter @igrp/framework-next-types build`
Expected: exit 0. `check:barrel`, `check:contract` and `check:dist` all pass. If `check:barrel` reports the README rows as missing, match its expected row format exactly (it prints the names it could not find).

- [x] **Step 5: Commit**

```bash
git add packages/framework/next-types/src/types/i18n.ts packages/framework/next-types/src/types/igrp.ts packages/framework/next-types/src/index.ts packages/framework/next-types/README.md
git commit -m "feat(next-types): declare IGRPI18nConfigBase and IGRPConfigArgs.i18n"
```

---

### Task 4: ADR amendment, changesets, downstream build

**Files:**
- Modify: `packages/framework/docs/adr/0001-cookie-first-locale-resolution.md`
- Create: `.changeset/i18n-locale-claim.md`

- [x] **Step 1: Amend the ADR**

Append to `packages/framework/docs/adr/0001-cookie-first-locale-resolution.md`:

```md

## Amendment (2026-10-12): session-first for apps that persist the choice

The rejection of "session locale first" above assumed no write-back endpoint. When an app configures `persistLocale` in `igrpDefineI18n`, `igrpSetLocale` writes the profile before the cookie and the client refreshes the token with `update({ locale })`, so both objections fall: the switcher can override the session, and the token never holds a stale value. Such an app resolves `session-first` (session → cookie → `Accept-Language` → default) and may call `igrpSyncLocaleCookie` from its middleware so pages rendered without a session follow the last signed-in user. The strategy is derived from the presence of `persistLocale`, never configured directly, so `session-first` without a write-back cannot be selected. Apps without `persistLocale` keep the cookie-first order above. Design: `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md`.
```

- [x] **Step 2: Write the changeset**

`.changeset/i18n-locale-claim.md`:

```md
---
'@igrp/framework-next-auth': patch
'@igrp/framework-next-types': patch
---

i18n groundwork: the default provider maps the OIDC `locale` claim, the `jwt` callback carries it as `token.locale` (seeded at sign-in, replaced by `update({ locale })`) and the `session` callback exposes `session.user.locale`. `framework-next-types` declares `IGRPI18nConfigBase` and the optional `IGRPConfigArgs.i18n`. No behaviour change for apps that do not use i18n.
```

- [x] **Step 3: Build the whole framework and type-check the template**

Run: `pnpm build:framework`
Expected: exit 0 in dependency order.

Run: `pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0 (the template only gains an optional field).

- [x] **Step 4: Commit**

```bash
git add packages/framework/docs/adr/0001-cookie-first-locale-resolution.md .changeset/i18n-locale-claim.md
git commit -m "docs(i18n): amend ADR 0001 with the session-first precondition; changeset for plan 1"
```

---

## Self-review

- Spec coverage: provider mapping, jwt seed, update trigger, session exposure, type augmentation, type-check guard, `IGRPI18nConfigBase`/`IGRPConfigArgs.i18n`, ADR amendment, patch changesets: all have a task. D-5 verification (whether the IdP emits the claim) is a Plan 5 task, since it needs a running environment.
- Type consistency: `locale?: string` on `JWT`, `Session.user`, augmented `User`, and `JWT.user`; `IGRPI18nConfigBase` field names match the spec's `igrpDefineI18n` options plus `resolution`.
- Review Focus items 1 to 5 each map to a named test in Task 2.
