# Design & Spec: User-Defined Login & Logout for IGRP-Studio Apps

| | |
|---|---|
| **Status** | Draft, revised 2026-11-04 against the current template and framework. Awaiting approval. |
| **Author** | Fidel da Luz |
| **Date** | 2026-06-22 (revised 2026-11-04) |
| **Scope** | `templates/demo-v1` only, plus a template-migrator migration. A framework extraction of the logout teardown is kept as an alternative for a separate decision (§6). |
| **Affects** | `@igrp/framework-next-template` consumers; igrp-studio generated apps |
| **Risk** | Low. The default login path is unchanged, unknown values fall back to it, and the teardown logic is not touched. |
| **Companion** | `specs/2026-06-22-custom-layout-design-spec.md` (same frame/canvas model, same env-switch pattern) |

---

## 0. What changed in this revision

Since the first draft, the login page has gained session-ended handling, silent SSO and next-intl texts, and the logout teardown gained host-logout and silent-SSO cookie writes. The draft's code would have removed all of that. This revision:

- Keeps the whole current server frame of `(auth)/login/page.tsx` and puts the `IGRP_AUTH_UI` switch **after** the silent-SSO branch (§4.1).
- Takes every visible string in the reference form from `src/i18n/messages`. `src/app/(auth)` and `src/components` are in `lint:i18n`'s `check-literals` scope, and `build` runs it, so the draft's pt-PT literals would have failed the build.
- Fixes the reference form's loading flag. The draft cleared it in `finally`, which un-spins the button mid-redirect and stops the React Compiler from compiling the component (see the comment in next-ui `auths/form.tsx`).
- **Changes the logout recommendation.** The teardown now involves five template-owned calls (`getLogoutUrl`, `markLogoutPending`, `clearLogoutPending`, `markHostLogout`, `markSilentSsoTried`) plus `reportError`, in three components, not two. A framework extraction would be a component with six callbacks wrapped around template logic. The recommendation is now a template-only loading component (§5); the extraction stays as a corrected alternative (§6).
- Adds the template-migrator migration every `templates/demo-v1` change needs (§9).

---

## 1. Executive summary

The `(auth)` route group ships a fixed login screen (`IGRPAuthCarousel` + `IGRPAuthForm`) and four auth-transition screens that each render `IGRPTemplateLoading` around client-side teardown or sign-in logic. An end user has no supported way to ship their own login design. Rebranding the transition screens today means editing files that hold fragile, security-relevant logic.

This proposal:

1. **Login (template-only).** An env switch in `(auth)/login/page.tsx` renders either the framework login (default) or a **template-owned `CustomAuthForm`** the end user can redesign. Every server step before the visual (bypass, deferred logout, session-ended, sanitize, provider, silent SSO) is shared by both branches.
2. **Transition screens (template-only).** The four teardown/sign-in components stop rendering `IGRPTemplateLoading` directly and render a template-owned **`AuthLoading`**. That file is the only one an end user edits to rebrand logout. The teardown files stay as they are.

**Key properties**
- **No framework-package changes** in the recommended design.
- **Teardown logic untouched.** No behaviour change to logout, silent SSO or session-ended handling.
- **Fail-safe.** Unset or unknown `IGRP_AUTH_UI` renders the framework login.

**Estimated effort:** ~0.5 day for login + loading component, plus ~0.5 day for the migration and message keys.

---

## 2. Background

### 2.1 Login today: `src/app/(auth)/login/page.tsx` (server)

The page is a server orchestrator. Steps 1–6 are auth-critical; only step 7 is visual.

| # | Step | Code | Why it matters |
|---|---|---|---|
| 1 | Bypass gate | `if (isAuthBypass()) redirect("/")` | No real provider under `IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none`. |
| 2 | Deferred logout | `cookieStore.has(LOGOUT_PENDING_COOKIE)` → `<LogoutCompletion/>` | Finishes a logout that left for the IdP. |
| 3 | Session ended | `reason === "session_ended"` → `<SessionEndedCompletion/>` | AM answered 401: clear this app's session, reload without `reason`. |
| 4 | Sanitize | `sanitizeCallbackUrl(callbackUrl) ?? silentSsoCallbackUrl(cookie) ?? "/"` | Open-redirect / login-loop guard; recovers the target after a failed silent attempt. |
| 5 | Provider | `getAuthProviderIdFromEnv(process.env)` | Drives `signIn`. |
| 6 | Silent SSO | `shouldAttemptSilentSso(…)` → `<SilentSignIn/>` | Still signed in at the IdP → straight in, no click. |
| 7 | Render | `IGRPLocaleSwitcher` + `IGRPAuthCarousel` + `IGRPAuthForm`, texts from `getTranslations("login")` | **Visual.** |

