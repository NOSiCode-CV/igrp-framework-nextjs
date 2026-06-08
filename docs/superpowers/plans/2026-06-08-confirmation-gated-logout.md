# Confirmation-gated logout (Option A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Defer the local NextAuth `signOut()` in the `demo-legacy` logout flow until the IdP redirect-back lands on `/login`, with a cookie + middleware backstop so an abandoned logout still completes.

**Architecture:** The logout page sets a short-lived `logout_pending` cookie and POSTs to the IdP `end_session_endpoint` *without* clearing the local session. The IdP's redirect back to `/login` is the confirmation; the login page (server component) detects the cookie and renders a `LogoutCompletion` client component that runs `signOut()`, clears the cookie, and reloads. Middleware treats the cookie on any protected route as "teardown owed" and forces the user through `/login`.

**Tech Stack:** Next.js 15 App Router (server + client components), NextAuth v4 (`@igrp/framework-next-auth/client`), Biome, TypeScript. No unit-test runner exists in this template — verification is `tsc --noEmit` + Biome + `next build` + dev-server runtime checks.

**Scope:** `templates/demo-legacy` only. No changeset required — the template is `private: true` and ships via the `publish:template` zip script, not npm/changesets.

**Refinement vs. spec:** The spec said the `/login` client component reads the cookie on mount. This plan reads it on the **server** (login page) and gates rendering, then `LogoutCompletion` reloads after teardown. This avoids a hydration mismatch / form-flash while preserving the spec's intent (deferred teardown on `/login` via cookie + `LogoutCompletion`).

**Prerequisite:** `pnpm build:framework` has been run so the `workspace:*` `@igrp/*` `dist/` outputs exist (required for `tsc` and `next build` in the template).

---

## File structure

- **Create** `templates/demo-legacy/src/lib/logout-pending.ts` — shared cookie name + client get/set/clear helpers. Edge-safe at module scope (no `document` access until a function is called), so middleware can import the constant.
- **Create** `templates/demo-legacy/src/app/(auth)/login/logout-completion.tsx` — client component that runs the deferred `signOut()` and reloads `/login`.
- **Modify** `templates/demo-legacy/src/app/(auth)/login/page.tsx` — server-side cookie gate that renders `LogoutCompletion` instead of the form when a teardown is owed.
- **Modify** `templates/demo-legacy/src/app/(auth)/logout/page.tsx` — defer `signOut()`; set the marker; keep the local-only fallback when there is no IdP round-trip.
- **Modify** `templates/demo-legacy/src/middleware.ts` — backstop redirect on the marker for protected routes.

All commands below are run from the template directory unless stated:
`cd templates/demo-legacy`

---

### Task 1: Shared `logout_pending` cookie module

**Files:**
- Create: `templates/demo-legacy/src/lib/logout-pending.ts`

- [ ] **Step 1: Create the module**

```ts
// Shared marker for the deferred-teardown logout flow (Option A).
//
// The logout page sets this cookie *instead of* calling signOut() before it
// POSTs to the IdP end_session_endpoint. The local session is torn down only
// once the IdP redirects the browser back to /login: `LogoutCompletion` reads
// this cookie there, runs signOut(), then clears it. The middleware backstop
// reads the same cookie to force an abandoned logout to complete on the next
// protected-route request (see src/middleware.ts).
//
// Module scope must stay edge-safe: middleware imports LOGOUT_PENDING_COOKIE,
// so no `document` access outside the client-only functions below.

/** Cookie name shared by the logout page, /login completion, and middleware. */
export const LOGOUT_PENDING_COOKIE = "logout_pending";

// 5 min: long enough for the IdP round-trip, short enough to self-heal if the
// user abandons the flow at the IdP.
const LOGOUT_PENDING_MAX_AGE_SECONDS = 300;

// Scope to the app's basePath so the marker can't leak across apps sharing a
// domain. NEXT_PUBLIC_* is inlined client-side at build time.
function cookiePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/";
}

function secureAttr(): string {
  return process.env.NODE_ENV === "production" ? "; secure" : "";
}

/**
 * Set the logout-pending marker. Client-only — call immediately before the
 * top-level IdP end-session POST.
 *
 * SameSite=Lax is required: the IdP's redirect back to /login is a top-level
 * GET navigation, and Lax sends the cookie on top-level GET navigations.
 */
export function markLogoutPending(): void {
  document.cookie = `${LOGOUT_PENDING_COOKIE}=1; path=${cookiePath()}; max-age=${LOGOUT_PENDING_MAX_AGE_SECONDS}; samesite=lax${secureAttr()}`;
}

/** Clear the marker. Client-only — call after signOut() completes on /login. */
export function clearLogoutPending(): void {
  document.cookie = `${LOGOUT_PENDING_COOKIE}=; path=${cookiePath()}; max-age=0; samesite=lax${secureAttr()}`;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (exit 0).

- [ ] **Step 3: Lint the new file**

Run: `npx @biomejs/biome check src/lib/logout-pending.ts`
Expected: "Checked 1 file" with no diagnostics.

- [ ] **Step 4: Commit**

```bash
git add templates/demo-legacy/src/lib/logout-pending.ts
git commit -m "feat(template): add logout_pending cookie helpers for deferred logout"
```

---

### Task 2: `LogoutCompletion` client component

**Files:**
- Create: `templates/demo-legacy/src/app/(auth)/login/logout-completion.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { signOut } from "@igrp/framework-next-auth/client";
import { IGRPTemplateLoading } from "@igrp/framework-next-ui";
import { useEffect, useRef } from "react";

