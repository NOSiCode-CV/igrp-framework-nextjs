# Design & Spec: User-Defined Login & Logout for IGRP-Studio Apps

| | |
|---|---|
| **Status** | Draft — awaiting manager approval |
| **Author** | Fidel da Luz |
| **Date** | 2026-06-22 |
| **Scope** | `templates/demo-legacy` (login is template-only) + one additive `@igrp/framework-next-ui` change (logout teardown extraction). |
| **Affects** | `@igrp/framework-next-template` consumers; igrp-studio generated apps; `@igrp/framework-next-ui` |
| **Risk** | Low (login default path unchanged + fail-safe fallback; logout logic lifted verbatim, behavior-preserving) |
| **Companion** | Mirrors `docs/2026-06-22-custom-layout-design-spec.md` (same frame/canvas model, same env-switch pattern) |

---

## 1. Executive summary

The template's `(auth)` route group ships a fixed login screen (`IGRPAuthCarousel` + `IGRPAuthForm`) and a logout screen (`IGRPTemplateLoading` + a ~200-line client teardown). There is no supported way for an end user to ship a generated app with their own login look-and-feel, and the logout page mixes a trivial visual (a spinner) with fragile, security-critical orchestration that end users must not edit.

This proposal:

1. **Login (template-only, zero framework change).** Adds an env switch in `(auth)/login/page.tsx` that selects, per app, between the default framework login (`IGRPAuthForm` + `IGRPAuthCarousel`) and an **end-user-authored custom login** that lives in the template and can be freely redesigned. The server "frame" (bypass gate, logout-completion handshake, `callbackUrl` sanitization, provider resolution) is preserved in both branches.

2. **Logout (one additive framework change).** Extracts the fragile teardown into two render-slot components in `@igrp/framework-next-ui` — `IGRPLogoutFlow` and `IGRPLogoutCompletion` — that own **all** of the dangerous logic and expose **only** the loading visual as a slot. The template's logout page collapses to a thin wrapper; the cookie contract and the `getLogoutUrl` action stay template-owned (edge middleware reads the cookie).

**Key properties**
- **Login: zero framework-package changes.** Built entirely from already-public exports; default + unknown env always falls back to the proven `IGRPAuthForm`.
- **Logout: behavior-preserving.** The teardown is *lifted verbatim* into the framework; no logic rewrite. End users can no longer break it — they only supply `renderLoading`.
- **Auth & preview-mode correctness preserved.** Both login branches reuse the existing bypass + completion + sanitize pipeline; logout keeps the deferred-teardown handshake and the middleware backstop.

**Estimated effort:** ~0.5 day login (template-only) + ~0.5–1 day logout (incl. changeset + ordered build + release of `@igrp/framework-next-ui`).

---

## 2. Background & problem statement

### 2.1 Login today — `src/app/(auth)/login/page.tsx` (SERVER)

The login page is already a thin **server orchestrator**: it performs four auth-critical steps, then delegates all *visuals* to two `@igrp/framework-next-ui` client components.

| Step | Code | Why it is load-bearing |
|---|---|---|
| 1. Bypass gate | `if (isAuthBypass()) redirect("/")` | No real provider exists under `IGRP_PREVIEW_MODE` / `AUTH_PROVIDER=none` — a form would 404 on submit. |
| 2. Logout completion | `if (cookieStore.has(LOGOUT_PENDING_COOKIE)) return <LogoutCompletion/>` | Deferred-teardown handshake — finish a logout that left for the IdP. |
| 3. Sanitize | `sanitizeCallbackUrl(callbackUrl) ?? "/"` | Open-redirect / login-loop guard. |
| 4. Resolve provider | `getAuthProviderIdFromEnv(process.env)` | Drives `signIn`. |
| 5. Render | `<IGRPAuthCarousel/>` + `<IGRPAuthForm/>` | **Pure visuals.** |

The decisive facts:
- The actual auth primitive lives **inside `IGRPAuthForm`**: `signIn(providerId, { callbackUrl })` from `@igrp/framework-next-auth/client`. A fully custom form re-implements only this one ~3-line call.
- **`IGRPAuthCarousel` has zero auth role.** It sits in a `hidden md:block md:w-1/2` panel (already hidden on mobile) and renders `carouselItems` images. Nothing in the auth flow depends on it; it is purely decorative and **entirely optional**.