Facts that shape the design:
- The only auth call in `IGRPAuthForm` is `signIn(providerId, { callbackUrl })` from `@igrp/framework-next-auth/client`. A custom form repeats that one call.
- `IGRPAuthCarousel` has no auth role; it is decorative and optional.

### 2.2 Transition screens today

| File | Runs | Visual |
|---|---|---|
| `(auth)/logout/page.tsx` | End-session lookup (3 s race), `logout_pending` marker, `id_token_hint` POST to the IdP, or local `signOut` + `markHostLogout` fallback; 8 s watchdog; module-scoped double-start guard | `IGRPTemplateLoading text={t("signingOut")}` |
| `(auth)/login/logout-completion.tsx` | Deferred `signOut`, `markHostLogout`, `clearLogoutPending`, `markSilentSsoTried`, reload `/login` | same |
| `(auth)/login/session-ended-completion.tsx` | `signOut`, reload without `reason` | same |
| `(auth)/login/silent-sign-in.tsx` | `markSilentSsoTried`, `signIn` with `prompt=none` | `IGRPTemplateLoading` |

All four have the same visual: a spinner, a line of text and the app logo. The logic around it is the fragile part.

### 2.3 Problem

There is no switch for a custom login, and no way to rebrand the transition screens without editing the files that hold the teardown.

---

## 3. Goals & non-goals

### Goals
- A fully custom **login** screen (any layout, carousel optional), selected per app by one env variable.
- A rebrandable **transition screen** with no edits to teardown or sign-in logic.
- Default behaviour unchanged.
- Bypass, deferred logout, session-ended, silent SSO and `callbackUrl` sanitization preserved in every branch.

### Non-goals
- A credentials/password form. The IdP owns authentication; the app only starts `signIn`.
- A second UI library, or bypassing the design system.
- A runtime/per-request login picker.
- Changing the OIDC end-session contract, the `logout_pending` / host-logout / silent-SSO cookies, or the middleware backstop.

---

## 4. Part A: Login

### 4.1 Switch site

Steps 1–6 are unchanged. The switch replaces step 7 only:

```tsx
// src/app/(auth)/login/page.tsx  (excerpt; everything above is unchanged)
import { CustomAuthForm } from "@/components/custom-auth/custom-auth-form";

  // … steps 1–6 exactly as today, including the SilentSignIn early return …

  // Server-only env, read per request. Unset or unknown → the framework login.
  if (process.env.IGRP_AUTH_UI === "custom") {
    return <CustomAuthForm callbackUrl={safeCallbackUrl} providerId={providerId} />;
  }

  // … current default render (getTranslations, carousel, IGRPAuthForm) …
```

Putting the switch after step 6 means a user who is still signed in at the IdP never sees either form, the same as today. `CustomAuthForm` receives only serializable props.

### 4.2 The frame and the canvas

**Frame (non-negotiable):**
1. The page stays a server component; steps 1–6 stay above the switch.
2. `callbackUrl` is sanitized and `providerId` resolved server-side, then passed as props.
3. **Exactly one** element calls `signIn(providerId, { callbackUrl })` from `@igrp/framework-next-auth/client`, with those props. No hand-built URLs, no unsanitized `callbackUrl`, no reading `callbackUrl` from `window.location`.
4. User-visible text comes from `src/i18n/messages` (`useTranslations` in the client form).
5. Template UI rules: design system only (Horizon first), semantic tokens, `"use client"` on DS-importing files.

**Canvas (free):**
- The whole visual layout. A second panel, carousel or hero image is optional; the reference form works full-width alone.
- Logo, copy, background, split ratio, carousel side, or a single centred card.
- Reuse `IGRPAuthCarousel`, replace it or omit it.
- Keep or drop the `IGRPLocaleSwitcher` (the reference keeps it).

### 4.3 Reference form (client)