import { clearLogoutPending } from "@/lib/logout-pending";
import { reportError } from "@/lib/report-error";

/**
 * Deferred logout teardown (Option A).
 *
 * The logout page no longer clears the local NextAuth session before POSTing to
 * the IdP — it sets a `logout_pending` cookie and leaves. The IdP's redirect
 * back to /login is the confirmation that the SSO session was terminated; this
 * component runs the local signOut() at that point, clears the marker, then
 * reloads /login so the server re-renders the login form with no session.
 *
 * Rendered by the login page (server) only when the marker is present, so a
 * normal login visit never mounts this and shows the form immediately.
 */
export function LogoutCompletion() {
  // Module-instance guard: the async teardown must run exactly once even if the
  // effect re-fires (Strict Mode mount→unmount→mount in dev).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      console.log("[logout][client] completing deferred signOut on /login…");
      try {
        await signOut({ redirect: false });
        console.log("[logout][client] deferred signOut complete");
      } catch (error) {
        console.error("[logout][client] deferred signOut threw", error);
        reportError(error, { segment: "(auth)/login:logout-completion" });
      } finally {
        // Clear the marker BEFORE reloading (document.cookie is synchronous, so
        // the cookie is gone before the next request fires). On reload the
        // server no longer gates on the marker and renders the login form; the
        // full reload also forces every server component to re-read the now-
        // cleared session.
        clearLogoutPending();
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
        window.location.replace(
          `${window.location.origin}${basePath}/login`,
        );
      }
    })();
  }, []);

  return (
    <IGRPTemplateLoading
      text="A terminar sessão..."
      appCode={process.env.NEXT_PUBLIC_IGRP_APP_CODE}
    />
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (exit 0).

- [ ] **Step 3: Lint the new file**

Run: `npx @biomejs/biome check "src/app/(auth)/login/logout-completion.tsx"`
Expected: no diagnostics.

- [ ] **Step 4: Commit**

```bash
git add "templates/demo-legacy/src/app/(auth)/login/logout-completion.tsx"
git commit -m "feat(template): add LogoutCompletion for deferred logout teardown"
```

---

### Task 3: Gate the login page on the marker (server)

**Files:**
- Modify: `templates/demo-legacy/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Add imports**

Replace the import block at the top (lines 1–7):

```tsx
import { getAuthProviderIdFromEnv } from "@igrp/framework-next-auth";
import { IGRPAuthCarousel, IGRPAuthForm } from "@igrp/framework-next-ui";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { carouselItems, loginConfig } from "@/config/login";
import { siteConfig } from "@/config/site";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { cn, isAuthBypass, sanitizeCallbackUrl } from "@/lib/utils";

import { LogoutCompletion } from "./logout-completion";
```

- [ ] **Step 2: Add the cookie gate after the bypass check**

Immediately after the bypass `if (isAuthBypass()) { redirect("/"); }` block (currently ending at line 22), insert:

```tsx
  // Deferred logout (Option A): the logout page set this marker and left for
  // the IdP without clearing the local session. The browser is now back on
  // /login (the IdP's redirect-back = confirmation), or the middleware backstop
  // sent us here with a still-live session. Either way, complete the teardown:
  // render LogoutCompletion (it runs signOut, clears the marker, reloads) and
  // skip the login form until that round-trip finishes.
  const cookieStore = await cookies();
  if (cookieStore.has(LOGOUT_PENDING_COOKIE)) {
    return <LogoutCompletion />;
  }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (exit 0).

- [ ] **Step 4: Lint**

Run: `npx @biomejs/biome check "src/app/(auth)/login/page.tsx"`
Expected: no diagnostics.

- [ ] **Step 5: Commit**

```bash
git add "templates/demo-legacy/src/app/(auth)/login/page.tsx"
git commit -m "feat(template): gate login page on logout_pending marker"
```

---

### Task 4: Defer signOut on the logout page

**Files:**
- Modify: `templates/demo-legacy/src/app/(auth)/logout/page.tsx`

- [ ] **Step 1: Add the `markLogoutPending` import**

Change the import on line 7 from:

```tsx
import { getLogoutUrl } from "@/actions/igrp/auth";
import { reportError } from "@/lib/report-error";
```

to:

```tsx
import { getLogoutUrl } from "@/actions/igrp/auth";
import { markLogoutPending } from "@/lib/logout-pending";
import { reportError } from "@/lib/report-error";
```

- [ ] **Step 2: Update the timeout-rationale comment block**

Replace the comment block on lines 17–29 (the `LOOKUP_TIMEOUT_MS` + `FALLBACK_TIMEOUT_MS` rationale) with:

```tsx
// Cap on the IdP end-session URL lookup (which does an OIDC discovery
// round-trip). Bounding it keeps a slow/hanging IdP from stranding the logout:
// on timeout we fall back to a local-only signOut() + navigation rather than
// waiting on the IdP redirect that may never come.
// TRADE-OFF: if your IdP's discovery latency routinely exceeds this, every
// logout degrades to local-only (the IdP SSO session then persists). Tune to
// sit just above real-world discovery latency.
const LOOKUP_TIMEOUT_MS = 3000;

// Last-resort watchdog. Covers the effect hanging after the lookup resolves —
// a hung local signOut() on the no-IdP fallback path, or a wedged form-submit
// on the IdP-POST path. MUST be greater than LOOKUP_TIMEOUT_MS.
const FALLBACK_TIMEOUT_MS = 8000;
```

- [ ] **Step 3: Replace the signOut + branch logic**

Replace everything from the `// The one step that must never be skipped` comment through the end of the `if (endSessionUrl) { … } else { … }` block (currently lines 165–211) with:

```tsx
      // We have NOT torn down the local session yet. Decide the path.
      if (settled) {
        clearTimeout(fallbackTimeout);
        console.log(
          "[logout][client] already settled before teardown — no further action",
        );
        return;
      }

      if (endSessionUrl) {
        // IdP round-trip path: DEFER the local signOut(). The IdP's redirect
        // back to /login is our confirmation, and LogoutCompletion runs
        // signOut() there. Set the marker so that landing — and the middleware
        // backstop, if the browser never returns — knows a teardown is owed.
        settled = true;
        clearTimeout(fallbackTimeout);
        markLogoutPending();
        const url = new URL(endSessionUrl);
        // Endpoint + param NAMES only — the values include id_token_hint.
        console.log("[logout][client] POSTing to IdP end-session endpoint", {
          action: `${url.origin}${url.pathname}`,
          fieldKeys: [...url.searchParams.keys()],
          postLogoutRedirectUri: url.searchParams.get(
            "post_logout_redirect_uri",
          ),
        });
        setEndSessionPost({
          action: `${url.origin}${url.pathname}`,
          fields: Object.fromEntries(url.searchParams),
        });
        return;
      }

      // No IdP round-trip possible (no token / no end_session_endpoint / lookup
      // timed out). There is nothing to confirm, so clear the local session
      // right here — exactly the previous behaviour. signOut() runs while the
      // watchdog is still armed so a hang is still covered.
      try {
        console.log(
          "[logout][client] no end-session URL — clearing local NextAuth session (signOut)…",
        );
        await signOut({ redirect: false });
        console.log("[logout][client] local signOut complete");
      } catch (error) {
        console.error("[logout][client] signOut threw", error);
        reportError(error, { segment: "(auth)/logout" });
      }

      clearTimeout(fallbackTimeout);
      console.warn(
        "[logout][client] IdP SSO session may persist; falling back to /login",
      );
      hardNavigate(buildLoginUrl());
```

Note: the `signOut` import on line 3 stays — it is still used on the no-IdP fallback path above.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (exit 0). In particular, confirm `signOut` and `markLogoutPending` are both still referenced (no unused-import error).

- [ ] **Step 5: Lint**

Run: `npx @biomejs/biome check "src/app/(auth)/logout/page.tsx"`
Expected: no diagnostics.

- [ ] **Step 6: Commit**

```bash
git add "templates/demo-legacy/src/app/(auth)/logout/page.tsx"
git commit -m "feat(template): defer logout signOut until IdP redirect-back"
```

---

### Task 5: Middleware backstop

**Files:**
- Modify: `templates/demo-legacy/src/middleware.ts`

- [ ] **Step 1: Add the import**

Change the import block (lines 1–4) from:

```tsx
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/utils";
```

to:

```tsx
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";
import { sanitizeCallbackUrl } from "@/lib/utils";
```

- [ ] **Step 2: Add the backstop after the public-path check**

Immediately after `if (isPublicPath(pathname)) return nextWithPath();` (currently line 98), insert:

```tsx

  // Logout backstop (Option A): a `logout_pending` marker means a logout left
  // for the IdP but the local session teardown is still owed (e.g. the IdP
  // never redirected back). Force the user through /login — which completes the
  // deferred signOut and clears the marker — instead of letting a still-live
  // session back into the app. /login and /api/auth/* are already past the
  // isPublicPath check above, so this only fires on protected routes and cannot
  // loop. No callbackUrl: a completed logout should land on /login, not bounce
  // back into the app.
  if (request.cookies.has(LOGOUT_PENDING_COOKIE)) {
    console.warn(
      "[logout][middleware] logout_pending marker on protected route — forcing /login to complete teardown",
      { pathname },
    );
    return withSecurityHeaders(
      NextResponse.redirect(new URL(`${BASE_PATH}/login`, request.url)),
    );
  }
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no errors (exit 0).

- [ ] **Step 4: Lint**

Run: `npx @biomejs/biome check src/middleware.ts`
Expected: no diagnostics.

- [ ] **Step 5: Commit**

```bash
git add templates/demo-legacy/src/middleware.ts
git commit -m "feat(template): force /login on logout_pending marker (backstop)"
```

---

### Task 6: Build + runtime verification

**Files:** none (verification only).

- [ ] **Step 1: Full Biome check (no write)**

Run: `npx @biomejs/biome check src`
Expected: no diagnostics across the touched files.

- [ ] **Step 2: Production build (typecheck + compile)**

Run (from repo root): `pnpm build:demo`
Expected: `next build` completes with no type errors and no missing-module errors. This is the strongest static gate available in this template.

- [ ] **Step 3: Bypass-mode smoke test (no IdP required)**

With `AUTH_PROVIDER=none` (or `IGRP_PREVIEW_MODE=true`) in `templates/demo-legacy/.env`, start the dev server (`pnpm dev:demo`) and verify via the preview tools:
- Visiting `/logout` redirects to `/` (bypass branch in middleware — unchanged).
- No `logout_pending` cookie is ever set (check `preview_eval`: `document.cookie`).
- The app shell renders with mock data.
Expected: no regression vs. current behaviour.

- [ ] **Step 4: Real-auth manual checklist (requires the live IGRP auth server)**

These cannot run without the IdP; perform them against a configured `igrp-auth` provider and record the outcome:
1. **Happy path:** log in → click logout → browser leaves for the IdP → returns to `/login` → `LogoutCompletion` spinner ("A terminar sessão...") shows briefly → form appears. Then visit a protected route → redirected to `/login` (session is gone). Confirm `[logout]` trace lines print coherently through the new ordering.
2. **IdP-fails case:** simulate no redirect-back (e.g. stop at the IdP's page / close the tab), then reopen a protected route within 5 min → middleware logs `[logout][middleware] logout_pending marker on protected route …` and redirects to `/login`, which completes teardown.
3. **No-IdP fallback:** with a session whose token can't build an end-session URL, logout still clears the local session locally and lands on `/login` (the `else` branch).

- [ ] **Step 5: Final commit (if any formatting changed during verification)**

```bash
git add -A templates/demo-legacy
git commit -m "chore(template): verification pass for confirmation-gated logout" || echo "nothing to commit"
```

---

## Notes for the implementer

- **No changeset.** `@igrp/framework-next-template` is `private: true` and ships via `publish:template` (a zip script), not npm — the repo's changeset rule applies to publishable framework packages, not this template.
- **Don't touch `dist/` or framework packages.** This change is entirely inside `templates/demo-legacy/src`.
- **Keep the debug `[logout]` logging.** The branch this lands on (`debug/logout-full-param-values`) is actively used for cross-domain logout tracing; the new log lines above are consistent with that and should stay until that debugging concludes.
- **Cookie name is defined once** in `logout-pending.ts` and imported everywhere (logout page, login page, middleware). Never hard-code the string `"logout_pending"` elsewhere.