This is the same "frame vs canvas" shape as the layout spec: a server frame (steps 1–4) wrapping a free visual canvas (step 5).

### 2.2 Logout today — `src/app/(auth)/logout/page.tsx` (CLIENT) + `login/logout-completion.tsx`

The opposite situation, and the reason logout needs a framework change. The **visible UI is just `<IGRPTemplateLoading>`** — a spinner with text. Everything else is fragile, correctness-critical orchestration that must NOT be redesigned by end users:

- module-scoped `logoutStarted` guard against a double `signOut`;
- fetch the end-session URL **before** `signOut` (the access token is needed to build `id_token_hint`), raced against `LOOKUP_TIMEOUT_MS`;
- `id_token_hint` carried in a **POST body**, never the URL/history/IdP access logs;
- **deferred teardown:** set `logout_pending` cookie → top-level POST to the IdP `end_session_endpoint` → IdP redirect back to `/login` → `LogoutCompletion` runs the real `signOut` → middleware backstop completes an abandoned logout;
- `FALLBACK_TIMEOUT_MS` watchdog; the **"every exit path must navigate"** invariant.

So logout has essentially **no canvas — only the loading screen** (text, logo, animation). Today that ~200 lines is duplicated in the template and easy to break on touch.

**Problem:** there is no template-level mechanism to choose a custom login per app, and no safe way to let an end user rebrand the logout screen without inheriting (and risking) the teardown logic.

---

## 3. Goals & non-goals

### Goals
- Let an end user supply a fully custom **login** screen (any layout; carousel optional) via components they own, selected per app by a single environment variable.
- Let an end user rebrand the **logout** loading screen **without** touching the teardown logic.
- Keep the default behavior unchanged and the login path free of framework-package changes.
- Preserve auth gating, preview-mode bypass, `callbackUrl` sanitization, and the deferred-logout handshake in every branch.

### Non-goals
- Changing how igrp-studio generates pages, or adding a credentials/password login form (the IdP owns authentication; the app only initiates `signIn`).
- Introducing a second UI library or bypassing the design system.
- A runtime/per-request login picker UI (the choice is per app/deploy).
- Reworking the OIDC end-session contract, the `logout_pending` cookie, or the middleware backstop — the logout change is a behavior-preserving **extraction**, not a redesign.

---

## 4. Proposed design — Part A: Login (template-only)

### 4.1 Layout selection in `(auth)/login/page.tsx`

The four-step server frame is unchanged. Only step 5 (the visual) is selected by env:

```tsx
// src/app/(auth)/login/page.tsx   ← SERVER (unchanged shell)
import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { CustomAuthForm } from "@/components/custom-auth/custom-auth-form";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { cn, isAuthBypass, sanitizeCallbackUrl } from "@/lib/utils";

import { LogoutCompletion } from "./logout-completion";

const { sliderPosition, texts } = loginConfig;
const { logo, name } = siteConfig;

export default async function AuthPage({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  // Frame, step 1: bypass — no provider to sign into.
  if (isAuthBypass()) redirect("/");

  // Frame, step 2: complete a deferred logout if the marker is present.
  const cookieStore = await cookies();
  if (cookieStore.has(LOGOUT_PENDING_COOKIE)) return <LogoutCompletion />;

  // Frame, steps 3–4: sanitize callbackUrl + resolve provider.
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl) ?? "/";
  const providerId = getAuthProviderIdFromEnv(process.env);

  // Frame, step 5: choose the canvas. Read inside the function so it evaluates
  // per render; unknown/unset → the proven default (fail-safe).
  if (process.env.IGRP_AUTH_UI === "custom") {
    return (
      <CustomAuthForm callbackUrl={safeCallbackUrl} providerId={providerId} />
    );
  }

  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first hidden lg:block",
          sliderPosition === "right" && "lg:order-last",
        )}
      >
        <IGRPAuthCarousel carouselItems={carouselItems} />
      </div>
      <IGRPAuthForm
        texts={texts}
        logo={logo}
        name={name}
        callbackUrl={safeCallbackUrl}
        providerId={providerId}
      />
    </section>
  );
}
```

Notes:
- **Explicit `default → IGRPAuthForm`** keeps the framework path fail-safe and both arms statically imported (bundler-traceable).
- The env is read **inside the function** so it evaluates per render under the page's existing dynamic behavior, not snapshotted at module load.
- The `CustomAuthForm` receives **only serializable props** (`callbackUrl: string`, `providerId: AuthProviderId`) — safe across the RSC boundary.