```tsx
// src/components/custom-auth/custom-auth-form.tsx   ← CLIENT (end-user editable)
"use client";

import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";
import { type AuthProviderId, signIn } from "@igrp/framework-next-auth/client";
import { IGRPTemplateModeSwitcher } from "@igrp/framework-next-ui";
import {
  Alert, AlertDescription, IGRPButton, IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { setLocale } from "@/i18n/actions";

type CustomAuthFormProps = {
  callbackUrl: string;        // sanitized by the server frame
  providerId: AuthProviderId; // resolved from env by the server frame
};

export function CustomAuthForm({ callbackUrl, providerId }: CustomAuthFormProps) {
  const t = useTranslations("login");
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit() {
    setIsLoading(true);
    setFailed(false);
    // On success signIn() never resolves: it navigates away. Reset the flag
    // only on failure. A `finally` would un-spin mid-redirect and keeps the
    // React Compiler from compiling this component.
    try {
      await signIn(providerId, { callbackUrl }); // ← the one required call
    } catch (error) {
      console.error("[custom-auth] signIn failed", error);
      setFailed(true);
      setIsLoading(false);
    }
  }

  // Everything below is free to redesign.
  return (
    <section className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex w-full max-w-sm justify-end gap-2">
        <IGRPLocaleSwitcher action={setLocale} />
        <IGRPTemplateModeSwitcher />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        {failed && (
          <Alert variant="destructive" aria-live="polite">
            <IGRPIcon iconName="AlertCircle" className="size-4" aria-hidden />
            <AlertDescription>{t("custom.signInError")}</AlertDescription>
          </Alert>
        )}

        <h1 className="text-center text-2xl font-semibold">{t("welcome")}</h1>
        <p className="text-muted-foreground text-center text-sm">{t("description")}</p>

        <IGRPButton onClick={onSubmit} loading={isLoading} iconName="ShieldCheck">
          {t("custom.signIn")}
        </IGRPButton>
      </div>
    </section>
  );
}
```

New message keys (`pt`, `en`, `fr`): `login.custom.signIn`, `login.custom.signInError`. `welcome` and `description` already exist. Before implementation, check `IGRPButton`'s `loading`/`iconName` props and `Alert`'s `variant` against the DS skill reference.

### 4.4 Optional hero / carousel

If the end user wants a second panel, they own it. A static hero is enough:

```tsx
// src/components/custom-auth/custom-auth-hero.tsx   ← CLIENT (optional, deletable)
"use client";

import Image from "next/image";

export function CustomAuthHero() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden md:block">
      <Image src="/placeholder-carousel.png" alt="" fill priority className="object-cover" />
    </div>
  );
}
```

Decorative only (`alt=""`). The reference form doesn't import it; the end user places it next to the form, or deletes it.

---

## 5. Part B: Transition screens (recommended, template-only)

### 5.1 One template-owned loading component

```tsx
// src/components/custom-auth/auth-loading.tsx   ← CLIENT (end-user editable)
"use client";

import { IGRPTemplateLoading } from "@igrp/framework-next-ui";

/**
 * The visual for every auth transition (logout, deferred-logout completion,
 * session-ended, silent sign-in). Redesign freely; it receives only text.
 * The logic lives in the files that render it — don't edit those.
 */
export function AuthLoading({ text }: { text: string }) {
  return <IGRPTemplateLoading text={text} appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE} />;
}
```

### 5.2 Changes to the four transition files

Each one replaces its `<IGRPTemplateLoading … />` with `<AuthLoading text={…} />`, passing the text it already resolves. **Nothing else in those files changes.** In `logout/page.tsx` the hidden `id_token_hint` form stays next to `AuthLoading`, as it is today next to `IGRPTemplateLoading`.

### 5.3 The frame and the canvas

- **Frame:** the four transition files. Each gets a one-line "do not edit; restyle `AuthLoading` instead" comment at the top (part of §9 row 5). A reviewer should treat any other diff to them as a teardown change.
- **Canvas:** `auth-loading.tsx`: spinner, splash, logo, copy. Text comes in as a prop, already translated. Any extra copy goes through `src/i18n/messages`.

### 5.4 Why not the framework extraction

Moving the teardown into next-ui (§6) would protect it from edits and let fixes ship as a package release. But every side effect it performs is template-owned: the cookies are read by edge middleware and server actions in the template. The framework component would be the sequencing alone, with all side effects injected, and the template would still own most of the logic. The behaviour gained doesn't justify a new public API, a release and a three-component extraction. §5 gets the rebranding goal with four one-line edits.

---

## 6. Alternative: framework extraction (separate decision)

Kept for the record, with the props the current code actually needs.

```tsx
// @igrp/framework-next-ui (new, client)
<IGRPLogoutFlow
  getEndSessionUrl={(postLogoutRedirectUri: string) => Promise<string | null>} // getLogoutUrl
  onMarkPending={() => void}                 // markLogoutPending
  onLocalSignedOut={() => Promise<void>}     // markHostLogout (fallback path)
  onError={(err: unknown) => void}           // reportError
  loginPath="/login"
  renderLoading={() => React.ReactNode}
/>

<IGRPLogoutCompletion
  onSignedOut={() => Promise<void>}          // markHostLogout, clearLogoutPending, markSilentSsoTried
  onError={(err: unknown) => void}
  loginPath="/login"
  renderLoading={() => React.ReactNode}
/>
```

- `session-ended-completion.tsx` and `silent-sign-in.tsx` would still need the same treatment, or stay in the template with `AuthLoading`.
- `onSignedOut` has to run in the `finally` of the deferred `signOut` (today's order: host logout → clear marker → mark silent tried → reload). Getting that order wrong reintroduces the silent-SSO loop after logout.
- Cost: two to four public exports, a `patch` changeset on `@igrp/framework-next-ui`, ordered `pnpm build:framework`, per-package release, a template migration, and the full logout matrix (§10.2) run against the extracted code.

---

## 7. Export-safety analysis

| Building block | Source | Public? |
|---|---|---|
| `signIn`, `AuthProviderId` | `@igrp/framework-next-auth/client` | ✅ |
| `getAuthProviderIdFromEnv` | `@igrp/framework-next-auth` | ✅ |
| `IGRPAuthForm`, `IGRPAuthCarousel`, `IGRPTemplateModeSwitcher`, `IGRPTemplateLoading` | `@igrp/framework-next-ui` | ✅ |
| `IGRPLocaleSwitcher` | `@igrp/framework-next/i18n/client` | ✅ |
| `IGRPButton`, `IGRPIcon`, `Alert`, `AlertDescription` | DS root | ✅ |

The recommended design adds no framework exports.

---

## 8. Correctness: auth & preview mode

- **Login:** both branches sit below the same steps 1–6. Under bypass the page redirects before the switch. A pending logout, a session-ended reload and a silent-SSO attempt all return before it. `CustomAuthForm` calls `signIn` only with the sanitized/resolved props, so the open-redirect and login-loop guards hold.
- **Transition screens:** no logic changes. `logout_pending`, the `id_token_hint` POST, the timeouts, `markHostLogout`, `markSilentSsoTried` and the middleware backstop behave exactly as before.
- **No change** to `middleware.ts`, the root layout or `igrp.template.config.ts`.

---

## 9. Work breakdown

| # | File | Type | Change |
|---|---|---|---|
| 1 | `src/app/(auth)/login/page.tsx` | SERVER | `IGRP_AUTH_UI === "custom"` branch after silent SSO. |
| 2 | `src/components/custom-auth/custom-auth-form.tsx` | CLIENT | Reference form. |
| 3 | `src/components/custom-auth/custom-auth-hero.tsx` | CLIENT | Optional hero. |
| 4 | `src/components/custom-auth/auth-loading.tsx` | CLIENT | Transition visual. |
| 5 | `src/app/(auth)/logout/page.tsx`, `login/logout-completion.tsx`, `login/session-ended-completion.tsx`, `login/silent-sign-in.tsx` | CLIENT | Render `AuthLoading` instead of `IGRPTemplateLoading`, plus the "do not edit" comment. Nothing else. |
| 6 | `src/i18n/messages/{pt,en,fr}.json` | i18n | `login.custom.signIn`, `login.custom.signInError`. |
| 7 | `.env.example` | config | Document `IGRP_AUTH_UI`. |
| 8 | `packages/framework/template-migrator/migrations/demo-v1/NN.MIGRATIONS-DDMMYYYY.md` + `payload/NN/` | migration | `file.create` for 2–4, `file.write` for 1, 5 and 6, `env.add` for 7. Then `sync:template-lock`. |
| 9 | `specs/` (this doc) | docs | Design record. |

No `globals.css` change.

### Environment variable

| Name | `IGRP_AUTH_UI` |
|---|---|
| Visibility | Server-only (not `NEXT_PUBLIC_*`) |
| Values | `default` \| `custom` |
| Unset / unknown | `IGRPAuthForm` + `IGRPAuthCarousel` |
| Read site | `(auth)/login/page.tsx` only |

### Build & release

1. Template edits (rows 1–7), then the migration (row 8), `pnpm --filter @igrp/template-migrator sync:template-lock`, commit `.igrp-migrations-lock.json`.
2. `pnpm build:demo` (Biome + `lint:i18n` + type-check) and `pnpm --filter @igrp/template-migrator check:drift`.
3. Release `@igrp/template-migrator` (`patch`, per-package `release`, `--tag latest`), only when authorised.

No `pnpm build:framework`: no framework package changes.

---

## 10. Testing & verification

### 10.1 Login (`pnpm dev:demo`, bypass off, real IdP)
1. `IGRP_AUTH_UI=custom` → custom form; sign-in reaches the IdP with the sanitized `callbackUrl` and lands on the target.
2. `default`, unset and `nonsense` → framework login unchanged.
3. Custom form full-width with the hero deleted; dark mode; locale switch re-renders texts in `pt`/`en`/`fr`.
4. Signed in at the IdP from another app → silent SSO signs in with no form shown, under both values.
5. `/login?reason=session_ended` → session cleared, reload, then the custom form.
6. `/login?callbackUrl=//evil.example` and `?callbackUrl=/logout` → sanitized to `/`.
7. `signIn` failure (IdP unreachable) → error alert, button usable again.
8. `IGRP_PREVIEW_MODE=true` → `/login` redirects to `/` under both values.

### 10.2 Transition screens
9. Logout via IdP: POST submits, `logout_pending` set, back on `/login`, completion runs, marker cleared, login form shown with no session, and no silent-SSO loop.
10. Logout fallback (no `end_session_endpoint` / lookup timeout): local `signOut` + host-logout cookie + navigate to `/login`.
11. A customised `AuthLoading` appears on all four screens.
12. Strict-Mode remount still produces one `signOut`.

### 10.3 Build
13. `pnpm build:demo` clean, including `lint:i18n`; `check:drift` passes.

---

## 11. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Switch placed before silent SSO / session-ended, skipping them | Medium | §4.1 places it after step 6; tests 10.1.4–5. |
| End user edits a transition file and breaks the teardown | Medium | §5 gives them `auth-loading.tsx` so they don't need to; "do not edit" comments; review rule in §5.3. The framework extraction (§6) is the stronger fix if this happens in practice. |
| Custom form bypasses `signIn` or reads an unsanitized `callbackUrl` | Low | Frame rule 3; the reference models it. |
| Hard-coded copy fails `lint:i18n` | Medium | Frame rule 4; message keys in §9 row 6. |
| Unknown env value disables login | Low | Fail-safe default. |

---

## 12. Decisions requested

1. **Approve the login env switch** (§4) as revised: `IGRP_AUTH_UI=default|custom`, after silent SSO, carousel optional.
2. **Transition screens:** template-only `AuthLoading` (§5, recommended) or the framework extraction (§6).
3. **igrp-studio integration:** scaffold `custom-auth/*` and expose `IGRP_AUTH_UI`, or manual opt-in first.

---

## 13. Appendix: referenced source

- `templates/demo-v1/src/app/(auth)/login/page.tsx`: server frame + switch site.
- `templates/demo-v1/src/app/(auth)/logout/page.tsx`: logout teardown.
- `templates/demo-v1/src/app/(auth)/login/{logout-completion,session-ended-completion,silent-sign-in}.tsx`: transition screens.
- `templates/demo-v1/src/actions/igrp/auth.ts`: `getLogoutUrl`, `markHostLogout`.
- `templates/demo-v1/src/lib/logout-pending.ts`, `src/lib/silent-sso.ts`: cookie contracts.
- `packages/framework/next-ui/src/auths/form.tsx`: `IGRPAuthForm` (`signIn` reference, loading-flag note).
- `packages/framework/next-ui/src/auths/carousel.tsx`: `IGRPAuthCarousel`.
- `packages/framework/template-migrator/README.md`: adding a migration.