### 4.2 End-user freedom: the login "frame" and "canvas"

**The frame (non-negotiable):**
1. The page stays a **server component**; bypass (step 1) and logout-completion (step 2) branches stay above the switch.
2. `callbackUrl` is sanitized and `providerId` is env-resolved **server-side**, then passed as props.
3. **Exactly one** rendered element must invoke `signIn(providerId, { callbackUrl })` from `@igrp/framework-next-auth/client`, using those props (not a hand-built URL, not an unsanitized `callbackUrl`).
4. Repo UI hard rules apply: design-system only, semantic tokens only, `"use client"` on DS-importing files, Horizon-first / primitives for full control.

**The canvas (free):**
- The **entire visual layout**. A second panel / carousel / hero image is **optional** — `IGRP_AUTH_UI=custom` may render `CustomAuthForm` alone, full-width, with no carousel.
- Own logo, copy, background (static `<Image>`, video, gradient), split ratio, carousel on either side, or a single centered card.
- Reuse `IGRPAuthCarousel` as-is, replace it, or omit it.

### 4.3 The custom login form — a CLIENT component (can be anything)

Self-contained so it works **full-width with no carousel**. The only contract is the `signIn` call.

```tsx
// src/components/custom-auth/custom-auth-form.tsx   ← CLIENT (end-user editable)
"use client";

import {
  IGRP_AUTH_PROVIDER_ID,
  signIn,
  type AuthProviderId,
} from "@igrp/framework-next-auth/client";
import {
  Alert, AlertDescription, Button, cn, IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { IGRPTemplateModeSwitcher } from "@igrp/framework-next-ui";
import { useState } from "react";

type CustomAuthFormProps = {
  callbackUrl?: string;            // already sanitized by the server frame
  providerId?: AuthProviderId;     // already resolved from env by the server frame
};

export function CustomAuthForm({
  callbackUrl = "/",
  providerId = IGRP_AUTH_PROVIDER_ID,
}: CustomAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  async function onSubmit() {
    setIsLoading(true);
    setAuthError(null);
    try {
      // ── THE ONE NON-NEGOTIABLE LINE ──────────────────────────────────────
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Falha ao iniciar sessão.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Everything below here is FREE — redesign to taste.
  return (
    <section className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex w-full max-w-sm justify-end">
        <IGRPTemplateModeSwitcher />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6">
        {authError && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            <IGRPIcon iconName="AlertCircle" className="size-4" aria-hidden />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <h1 className="text-center text-2xl font-semibold">Bem-vindo</h1>
        <p className="text-muted-foreground text-center text-sm">
          Inicie sessão para continuar.
        </p>

        <Button onClick={onSubmit} disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? (
            <IGRPIcon iconName="Loader" className="mr-2 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <IGRPIcon iconName="ShieldCheck" className="mr-2 size-5" aria-hidden />
          )}
          Iniciar sessão
        </Button>
      </div>
    </section>
  );
}
```

### 4.4 The custom carousel — OPTIONAL

If the end user wants a second panel, they own it; if not, **delete this file and the `<div>` panel** so `CustomAuthForm` goes full-width. A static image is also valid:

```tsx
// src/components/custom-auth/custom-auth-carousel.tsx   ← CLIENT (optional)
"use client";

import { cn } from "@igrp/igrp-framework-react-design-system";
import Image from "next/image";

// Either reuse IGRPAuthCarousel (data-driven slideshow), or — for a static hero —
// just render one <Image fill/>. Decorative only; no auth role.
export function CustomAuthCarousel({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image src="/placeholder-carousel.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
```

*(If the carousel is kept, place it in the same optional panel pattern as §4.1's default branch; for full-width login, omit the panel entirely.)*

---

## 5. Proposed design — Part B: Logout (additive framework change)

### 5.1 New `@igrp/framework-next-ui` exports

Client chrome lives in `next-ui` (downstream of `next-auth`, so it can import `signIn`). Two render-slot components own the teardown; the end user supplies only `renderLoading`.

```tsx
// IGRPLogoutFlow — owns the WHOLE teardown + the id_token_hint POST form.
<IGRPLogoutFlow
  getEndSessionUrl={(postLogoutRedirectUri: string) => Promise<string | null>}
  onMarkPending={() => void}        // template owns the cookie (middleware reads it)
  onError={(err: unknown) => void}  // template's reportError
  loginPath="/login"                // framework computes origin + basePath itself
  renderLoading={() => React.ReactNode}  // the ONLY canvas
/>

// IGRPLogoutCompletion — deferred-teardown completion, rendered on /login.
<IGRPLogoutCompletion
  onClearPending={() => void}
  onError={(err: unknown) => void}
  loginPath="/login"
  renderLoading={() => React.ReactNode}
/>
```

**The framework owns everything dangerous** (lifted verbatim from today's `logout/page.tsx` and `logout-completion.tsx`):
- the module-scoped `logoutStarted` guard;
- `LOOKUP_TIMEOUT_MS` / `FALLBACK_TIMEOUT_MS` and the lookup race;
- the hidden `id_token_hint` **POST form** — built and auto-submitted internally;
- the deferred-teardown decision (IdP round-trip vs. local-only fallback);
- the `settled` / "every exit path navigates" invariant and `signOut`.

**Injected (stays template-owned), and why:**

| Prop | Why it is injected, not absorbed |
|---|---|
| `getEndSessionUrl` | Wraps the template's `withIGRPAuth` instance (`auth.getAccessToken()` + `buildEndSessionUrl`). The framework component can't own the template's `auth`. |
| `onMarkPending` / `onClearPending` | The `logout_pending` cookie contract is read by **edge middleware** (`src/middleware.ts` backstop) and must stay co-located with it in the template. Injecting the writers keeps the contract in one place. |
| `onError` | Template's `reportError` (segment tagging). |
| `loginPath` | App-specific path; the framework appends it to `origin + NEXT_PUBLIC_BASE_PATH`. |
| `renderLoading` | The only visual surface — the end user's canvas. |

### 5.2 The template after the change

`(auth)/logout/page.tsx` collapses to a thin wrapper:

```tsx
// src/app/(auth)/logout/page.tsx   ← CLIENT (thin)
"use client";

import { IGRPLogoutFlow, IGRPTemplateLoading } from "@igrp/framework-next-ui";

import { getLogoutUrl } from "@/actions/igrp/auth";
import { markLogoutPending } from "@/lib/logout-pending";
import { reportError } from "@/lib/report-error";

export default function LogoutPage() {
  return (
    <IGRPLogoutFlow
      getEndSessionUrl={getLogoutUrl}
      onMarkPending={markLogoutPending}
      onError={(err) => reportError(err, { segment: "(auth)/logout" })}
      loginPath="/login"
      renderLoading={() => (
        <IGRPTemplateLoading
          text="A terminar sessão..."
          appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
        />
      )}
    />
  );
}
```

`(auth)/login/logout-completion.tsx` collapses similarly to `<IGRPLogoutCompletion onClearPending={clearLogoutPending} … renderLoading={…} />`.

**Unchanged:** `getLogoutUrl` (`actions/igrp/auth.ts`), `logout-pending.ts`, and the `src/middleware.ts` backstop.

### 5.3 End-user freedom: the logout "frame" and "canvas"

- **Frame (non-negotiable, framework-owned):** the entire teardown. End users cannot edit it.
- **Canvas (free):** only `renderLoading` — any DS composition (custom spinner, branded splash, progress copy). The end user *may* also restyle the wrapper page around `<IGRPLogoutFlow/>`, but the flow component must be rendered exactly once.

---

## 6. Export-safety analysis

| Building block | Source | Public? |
|---|---|---|
| `signIn`, `IGRP_AUTH_PROVIDER_ID`, `AuthProviderId` | `@igrp/framework-next-auth/client` | ✅ |
| `getAuthProviderIdFromEnv` | `@igrp/framework-next-auth` | ✅ |
| `IGRPAuthForm`, `IGRPAuthCarousel`, `IGRPTemplateModeSwitcher`, `IGRPTemplateLoading` | `@igrp/framework-next-ui` | ✅ |
| `buildEndSessionUrl` | `@igrp/framework-next-auth/oidc` | ✅ |
| `signOut` | `@igrp/framework-next-auth/client` | ✅ |
| **`IGRPLogoutFlow`, `IGRPLogoutCompletion`** | `@igrp/framework-next-ui` | 🆕 (this proposal) |

- **Login ships with zero framework changes** — all building blocks are already public.
- **Logout adds exactly two public client exports** to `next-ui`. They are pure client chrome (the natural home per the dependency order) and take all template-specific behavior via props, so they introduce no server coupling and no new private-surface dependency.

---

## 7. Correctness: auth & preview mode

- **Login:** both branches sit under the same server frame — `isAuthBypass()` (preview/`AUTH_PROVIDER=none` → redirect `/`), the logout-completion handshake, `sanitizeCallbackUrl`, and `getAuthProviderIdFromEnv`. `CustomAuthForm` only ever calls `signIn(providerId, { callbackUrl })` with the sanitized/resolved props, so open-redirect and login-loop guards hold identically. Under bypass the custom branch is never reached (the page redirects first).
- **Logout:** the extraction is behavior-preserving. The `logout_pending` cookie, the IdP POST with `id_token_hint`, the timeouts, and the middleware backstop are unchanged in semantics — only their *location* moves into the framework. The template still owns the cookie writers and the `getLogoutUrl` action, so the edge-safe contract in `middleware.ts` is untouched.

Both satisfy the repo rule that every auth-aware branch stay bypass-aware. No change to `middleware.ts`, root layout, or the config builder.

---

## 8. Best-practices conformance

- **Composition (Vercel):** explicit variant selected by env instead of a boolean mode (`patterns-explicit-variants`, `architecture-avoid-boolean-props`); render-slot (`renderLoading`) instead of a config-flag-driven internal switch (`patterns-children-over-render-props`); dependency injection for template-specific behavior keeps the framework component pure.
- **React/Next (Vercel):** minimal serializable props across the RSC boundary (`callbackUrl`, `providerId`); statically analyzable imports for both login arms (`bundle-analyzable-paths`).
- **Next.js:** correct server/client split — login page server, custom form client; logout flow client.
- **Design system / shadcn:** DS primitives + Horizon where it fits; semantic tokens only; `cn()`, `size-*`, `flex gap-*`; no `npx shadcn add` in the template.

---

## 9. Work breakdown (spec)

| # | File | Pkg / Type | Change |
|---|---|---|---|
| 1 | `packages/framework/next-ui/src/components/auths/logout-flow.tsx` | next-ui / CLIENT | New `IGRPLogoutFlow` — teardown + POST form, lifted verbatim from today's `logout/page.tsx`. |
| 2 | `packages/framework/next-ui/src/components/auths/logout-completion.tsx` | next-ui / CLIENT | New `IGRPLogoutCompletion` — lifted from today's `login/logout-completion.tsx`. |
| 3 | next-ui barrel / `exports` | next-ui | Export both new components + their prop types. |
| 4 | `.changeset/*.md` | next-ui | `patch` per hard-rules (pre-release `beta`). |
| 5 | `src/app/(auth)/login/page.tsx` | template / SERVER | Add the `IGRP_AUTH_UI === "custom"` branch above the default render. |
| 6 | `src/components/custom-auth/custom-auth-form.tsx` | template / CLIENT | Reference custom form (self-contained; calls `signIn`). |
| 7 | `src/components/custom-auth/custom-auth-carousel.tsx` | template / CLIENT | **Optional** reference carousel/hero (deletable). |
| 8 | `src/app/(auth)/logout/page.tsx` | template / CLIENT | Collapse to `<IGRPLogoutFlow/>` wrapper. |
| 9 | `src/app/(auth)/login/logout-completion.tsx` | template / CLIENT | Collapse to `<IGRPLogoutCompletion/>` wrapper. |
| 10 | `.env.example` | template / config | Document `IGRP_AUTH_UI`. |
| 11 | `docs/` (this doc) | template / docs | Design record. |

No `globals.css` change: `@source` already globs `../src/**/*.{ts,tsx}` and the DS `dist/`.

### Environment variable spec

| Name | `IGRP_AUTH_UI` |
|---|---|
| Visibility | Server-only (not `NEXT_PUBLIC_*`) |
| Values | `default` \| `custom` |
| Unset / unknown | Falls back to `default` (`IGRPAuthForm` + `IGRPAuthCarousel`) |
| Read site | `(auth)/login/page.tsx` only |

---

## 10. Build & release order

1. `packages/framework/next-ui` — add the two components, export, changeset (`patch`).
2. `pnpm build:framework` (ordered — `next-ui` rebuilds; `next` follows per the dependency order).
3. Release `@igrp/framework-next-ui` via its per-package `release` script (`--tag latest`); verify on the Sonatype registry.
4. Template consumes the new `next-ui`; apply login + logout template edits; `pnpm build:demo` (Biome).

---

## 11. Testing & verification plan

**Login** (`pnpm dev:demo`):
1. `IGRP_AUTH_UI=custom`, `IGRP_PREVIEW_MODE=false` → custom login renders; clicking sign-in calls `signIn(providerId, { callbackUrl })` with a **sanitized** `callbackUrl`; OIDC round-trip completes and lands on the callback target.
2. `IGRP_AUTH_UI=default` **and unset/unknown** → `IGRPAuthForm` + `IGRPAuthCarousel` render unchanged.
3. Custom login with the carousel file deleted → form renders full-width, no layout break; dark mode + mode switcher work.
4. `IGRP_PREVIEW_MODE=true` → `/login` redirects to `/` in **both** UI modes (bypass reached before the switch).

**Logout** (after the framework release):
5. IdP round-trip path: end-session POST submits; `logout_pending` set; browser returns to `/login`; `IGRPLogoutCompletion` runs `signOut`, clears the marker, reloads; the login form appears with no session.
6. No-IdP fallback path (no token / no `end_session_endpoint` / lookup timeout): local `signOut` + hard navigate to `/login`.
7. Double-`signOut` guard holds across a dev Strict-Mode remount; the `FALLBACK_TIMEOUT_MS` watchdog still fires on a hung `signOut`.
8. Custom `renderLoading` renders; the middleware backstop still completes an abandoned logout on the next protected request.
9. Bypass on → `/logout` redirects to `/`.

**Build:** `pnpm build:framework` then `pnpm build:demo` (Biome) clean.

---

## 12. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Regression in the extracted logout teardown | Medium | Lift the logic **verbatim** into `IGRPLogoutFlow` — behavior-preserving, no rewrite; run the full §11 logout matrix before release. |
| Cookie-contract drift between framework component and template middleware | Medium | Keep `onMarkPending`/`onClearPending` **injected** so the `logout_pending` contract stays template-owned alongside `middleware.ts`. |
| Custom login form crossing the RSC boundary | Low | `CustomAuthForm` is `"use client"`; receives only serializable `callbackUrl`/`providerId`. |
| End user bypasses `signIn` / unsanitized `callbackUrl` | Low | Frame passes sanitized props down; §4.2 frame rule 3 documents the single contract; reference form models it. |
| Unknown env value disables login | Low | Fail-safe `default → IGRPAuthForm`. |

---

## 13. Decisions requested for approval

1. **Approve the login env-switch, template-only approach** (§4) as specified — `IGRP_AUTH_UI=default|custom`, carousel optional.
2. **Approve the additive `@igrp/framework-next-ui` logout extraction** (§5) — `IGRPLogoutFlow` + `IGRPLogoutCompletion` render-slot components, behavior-preserving, `patch` changeset + ordered build + release.
3. **igrp-studio integration:** should studio scaffold `custom-auth/*` and surface the `IGRP_AUTH_UI` toggle, or is this a manual opt-in for end users initially?

---

## 14. Appendix — referenced source

- `templates/demo-legacy/src/app/(auth)/login/page.tsx` — login server frame + switch site.
- `templates/demo-legacy/src/app/(auth)/logout/page.tsx` — teardown to extract.
- `templates/demo-legacy/src/app/(auth)/login/logout-completion.tsx` — completion to extract.
- `templates/demo-legacy/src/actions/igrp/auth.ts` — `getLogoutUrl` (stays template-owned).
- `templates/demo-legacy/src/lib/logout-pending.ts` — cookie contract (stays template-owned, edge-safe).
- `packages/framework/next-ui/src/components/auths/form.tsx` — `IGRPAuthForm` (`signIn` reference).
- `packages/framework/next-ui/src/components/auths/carousel.tsx` — `IGRPAuthCarousel` (decorative).
- `packages/framework/next-auth/src/oidc.ts` — `buildEndSessionUrl`.
- `docs/2026-06-22-custom-layout-design-spec.md` — companion layout spec (same model).
