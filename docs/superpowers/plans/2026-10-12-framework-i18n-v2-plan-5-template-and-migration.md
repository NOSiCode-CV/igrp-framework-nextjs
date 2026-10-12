# Framework i18n v2, Plan 5 of 5: `templates/demo-v1` wiring and migration 56

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the template a working consumer of the framework i18n: configured through `igrpBuildConfig({ i18n })`, switchable from the header and the login page, with its home page migrated as the worked example, the checks wired into `build`, documentation, and a template-migrator migration so existing apps can upgrade.

**Architecture:** The template adds `src/i18n/` (config, request config, server action, catalogs, type augmentation), passes `i18n` to `igrpBuildConfig`, mounts `IGRPLocaleSwitcher` in the header `actions` slot and on the login page, drops its hand-written error copy in favour of the chrome catalog (keeping only the public-digest description), and migrates the home page to `useTranslations` / `getTranslations`. Migration 56 ships every new and changed file plus the env key; the dependencies and the script that `deps.bump` cannot add are documented as manual steps.

**Tech Stack:** Next.js 15, next-intl 4 (`createNextIntlPlugin`), Biome (template only), `@igrp/i18n-tools`, template-migrator.

**Spec:** `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (sections "templates/demo-v1", "Decisions resolved", appendix).

**Series:** Plan 1 auth/types → Plan 2 design-system → Plan 3 next-ui → Plan 4 framework-next + i18n-tools → **Plan 5 (this)**. Requires `pnpm build:framework` green after Plan 4.

## Global Constraints

- The template uses **Biome** (`pnpm lint` mutates files; run it before staging). Never ESLint/Prettier here.
- Every file that renders design-system components carries `"use client"`. Server files pass server actions and plain data to client components, never functions.
- `src/middleware.ts` imports only from `@igrp/framework-next/i18n` (Edge-safe) if it needs anything; this plan leaves it unchanged (`cookie-first`).
- The template never calls `useFormatter`; `lint:i18n` enforces it.
- No `[locale]` route segment. No `process.env` reads outside `src/i18n/index.ts` for i18n.
- Demo pages under `(igrp)/(demo)` keep their Portuguese literals; only `src/components`, `src/i18n` and the home page are under the literal check.
- Migration authoring rules: `file.write` is `mode: replace` with a full payload file; `deps.bump` only bumps declared deps (new deps are manual); run `sync:template-lock` afterwards; `check:drift` must pass.

## Review Focus

1. In preview mode (`IGRP_PREVIEW_MODE=true`) `getSessionLocale` must return `undefined` (the stub session has no `user.locale`), and the page must still render in the cookie or `Accept-Language` language. Verified in Task 8's smoke run with `curl -H 'Accept-Language: fr'`.
2. `IGRP_FORMAT_LOCALES=de-DE` must fail the first request with `IGRP_I18N_CONFIG_INVALID` rendered by `global-error.tsx`, not a blank page. Task 8.
3. `global-error.tsx` must render French when the cookie says `fr` even though no provider is mounted, with no hydration warning in the browser console. Task 8.
4. The login page switcher must change the language of the login page itself after the refresh (the page is public, so only the cookie carries the choice). Task 8.
5. `igrp-i18n check-literals` over `src/components src/i18n src/app/(igrp)/page.tsx` must pass once the home page is migrated, and must fail if a Portuguese literal is reintroduced in `home-overview.tsx`. Task 5.

---

### Task 1: Dependencies, scripts, env

**Files:**
- Modify: `templates/demo-v1/package.json`
- Modify: `templates/demo-v1/.env.example`

- [ ] **Step 1: Declare the dependencies and the script**

In `templates/demo-v1/package.json` add `"next-intl": "^4.14.0"` to `dependencies` (the app imports `next-intl` and `next-intl/plugin` directly; pnpm strict resolution needs the declaration) and `"@igrp/i18n-tools": "workspace:*"` to `devDependencies`. Scripts:

```json
"build": "pnpm lint && pnpm lint:i18n && next build --turbopack",
"lint:i18n": "igrp-i18n check-catalogs src/i18n/messages --default pt && igrp-i18n check-literals src/components src/i18n \"src/app/(igrp)/page.tsx\"",
```

Run `pnpm install` at the repo root.

- [ ] **Step 2: Document the env key**

Append to `templates/demo-v1/.env.example`, after the `# Next.js Public Configuration` block:

```bash
# ============================================
# Localisation
# ============================================
# Region-qualified tag per language, comma-separated. Drives dates, numbers,
# the design-system locale and <html lang>. Languages are fixed (pt, en, fr);
# only the region is configurable. Unset keeps pt-CV, en-GB, fr-FR.
# A tag for another language, or two tags for one language, fails at startup.
# Example: pt-PT   or   pt-AO,en-US
IGRP_FORMAT_LOCALES=
```

- [ ] **Step 3: Commit**

```bash
git add templates/demo-v1/package.json templates/demo-v1/.env.example pnpm-lock.yaml
git commit -m "chore(demo-v1): next-intl and @igrp/i18n-tools dependencies, lint:i18n script, IGRP_FORMAT_LOCALES"
```

---

### Task 2: `src/i18n/` and the config wiring

**Files:**
- Create: `templates/demo-v1/src/i18n/index.ts`
- Create: `templates/demo-v1/src/i18n/request.ts`
- Create: `templates/demo-v1/src/i18n/actions.ts`
- Create: `templates/demo-v1/src/i18n/global.d.ts`
- Create: `templates/demo-v1/src/i18n/messages/pt.json`, `en.json`, `fr.json` (initial content; Task 5 fills the `home` namespace)
- Modify: `templates/demo-v1/next.config.ts`
- Modify: `templates/demo-v1/src/igrp.template.config.ts`

**Interfaces:**
- Produces: `i18n` (the app's `IGRPI18nConfig`), `setLocale` server action, typed `AppConfig`.

- [ ] **Step 1: Write the i18n module**

`templates/demo-v1/src/i18n/index.ts`:

```ts
// Server-side i18n configuration. Imports the data layer (session), so it is
// NOT Edge-safe: middleware must import constants from
// `@igrp/framework-next/i18n` directly, never from this file.
import { igrpDefineI18n, igrpParseFormatLocales } from "@igrp/framework-next/i18n";

import { getLayoutConfig } from "@/lib/dal";

/**
 * Platform locales are fixed (pt, en, fr). The region used for formatting is
 * per deployment (`IGRP_FORMAT_LOCALES`, read here and nowhere else). No
 * `persistLocale`: the choice lives in the `IGRP_LOCALE` cookie and resolution
 * is cookie-first. An app with a profile write-back passes `persistLocale` and
 * becomes session-first; see docs/I18N.md.
 */
export const i18n = igrpDefineI18n({
  defaultLocale: "pt",
  formatLocales: igrpParseFormatLocales(process.env.IGRP_FORMAT_LOCALES),
  getSessionLocale: async () => {
    // Cached per request alongside the root layout's own read. The preview
    // stub session carries no locale, so this is undefined under bypass.
    const { session } = await getLayoutConfig();
    return session?.user?.locale;
  },
});
```

`templates/demo-v1/src/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";

import { igrpCreateRequestConfig } from "@igrp/framework-next/i18n/server";

import { i18n } from "./index";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";

// Registered by createNextIntlPlugin in next.config.ts. The locale is resolved
// per request (cookie → session → Accept-Language → default), never from the URL.
export default getRequestConfig(igrpCreateRequestConfig(i18n, { pt, en, fr }));
```

`templates/demo-v1/src/i18n/actions.ts`:

```ts
"use server";

import { igrpSetLocale, type IGRPSetLocaleResult } from "@igrp/framework-next/i18n/server";

import { i18n } from "./index";

/** Language change. Passed to `IGRPLocaleSwitcher` as its `action`. */
export async function setLocale(value: string): Promise<IGRPSetLocaleResult> {
  return igrpSetLocale(i18n, value);
}
```

`templates/demo-v1/src/i18n/global.d.ts`:

```ts
import type { IGRPLocale } from "@igrp/framework-next/i18n";
import type { IGRPFrameworkMessages } from "@igrp/framework-next/i18n/messages";

import type pt from "./messages/pt.json";

// Types `useTranslations` / `getTranslations` keys from pt.json (the complete
// catalog) plus the framework's generic namespaces: `tsc` fails on unknown keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: IGRPLocale;
    Messages: typeof pt & IGRPFrameworkMessages;
  }
}
```

Initial catalogs (Task 5 adds `home`): `templates/demo-v1/src/i18n/messages/pt.json`:

```json
{
  "app": {
    "title": "IGRP | Template Aplicações"
  }
}
```

`en.json`:

```json
{
  "app": {
    "title": "IGRP | Application Template"
  }
}
```

`fr.json`:

```json
{
  "app": {
    "title": "IGRP | Modèle d'application"
  }
}
```

- [ ] **Step 2: Wire the plugin and the config**

`templates/demo-v1/next.config.ts`: add at the top (after the `node:` and `next` imports):

```ts
import createNextIntlPlugin from "next-intl/plugin";

// next-intl WITHOUT i18n routing: no [locale] segment and no locale in URLs.
// The locale is resolved per request in src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
```

add `"@igrp/framework-next/i18n"` and `"@igrp/framework-next/i18n/client"` to `experimental.optimizePackageImports`, and change the last line to `export default withNextIntl(nextConfig);`.

`templates/demo-v1/src/igrp.template.config.ts`: `import { i18n } from "@/i18n";` and add `i18n,` to the `igrpBuildConfig({ ... })` call, right after `appInformation: getPackageJson(),`.

- [ ] **Step 3: Type-check**

Run: `pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add templates/demo-v1/src/i18n templates/demo-v1/next.config.ts templates/demo-v1/src/igrp.template.config.ts
git commit -m "feat(demo-v1): i18n configuration, request config, setLocale action and catalogs"
```

---

### Task 3: Switcher in the header and on the login page

**Files:**
- Modify: `templates/demo-v1/src/app/(igrp)/layout.tsx`
- Modify: `templates/demo-v1/src/app/(auth)/login/page.tsx`
- Modify: `templates/demo-v1/src/middleware.ts` (one comment)

- [ ] **Step 1: Header `actions` slot**

In `templates/demo-v1/src/app/(igrp)/layout.tsx` add:

```ts
import { IGRPLocaleSwitcher } from "@igrp/framework-next/i18n/client";

import { setLocale } from "@/i18n/actions";
```

and in `headerSlots`, after the `search` entry:

```tsx
            // Language selector. The server action crosses to the client
            // component as a prop; no next-auth coupling (cookie-first app).
            actions: <IGRPLocaleSwitcher action={setLocale} />,
```

- [ ] **Step 2: Login page**

In `templates/demo-v1/src/app/(auth)/login/page.tsx` add the same two imports and change the returned `<section>` to carry the switcher in its top-right corner:

```tsx
  return (
    <section className="relative flex min-h-screen flex-col md:flex-row">
      <div className="absolute top-8 right-16 z-10">
        <IGRPLocaleSwitcher action={setLocale} />
      </div>
      <div
        className={cn(
          "relative hidden w-full md:block md:w-1/2",
          "lg:order-first",
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
```

- [ ] **Step 3: Middleware note**

In `templates/demo-v1/src/middleware.ts`, after `return nextWithPath();` at the end of `handleRequest`, add nothing executable; add this comment above the final `return`:

```ts
  // i18n: this app is cookie-first (no `persistLocale`), so the middleware
  // leaves the IGRP_LOCALE cookie alone. A session-first app (one with a
  // profile write-back) ends this branch with
  //   return igrpSyncLocaleCookie(request, nextWithPath(), token.locale, i18n)
  // importing from "@igrp/framework-next/i18n" (Edge-safe), never from "@/i18n".
```

- [ ] **Step 4: Lint and type-check, commit**

Run: `pnpm --filter @igrp/framework-next-template lint && pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0.

```bash
git add "templates/demo-v1/src/app/(igrp)/layout.tsx" "templates/demo-v1/src/app/(auth)/login/page.tsx" templates/demo-v1/src/middleware.ts
git commit -m "feat(demo-v1): language switcher in the header actions slot and on the login page"
```

---

### Task 4: Error screens read the chrome catalog

**Files:**
- Delete: `templates/demo-v1/src/config/error-messages.ts`
- Create: `templates/demo-v1/src/lib/error-copy.ts`
- Modify: `templates/demo-v1/src/app/global-error.tsx`
- Modify: `templates/demo-v1/src/app/error.tsx`
- Modify: `templates/demo-v1/src/app/(igrp)/error.tsx`
- Modify: `templates/demo-v1/src/app/(auth)/error.tsx`

- [ ] **Step 1: The one resolver the template still needs**

`templates/demo-v1/src/lib/error-copy.ts`:

```ts
import type { IGRPErrorCopyResolver } from "@igrp/framework-next-ui";

import { parsePublicDigest } from "@/lib/errors";

/**
 * Platform error codes and the generic copy come from the framework's chrome
 * catalog in the current language. The only app-specific input is an
 * `AppError`'s public message, carried in `error.digest`: when present it
 * becomes the description and the catalog keeps the title.
 */
export const resolvePublicErrorCopy: IGRPErrorCopyResolver = (error) => {
  const { message } = parsePublicDigest(error.digest);
  return message ? { description: message } : undefined;
};
```

Delete `templates/demo-v1/src/config/error-messages.ts`.

- [ ] **Step 2: `global-error.tsx`**

Replace the file body (keep the leading comment block, updating its last paragraph to say the copy comes from the chrome catalog via its cookie fallback):

```tsx
"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  IGRP_DEFAULT_FORMAT_LOCALES,
  IGRP_LOCALE_COOKIE,
  igrpNormalizeLocale,
} from "@igrp/framework-next/i18n";
import { IGRPGlobalError } from "@igrp/framework-next-ui";

import { resolvePublicErrorCopy } from "@/lib/error-copy";
import { reportError } from "@/lib/report-error";

// No provider is mounted here (the failing root layout is what mounts it), so
// the document language comes from the IGRP_LOCALE cookie, read the same way
// `useIGRPChromeI18n` reads it: pt on the server, the cookie on the client.
const noopSubscribe = () => () => {};
function readCookieFormatLocale(): string {
  const entry = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${IGRP_LOCALE_COOKIE}=`));
  const locale = igrpNormalizeLocale(entry?.slice(IGRP_LOCALE_COOKIE.length + 1)) ?? "pt";
  return IGRP_DEFAULT_FORMAT_LOCALES[locale];
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang = useSyncExternalStore(
    noopSubscribe,
    readCookieFormatLocale,
    () => IGRP_DEFAULT_FORMAT_LOCALES.pt,
  );

  useEffect(() => {
    reportError(error, { segment: "global" });
  }, [error]);

  return (
    <html lang={lang}>
      <body>
        <IGRPGlobalError
          error={error}
          reset={reset}
          resolveCopy={resolvePublicErrorCopy}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: `error.tsx` and `(igrp)/error.tsx`**

In both, replace `import { resolveErrorCopy } from "@/config/error-messages";` with `import { resolvePublicErrorCopy } from "@/lib/error-copy";` and `resolveCopy={resolveErrorCopy}` with `resolveCopy={resolvePublicErrorCopy}`.

- [ ] **Step 4: `(auth)/error.tsx`**

```tsx
"use client";

// Segment-level error boundary for the `(auth)` route group — covers
// /login, /logout, and anything else rendered under the auth layout.
//
// Auth failures are the most common concrete reason a user sees this screen,
// so an error without a platform code gets the auth-scoped copy from the
// framework's `errors.auth` messages (translated) instead of the generic one.

import { useEffect } from "react";

import { IGRPSegmentError, type IGRPErrorCopyResolver } from "@igrp/framework-next-ui";
import { useTranslations } from "next-intl";

import { resolvePublicErrorCopy } from "@/lib/error-copy";
import { reportError } from "@/lib/report-error";

export default function AuthSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors.auth");

  useEffect(() => {
    reportError(error, { segment: "(auth)" });
  }, [error]);

  const resolveAuthCopy: IGRPErrorCopyResolver = (err) => {
    if ("code" in err) return resolvePublicErrorCopy(err);
    return { title: t("title"), description: t("description") };
  };

  return <IGRPSegmentError error={error} reset={reset} resolveCopy={resolveAuthCopy} />;
}
```

- [ ] **Step 5: Lint, type-check, commit**

Run: `pnpm --filter @igrp/framework-next-template lint && pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0; no remaining import of `@/config/error-messages` (grep to confirm).

```bash
git add -A templates/demo-v1/src/config templates/demo-v1/src/lib/error-copy.ts templates/demo-v1/src/app/global-error.tsx templates/demo-v1/src/app/error.tsx "templates/demo-v1/src/app/(igrp)/error.tsx" "templates/demo-v1/src/app/(auth)/error.tsx"
git commit -m "refactor(demo-v1): error screens take their copy from the chrome catalog; keep only the public-digest resolver"
```

---

### Task 5: The home page as the worked example

**Files:**
- Modify: `templates/demo-v1/src/i18n/messages/pt.json`, `en.json`, `fr.json` (add `home`)
- Modify: `templates/demo-v1/src/components/home-overview.tsx`
- Modify: `templates/demo-v1/src/app/(igrp)/page.tsx`

**Interfaces:**
- `HomeLayer` keeps `name`, `value`, `detail` as already-translated strings (the server page translates with `getTranslations("home")`); `HomeOverview` translates its own chrome with `useTranslations("home")`.

- [ ] **Step 1: Add the `home` namespace to the three catalogs**

`pt.json` (merge with the `app` key from Task 2):

```json
{
  "app": { "title": "IGRP | Template Aplicações" },
  "home": {
    "state": { "ok": "Ativo", "preview": "Pré-visualização", "error": "Requer atenção" },
    "copy": { "idle": "Copiar", "copied": "Copiado", "failed": "Copie manualmente" },
    "intro": {
      "failing": "A aplicação está a responder, mas {count, plural, one {uma camada precisa} other {# camadas precisam}} de atenção. Veja abaixo o que falhou neste pedido.",
      "preview": "A aplicação está a responder em modo de pré-visualização: sem login real e com menus de exemplo.",
      "ok": "A aplicação está a responder. Este pedido passou por todas as camadas abaixo."
    },
    "status": { "failing": "Requer atenção", "preview": "Em pré-visualização", "ok": "Operacional" },
    "version": "Versão",
    "code": "Código",
    "requestPath": {
      "title": "O caminho deste pedido",
      "failing": "{failing} de {total} {failing, plural, one {camada requer} other {camadas requerem}} atenção",
      "preview": "Modo de pré-visualização: autenticação e dados simulados",
      "ok": "{total} de {total} camadas ativas"
    },
    "nextSteps": {
      "title": "Construir o primeiro módulo",
      "subtitle": "{count} passos, da pasta ao menu",
      "step": "Passo {index}: ",
      "feature": { "title": "Escreva a funcionalidade", "body": "Componentes, ações e lógica de cada módulo ficam juntos, fora das rotas." },
      "route": { "title": "Dê-lhe uma rota", "body": "Uma página dentro de (igrp) herda a sessão, o cabeçalho e o menu lateral." },
      "guard": { "title": "Proteja a página", "body": "Sem verificação, a página fica aberta a qualquer utilizador autenticado." },
      "menu": { "title": "Coloque-a no menu", "body": "Em produção, o menu vem do Access Management. Em pré-visualização, do ficheiro de exemplo." }
    },
    "replace": {
      "title": "Substituir esta página",
      "body": "Para abrir outra página ao entrar na aplicação, defina a rota inicial no <code>.env</code> e reinicie o servidor.",
      "note": "Esta página só aparece quando a variável está vazia."
    },
    "layers": {
      "middleware": {
        "name": "Middleware",
        "valueBypass": "Deixa passar todos os pedidos",
        "valueAuth": "Exige sessão iniciada",
        "detailBypass": "A autenticação está desligada neste ambiente.",
        "detailAuth": "Pedidos sem sessão são enviados para o login."
      },
      "session": {
        "name": "Sessão",
        "valueEmpty": "Sessão sem nome de utilizador",
        "detailBypass": "Utilizador fictício de pré-visualização.",
        "detailAuth": "Iniciada com {provider}."
      },
      "accessManagement": {
        "name": "Access Management",
        "valueBypass": "Menus e aplicações de exemplo",
        "detailBypass": "Os dados vêm de src/temp, sem chamadas ao servidor.",
        "valueOk": "Ligado",
        "detailOk": "Fornece os menus, as aplicações e o utilizador.",
        "valueMissing": "Sem endereço configurado",
        "detailMissing": "Defina IGRP_ACCESS_MANAGEMENT_API no .env para carregar os menus."
      },
      "permissions": {
        "name": "Permissões",
        "valueAll": "Acesso total",
        "valueCount": "{count, plural, one {# permissão} other {# permissões}}",
        "detailBypass": "Em pré-visualização todas as verificações passam.",
        "detailOrg": "Departamento ativo: {org}.",
        "detailNoOrg": "Sem departamento ativo no token.",
        "valueError": "Não foi possível ler o token",
        "detailError": "Todas as verificações de permissão negam o acesso."
      },
      "page": { "name": "Esta página", "value": "Apresentada", "detail": "Aparece quando não há uma rota inicial definida." }
    }
  }
}
```

`en.json`:

```json
{
  "app": { "title": "IGRP | Application Template" },
  "home": {
    "state": { "ok": "Active", "preview": "Preview", "error": "Needs attention" },
    "copy": { "idle": "Copy", "copied": "Copied", "failed": "Copy manually" },
    "intro": {
      "failing": "The application is responding, but {count, plural, one {one layer needs} other {# layers need}} attention. See below what failed in this request.",
      "preview": "The application is responding in preview mode: no real sign-in and sample menus.",
      "ok": "The application is responding. This request went through every layer below."
    },
    "status": { "failing": "Needs attention", "preview": "In preview", "ok": "Operational" },
    "version": "Version",
    "code": "Code",
    "requestPath": {
      "title": "The path of this request",
      "failing": "{failing} of {total} {failing, plural, one {layer needs} other {layers need}} attention",
      "preview": "Preview mode: simulated authentication and data",
      "ok": "{total} of {total} layers active"
    },
    "nextSteps": {
      "title": "Build the first module",
      "subtitle": "{count} steps, from folder to menu",
      "step": "Step {index}: ",
      "feature": { "title": "Write the feature", "body": "Each module's components, actions and logic live together, outside the routes." },
      "route": { "title": "Give it a route", "body": "A page inside (igrp) inherits the session, the header and the sidebar." },
      "guard": { "title": "Protect the page", "body": "Without a check, the page is open to any authenticated user." },
      "menu": { "title": "Put it in the menu", "body": "In production the menu comes from Access Management. In preview, from the sample file." }
    },
    "replace": {
      "title": "Replace this page",
      "body": "To open another page when entering the application, set the home route in <code>.env</code> and restart the server.",
      "note": "This page only appears while the variable is empty."
    },
    "layers": {
      "middleware": {
        "name": "Middleware",
        "valueBypass": "Lets every request through",
        "valueAuth": "Requires a signed-in session",
        "detailBypass": "Authentication is off in this environment.",
        "detailAuth": "Requests without a session are sent to the login."
      },
      "session": {
        "name": "Session",
        "valueEmpty": "Session without a user name",
        "detailBypass": "Preview placeholder user.",
        "detailAuth": "Signed in with {provider}."
      },
      "accessManagement": {
        "name": "Access Management",
        "valueBypass": "Sample menus and applications",
        "detailBypass": "Data comes from src/temp, with no server calls.",
        "valueOk": "Connected",
        "detailOk": "Provides the menus, the applications and the user.",
        "valueMissing": "No address configured",
        "detailMissing": "Set IGRP_ACCESS_MANAGEMENT_API in .env to load the menus."
      },
      "permissions": {
        "name": "Permissions",
        "valueAll": "Full access",
        "valueCount": "{count, plural, one {# permission} other {# permissions}}",
        "detailBypass": "In preview every check passes.",
        "detailOrg": "Active department: {org}.",
        "detailNoOrg": "No active department in the token.",
        "valueError": "Could not read the token",
        "detailError": "Every permission check denies access."
      },
      "page": { "name": "This page", "value": "Rendered", "detail": "Appears when no home route is set." }
    }
  }
}
```

`fr.json`:

```json
{
  "app": { "title": "IGRP | Modèle d'application" },
  "home": {
    "state": { "ok": "Actif", "preview": "Aperçu", "error": "Attention requise" },
    "copy": { "idle": "Copier", "copied": "Copié", "failed": "Copiez manuellement" },
    "intro": {
      "failing": "L'application répond, mais {count, plural, one {une couche nécessite} other {# couches nécessitent}} votre attention. Voyez ci-dessous ce qui a échoué pour cette requête.",
      "preview": "L'application répond en mode aperçu : sans vraie connexion et avec des menus d'exemple.",
      "ok": "L'application répond. Cette requête a traversé toutes les couches ci-dessous."
    },
    "status": { "failing": "Attention requise", "preview": "En aperçu", "ok": "Opérationnel" },
    "version": "Version",
    "code": "Code",
    "requestPath": {
      "title": "Le parcours de cette requête",
      "failing": "{failing} sur {total} {failing, plural, one {couche nécessite} other {couches nécessitent}} votre attention",
      "preview": "Mode aperçu : authentification et données simulées",
      "ok": "{total} sur {total} couches actives"
    },
    "nextSteps": {
      "title": "Construire le premier module",
      "subtitle": "{count} étapes, du dossier au menu",
      "step": "Étape {index} : ",
      "feature": { "title": "Écrivez la fonctionnalité", "body": "Les composants, actions et la logique de chaque module restent ensemble, hors des routes." },
      "route": { "title": "Donnez-lui une route", "body": "Une page dans (igrp) hérite de la session, de l'en-tête et du menu latéral." },
      "guard": { "title": "Protégez la page", "body": "Sans vérification, la page est ouverte à tout utilisateur authentifié." },
      "menu": { "title": "Placez-la dans le menu", "body": "En production, le menu vient d'Access Management. En aperçu, du fichier d'exemple." }
    },
    "replace": {
      "title": "Remplacer cette page",
      "body": "Pour ouvrir une autre page à l'entrée dans l'application, définissez la route d'accueil dans <code>.env</code> et redémarrez le serveur.",
      "note": "Cette page n'apparaît que lorsque la variable est vide."
    },
    "layers": {
      "middleware": {
        "name": "Middleware",
        "valueBypass": "Laisse passer toutes les requêtes",
        "valueAuth": "Exige une session ouverte",
        "detailBypass": "L'authentification est désactivée dans cet environnement.",
        "detailAuth": "Les requêtes sans session sont envoyées vers la connexion."
      },
      "session": {
        "name": "Session",
        "valueEmpty": "Session sans nom d'utilisateur",
        "detailBypass": "Utilisateur fictif d'aperçu.",
        "detailAuth": "Ouverte avec {provider}."
      },
      "accessManagement": {
        "name": "Access Management",
        "valueBypass": "Menus et applications d'exemple",
        "detailBypass": "Les données viennent de src/temp, sans appel au serveur.",
        "valueOk": "Connecté",
        "detailOk": "Fournit les menus, les applications et l'utilisateur.",
        "valueMissing": "Aucune adresse configurée",
        "detailMissing": "Définissez IGRP_ACCESS_MANAGEMENT_API dans .env pour charger les menus."
      },
      "permissions": {
        "name": "Permissions",
        "valueAll": "Accès total",
        "valueCount": "{count, plural, one {# permission} other {# permissions}}",
        "detailBypass": "En aperçu, toutes les vérifications passent.",
        "detailOrg": "Département actif : {org}.",
        "detailNoOrg": "Aucun département actif dans le jeton.",
        "valueError": "Impossible de lire le jeton",
        "detailError": "Toutes les vérifications de permission refusent l'accès."
      },
      "page": { "name": "Cette page", "value": "Affichée", "detail": "Apparaît lorsqu'aucune route d'accueil n'est définie." }
    }
  }
}
```

- [ ] **Step 2: Run the catalog check (the failing test for this task is the literal check)**

Run: `pnpm --filter @igrp/framework-next-template lint:i18n`
Expected: `check-catalogs` passes with coverage 100/100/100; `check-literals` FAILS listing the Portuguese literals in `home-overview.tsx` and `(igrp)/page.tsx`.

- [ ] **Step 3: Migrate `home-overview.tsx`**

Add `import { useTranslations } from "next-intl";`. Delete the `STATE_LABEL` and `COPY_LABEL` constants and the `NEXT_STEPS` text (keep the paths). Replace `NEXT_STEPS` with:

```ts
/** A real sequence: each step needs the one before it. Text in `home.nextSteps.*`. */
const NEXT_STEPS = [
  { key: "feature", path: "src/app/(myapp)/_features/<módulo>/" },
  { key: "route", path: "src/app/(igrp)/<rota>/page.tsx" },
  { key: "guard", path: 'await igrpAssertAuthorize("<permissão>")' },
  { key: "menu", path: "src/temp/menus/menus.ts" },
] as const;
```

`CopyButton` gets `const t = useTranslations("home.copy");` and renders `{t(state)}`.

In `HomeOverview`, first line of the body: `const t = useTranslations("home");`. Then replace every literal:

- intro paragraph: `{failing > 0 ? t("intro.failing", { count: failing }) : previewMode ? t("intro.preview") : t("intro.ok")}`
- status pill text: `{failing > 0 ? t("status.failing") : previewMode ? t("status.preview") : t("status.ok")}`
- `Versão` → `{t("version")}`; `Código` → `{t("code")}`
- request path title → `{t("requestPath.title")}`; its subtitle → `{failing > 0 ? t("requestPath.failing", { failing, total: layers.length }) : previewMode ? t("requestPath.preview") : t("requestPath.ok", { total: layers.length })}`
- `{STATE_LABEL[layer.state]}` → `{t(`state.${layer.state}`)}`
- next-steps title → `{t("nextSteps.title")}`; subtitle → `{t("nextSteps.subtitle", { count: NEXT_STEPS.length })}`; the sr-only span → `{t("nextSteps.step", { index: index + 1 })}`; `{step.title}` → `{t(`nextSteps.${step.key}.title`)}`; `{step.body}` → `{t(`nextSteps.${step.key}.body`)}`; `key={step.title}` → `key={step.key}`
- replace aside: title → `{t("replace.title")}`; the body paragraph → `{t.rich("replace.body", { code: (chunks) => <span className="font-mono text-xs">{chunks}</span> })}`; the note → `{t("replace.note")}`.

- [ ] **Step 4: Migrate `(igrp)/page.tsx`**

Add `import { getTranslations } from "next-intl/server";`. In `Home`, before `return`: `const t = await getTranslations("home.layers");` and pass `t` into `buildLayers({ bypass, userName, claimsState, t })`. Change `buildLayers`'s parameter type to add `t: Awaited<ReturnType<typeof getTranslations<"home.layers">>>` and replace each literal with the matching key:

```ts
    {
      id: "middleware",
      icon: "ShieldCheck",
      name: t("middleware.name"),
      value: bypass ? t("middleware.valueBypass") : t("middleware.valueAuth"),
      detail: bypass ? t("middleware.detailBypass") : t("middleware.detailAuth"),
      file: "src/middleware.ts",
      state: bypass ? "preview" : "ok",
    },
    {
      id: "session",
      icon: "UserRound",
      name: t("session.name"),
      value: userName || t("session.valueEmpty"),
      detail: bypass
        ? t("session.detailBypass")
        : t("session.detailAuth", { provider: getAuthProviderIdFromEnv(process.env) }),
      file: "src/lib/dal.ts",
      state: bypass ? "preview" : "ok",
    },
    bypass
      ? { id: "access-management", icon: "Network", name: t("accessManagement.name"), value: t("accessManagement.valueBypass"), detail: t("accessManagement.detailBypass"), file: "src/igrp.template.config.ts", state: "preview" }
      : amConfigured
        ? { id: "access-management", icon: "Network", name: t("accessManagement.name"), value: t("accessManagement.valueOk"), detail: t("accessManagement.detailOk"), file: "src/igrp.template.config.ts", state: "ok" }
        : { id: "access-management", icon: "Network", name: t("accessManagement.name"), value: t("accessManagement.valueMissing"), detail: t("accessManagement.detailMissing"), file: ".env", state: "error" },
    claimsState.status === "ok"
      ? {
          id: "permissions",
          icon: "KeyRound",
          name: t("permissions.name"),
          value: claimsState.claims.isSuperAdmin
            ? t("permissions.valueAll")
            : t("permissions.valueCount", { count: claimsState.claims.permissions.length }),
          detail: bypass
            ? t("permissions.detailBypass")
            : claimsState.claims.org
              ? t("permissions.detailOrg", { org: claimsState.claims.org })
              : t("permissions.detailNoOrg"),
          file: ".igrpstudio/permissions.json",
          state: bypass ? "preview" : "ok",
        }
      : { id: "permissions", icon: "KeyRound", name: t("permissions.name"), value: t("permissions.valueError"), detail: t("permissions.detailError"), file: "src/app/(igrp)/layout.tsx", state: "error" },
    { id: "page", icon: "PanelsTopLeft", name: t("page.name"), value: t("page.value"), detail: t("page.detail"), file: "src/app/(igrp)/page.tsx", state: "ok" },
```

Also update the comment in `Home` that mentions `src/config/error-messages.ts` to "copy lookup by `code` in the framework's chrome catalog".

- [ ] **Step 5: Run the checks**

Run: `pnpm --filter @igrp/framework-next-template lint && pnpm --filter @igrp/framework-next-template lint:i18n && pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: all exit 0. Then reintroduce one literal (`<p>Olá</p>` in `home-overview.tsx`), run `lint:i18n`, confirm it fails, and revert.

- [ ] **Step 6: Commit**

```bash
git add templates/demo-v1/src/i18n/messages templates/demo-v1/src/components/home-overview.tsx "templates/demo-v1/src/app/(igrp)/page.tsx"
git commit -m "feat(demo-v1): home page translated in pt, en and fr as the i18n worked example"
```

---

### Task 6: Documentation

**Files:**
- Create: `templates/demo-v1/docs/I18N.md`
- Modify: `templates/demo-v1/CLAUDE.md`
- Modify: `templates/demo-v1/docs/ENVIRONMENT.md` (one row for `IGRP_FORMAT_LOCALES`, in the same table format the file uses)

- [ ] **Step 1: Write `docs/I18N.md`**

```md
# Internationalisation (i18n)

The template uses **next-intl 4 without i18n routing** through `@igrp/framework-next/i18n`: the locale is resolved per request and never appears in the URL.

## Model

| Concept | Value |
|---|---|
| Platform locales | `pt`, `en`, `fr`. Fixed; an app may enable fewer (`locales` in `src/i18n/index.ts`). |
| Default locale | `pt`. Its catalog (`messages/pt.json`) is complete and types every key. |
| Format locales | `pt-CV`, `en-GB`, `fr-FR` by default; per deployment via `IGRP_FORMAT_LOCALES`. Drive dates, numbers, the design-system locale and `<html lang>`. |
| Resolution | **cookie-first**: `IGRP_LOCALE` cookie → `session.user.locale` → `Accept-Language` → default. An app that persists the choice (`persistLocale`) becomes **session-first**; see the framework spec. |

## Where each piece lives

| File | Role |
|---|---|
| `src/i18n/index.ts` | `igrpDefineI18n(...)`: locales, format locales from the env, `getSessionLocale`. Server-only (reads the session). |
| `src/i18n/request.ts` | next-intl request config, registered by `createNextIntlPlugin` in `next.config.ts`. |
| `src/i18n/actions.ts` | `setLocale` server action, passed to `IGRPLocaleSwitcher`. |
| `src/i18n/global.d.ts` | Types `useTranslations` keys from `pt.json` plus the framework namespaces. |
| `src/i18n/messages/{pt,en,fr}.json` | App catalogs. One top-level namespace per feature, nested camelCase keys, ICU. |
| `src/igrp.template.config.ts` | `igrpBuildConfig({ i18n })`: the framework resolves the locale, mounts the providers and sets `<html lang>`. |

The framework ships the `common`, `i18n` and `errors` namespaces, the design-system catalog and the chrome catalog (header, menus, error screens, platform error codes) in all three languages. App keys may shadow framework keys.

## Using it

```tsx
"use client";
import { useTranslations } from "next-intl";
const t = useTranslations("home");
<h2>{t("requestPath.title")}</h2>
```

```ts
import { getTranslations } from "next-intl/server";
const t = await getTranslations("home.layers");
```

Dates, numbers and sorting: `useIGRPFormat()` from `@igrp/framework-next/i18n/client` in client components; `igrpFormatDate(value, formatLocale)` from `@igrp/framework-next/i18n` on the server with `await igrpResolveFormatLocale(i18n)`. Never `useFormatter` from next-intl and never a hardcoded region: `pnpm lint:i18n` rejects both.

Zod schemas take a translator (`(key) => string`) instead of literals; enum codes from the API map to keys in a small per-feature `lib/i18n.ts`.

## Changing the language

`IGRPLocaleSwitcher` is mounted in the header `actions` slot and on the login page. It calls `setLocale`, which validates, writes the `IGRP_LOCALE` cookie (path `/`, one year, shared by every IGRP app on the host) and refreshes the server tree. `global-error.tsx` renders outside every provider and reads the cookie itself.

## Checks

`pnpm lint:i18n` (also in `build`): `igrp-i18n check-catalogs` (orphan keys, invalid ICU, argument parity with `pt`, camelCase segments, coverage) and `igrp-i18n check-literals` over the migrated folders. Add a folder to the script when you migrate it; the `(demo)` pages are not migrated.

## Adding a key

1. Add it to `pt.json`. 2. Use it (`tsc` rejects unknown keys). 3. Translate in `en.json` / `fr.json` with the same ICU arguments; partial files are fine, missing keys fall back to `pt`.
```

- [ ] **Step 2: Update `CLAUDE.md`**

In `templates/demo-v1/CLAUDE.md`, under "Layout composition", replace the bullet claiming `src/app/layout.tsx` mounts `IGRPRootProviders` with:

```md
- `src/app/layout.tsx` mounts `IGRPRootLayout`, which renders `<html lang>`, `IGRPNestedProviders` (session, tooltip, theme, session watcher) and, because `igrpBuildConfig({ i18n })` is set, `IGRPIntlProvider` (next-intl + design-system + chrome catalogs for the resolved locale).
```

Add to "Your expertise": "**i18n** — next-intl without routing through `@igrp/framework-next/i18n`; cookie-first resolution; `pnpm lint:i18n`. Read `docs/I18N.md` before touching user-visible text." And to "Hard rules unique to this template": "**User-visible text in migrated folders comes from `src/i18n/messages`**, never literals; dates and numbers go through `useIGRPFormat()` / `igrpFormatDate`. `pnpm lint:i18n` enforces both and runs in `build`."

- [ ] **Step 3: Commit**

```bash
git add templates/demo-v1/docs/I18N.md templates/demo-v1/CLAUDE.md templates/demo-v1/docs/ENVIRONMENT.md
git commit -m "docs(demo-v1): i18n guide, env key, CLAUDE.md pointers"
```

---

### Task 7: D-5 verification: does the IdP emit the `locale` claim?

**Files:**
- Modify: `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (the D-5 line, with the finding)

- [ ] **Step 1: Observe a real sign-in**

Against a development IdP (`AUTH_PROVIDER=igrp-auth` with real credentials in `templates/demo-v1/.env`), temporarily add to `templates/demo-v1/src/lib/auth-instance.ts` a `callbacks.jwt` extension:

```ts
  callbacks: {
    jwt: async (params, token) => {
      if (params.account) console.info("[d5] profile claims:", Object.keys(params.profile ?? {}), "locale:", (params.profile as { locale?: unknown })?.locale);
      return token;
    },
    redirect: redirectWithBasePath,
  },
```

Run `pnpm dev:demo`, sign in, read the server log line. Remove the extension afterwards (do not commit it).

- [ ] **Step 2: Record the finding**

Edit the D-5 bullet in the spec to one of:

- "Verified 2026-MM-DD against `<issuer>`: the ID token carries `locale` = `<value>`." or
- "Verified 2026-MM-DD against `<issuer>`: no `locale` claim. Resolution falls through to the cookie; the Access Management team owns adding the claim (profile scope / token customiser)."

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md
git commit -m "docs(i18n): record the D-5 locale-claim verification"
```

---

### Task 8: Build and smoke the template

- [ ] **Step 1: Build**

Run: `pnpm build:framework && pnpm build:demo`
Expected: exit 0 (`lint`, `lint:i18n`, `next build`).

- [ ] **Step 2: Smoke in preview mode**

With `IGRP_PREVIEW_MODE=true` in `templates/demo-v1/.env`, run `pnpm dev:demo` and, from another shell (adjust the port and basePath the dev banner prints):

```bash
curl -s -H 'Accept-Language: fr' http://localhost:3000/apps/template/ | grep -o '<html[^>]*lang="[^"]*"'
```

Expected: `lang="fr-FR"`, and the page body contains "Le parcours de cette requête".

```bash
curl -s -H 'Cookie: IGRP_LOCALE=en' -H 'Accept-Language: fr' http://localhost:3000/apps/template/ | grep -o 'The path of this request'
```

Expected: the cookie wins (`cookie-first`).

In the browser: open the app, use the header switcher to pick English, confirm the header (user menu "Sign out"), the home page and the design-system strings change together, and the console shows no hydration warning. Open `/login` with `IGRP_PREVIEW_MODE=false` and a valid IdP, switch the language there, confirm the login page re-renders in that language.

- [ ] **Step 3: Smoke the failure modes**

Set `IGRP_FORMAT_LOCALES=de-DE`, reload: the global error screen shows the generic copy with a reference id (the `IGRP_I18N_CONFIG_INVALID` code has no catalog entry, so the fallback pair appears) and the server log names the bad tag. Set `IGRP_LOCALE=fr` as a cookie in the browser, trigger the global error (keep the bad env): the screen is in French with `<html lang="fr-FR">`. Restore the env.

- [ ] **Step 4: Commit any fix, then proceed**

---

### Task 9: Versions, migration 56, template lock

**Files:**
- Create: `packages/framework/template-migrator/migrations/demo-v1/56.MIGRATIONS-<DDMMYYYY>.md`
- Create: `packages/framework/template-migrator/migrations/demo-v1/payload/56/...` (copies of every new and changed template file)
- Modify: `templates/demo-v1/.igrp-migrations-lock.json` (via `sync:template-lock`)

- [ ] **Step 1: Materialise the package versions**

Run: `pnpm release:version`
Expected: the five changesets from Plans 1 to 4 bump `@igrp/framework-next-auth`, `@igrp/framework-next-types`, `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`, `@igrp/framework-next` and `@igrp/i18n-tools` by one beta each and update their CHANGELOGs. Note each new version from its `package.json` (`node -e "console.log(require('./packages/framework/next/package.json').version)"` etc.). If `@igrp/i18n-tools` is rejected, add it to `.changeset/pre.json` `initialVersions` as `"0.2.0-beta.0"` and rerun.

Commit: `git add -A .changeset packages/*/package.json packages/framework/*/package.json packages/*/CHANGELOG.md packages/framework/*/CHANGELOG.md && git commit -m "chore: version packages"`.

- [ ] **Step 2: Copy the payload**

From the repo root, copy each file below from `templates/demo-v1/` to `packages/framework/template-migrator/migrations/demo-v1/payload/56/` at the same relative path:

```
next.config.ts
src/igrp.template.config.ts
src/i18n/index.ts
src/i18n/request.ts
src/i18n/actions.ts
src/i18n/global.d.ts
src/i18n/messages/pt.json
src/i18n/messages/en.json
src/i18n/messages/fr.json
src/lib/error-copy.ts
src/middleware.ts
src/app/(igrp)/layout.tsx
src/app/(igrp)/page.tsx
src/app/(auth)/login/page.tsx
src/app/global-error.tsx
src/app/error.tsx
src/app/(igrp)/error.tsx
src/app/(auth)/error.tsx
src/components/home-overview.tsx
docs/I18N.md
```

- [ ] **Step 3: Write the migration**

`packages/framework/template-migrator/migrations/demo-v1/56.MIGRATIONS-<DDMMYYYY>.md` (replace the `<…>` versions with the ones noted in Step 1 and the date with today's):

```md
---
id: 56-i18n
date: <YYYY-MM-DD>
targetFrameworkVersion: <framework-next version>
requires: ["55-framework-0-2-0-beta-6"]
steps:
  - type: deps.bump
    manifest: package.json
    ranges:
      "@igrp/framework-next": "<version>"
      "@igrp/framework-next-auth": "<version>"
      "@igrp/framework-next-types": "<version>"
      "@igrp/framework-next-ui": "<version>"
      "@igrp/igrp-framework-react-design-system": "<version>"
  - type: env.add
    file: .env.example
    keys:
      IGRP_FORMAT_LOCALES: { doc: "Region per language for dates, numbers and <html lang>, comma-separated (e.g. pt-PT or pt-AO,en-US). Unset keeps pt-CV, en-GB, fr-FR." }
  - type: file.create
    path: src/i18n/index.ts
    from: payload/56/src/i18n/index.ts
  - type: file.create
    path: src/i18n/request.ts
    from: payload/56/src/i18n/request.ts
  - type: file.create
    path: src/i18n/actions.ts
    from: payload/56/src/i18n/actions.ts
  - type: file.create
    path: src/i18n/global.d.ts
    from: payload/56/src/i18n/global.d.ts
  - type: file.create
    path: src/i18n/messages/pt.json
    from: payload/56/src/i18n/messages/pt.json
  - type: file.create
    path: src/i18n/messages/en.json
    from: payload/56/src/i18n/messages/en.json
  - type: file.create
    path: src/i18n/messages/fr.json
    from: payload/56/src/i18n/messages/fr.json
  - type: file.create
    path: src/lib/error-copy.ts
    from: payload/56/src/lib/error-copy.ts
  - type: file.create
    path: docs/I18N.md
    from: payload/56/docs/I18N.md
  - type: file.delete
    path: src/config/error-messages.ts
  - type: file.write
    path: next.config.ts
    mode: replace
    from: payload/56/next.config.ts
  - type: file.write
    path: src/igrp.template.config.ts
    mode: replace
    from: payload/56/src/igrp.template.config.ts
  - type: file.write
    path: src/middleware.ts
    mode: replace
    from: payload/56/src/middleware.ts
  - type: file.write
    path: src/app/(igrp)/layout.tsx
    mode: replace
    from: "payload/56/src/app/(igrp)/layout.tsx"
  - type: file.write
    path: src/app/(igrp)/page.tsx
    mode: replace
    from: "payload/56/src/app/(igrp)/page.tsx"
  - type: file.write
    path: src/app/(auth)/login/page.tsx
    mode: replace
    from: "payload/56/src/app/(auth)/login/page.tsx"
  - type: file.write
    path: src/app/global-error.tsx
    mode: replace
    from: payload/56/src/app/global-error.tsx
  - type: file.write
    path: src/app/error.tsx
    mode: replace
    from: payload/56/src/app/error.tsx
  - type: file.write
    path: src/app/(igrp)/error.tsx
    mode: replace
    from: "payload/56/src/app/(igrp)/error.tsx"
  - type: file.write
    path: src/app/(auth)/error.tsx
    mode: replace
    from: "payload/56/src/app/(auth)/error.tsx"
  - type: file.write
    path: src/components/home-overview.tsx
    mode: replace
    from: payload/56/src/components/home-overview.tsx
---

# 56 — Internationalisation: framework i18n, language switcher, chrome catalog

## What changed

| Dependency | To |
| --- | --- |
| `@igrp/framework-next` | `<version>` |
| `@igrp/framework-next-auth` | `<version>` |
| `@igrp/framework-next-types` | `<version>` |
| `@igrp/framework-next-ui` | `<version>` |
| `@igrp/igrp-framework-react-design-system` | `<version>` |

| File | Change |
| --- | --- |
| `src/i18n/**` | new: `igrpDefineI18n` config, next-intl request config, `setLocale` action, catalogs, typed keys |
| `next.config.ts` | `createNextIntlPlugin("./src/i18n/request.ts")`; i18n subpaths in `optimizePackageImports` |
| `src/igrp.template.config.ts` | `igrpBuildConfig({ i18n })` |
| `src/app/(igrp)/layout.tsx` | `IGRPLocaleSwitcher` in the header `actions` slot |
| `src/app/(auth)/login/page.tsx` | `IGRPLocaleSwitcher` on the login page |
| `src/app/global-error.tsx`, `error.tsx`, `(igrp)/error.tsx`, `(auth)/error.tsx` | copy comes from the framework chrome catalog; `src/lib/error-copy.ts` keeps only the public-digest description |
| `src/config/error-messages.ts` | removed |
| `src/components/home-overview.tsx`, `src/app/(igrp)/page.tsx` | translated (`home` namespace), the worked example |
| `src/middleware.ts` | comment only (cookie-first apps need no change) |
| `docs/I18N.md` | new guide |
| `.env.example` | `IGRP_FORMAT_LOCALES` |

## Manual steps (deps.bump cannot add what the app did not declare)

1. `package.json`: add `"next-intl": "^4.14.0"` to `dependencies` and `"@igrp/i18n-tools": "<i18n-tools version>"` to `devDependencies`.
2. `package.json` scripts: add `"lint:i18n": "igrp-i18n check-catalogs src/i18n/messages --default pt && igrp-i18n check-literals src/components src/i18n \"src/app/(igrp)/page.tsx\""` and prepend `pnpm lint:i18n &&` to `next build` in `build` (after `pnpm lint`).
3. `pnpm install`.

## Why

Every IGRP app now shares one locale (`IGRP_LOCALE` cookie, path `/`), one resolution order and three complete string sets: the design system, the template chrome (header, menus, error screens, platform error codes) and the app's own messages. Picking English in one app no longer leaves half the screen in Portuguese. Design: `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` in the framework repository.

## ⚠️ If you customised these files

- `src/app/(igrp)/layout.tsx` and `src/app/(auth)/login/page.tsx` are replaced; re-apply your own slots and layout around the `IGRPLocaleSwitcher` lines.
- `src/components/home-overview.tsx` and `src/app/(igrp)/page.tsx` are replaced; if you already replaced the home page, drop these two steps from your apply or restore your files afterwards.
- Anything importing `@/config/error-messages` must import `resolvePublicErrorCopy` from `@/lib/error-copy` or rely on the framework defaults (`IGRPSegmentError` / `IGRPGlobalError` need no `resolveCopy` for platform codes).
- Your own feature strings are untouched. Migrate a folder at a time and add it to `lint:i18n` when done.
```

- [ ] **Step 4: Sync the lock and run the drift gate**

Run: `pnpm --filter @igrp/template-migrator sync:template-lock && pnpm --filter @igrp/template-migrator typecheck && pnpm --filter @igrp/template-migrator test && pnpm --filter @igrp/template-migrator check:drift`
Expected: exit 0. If `check:drift` lists an orphan file, it is a template file this migration did not cover: add a `file.create` step and its payload rather than touching `template-baseline.json`.

- [ ] **Step 5: Commit**

```bash
git add packages/framework/template-migrator/migrations/demo-v1 templates/demo-v1/.igrp-migrations-lock.json
git commit -m "chore(migrations): add migration 56 for framework i18n"
```

---

### Task 10: Release

- [ ] **Step 1: Follow the repo's release command**

Run the `/release-framework` workflow (or, by hand and in dependency order, each package's `release` script: `framework-next-auth`, `framework-next-types`, `design-system`, `framework-next-ui`, `framework-next`, `i18n-tools`, then `template-migrator`), verifying the registry state first as `.claude/shared/hard-rules.md` requires. Then `pnpm release:demo` for the template zip.

- [ ] **Step 2: Hand-off to the application center**

The application-center migration is a separate plan; its deltas are the appendix of the spec. Its first step is bumping to the versions released here.

---

## Self-review

- Spec coverage ("templates/demo-v1"): `next-intl` dependency and `@igrp/i18n-tools` dev dependency; `lint:i18n` in `build`; `src/i18n/index.ts` with env-parsed format locales and `getSessionLocale` reading `session.user.locale` through the cached layout config; `request.ts`; `actions.ts`; `global.d.ts`; catalogs; plugin and `optimizePackageImports`; `igrpBuildConfig({ i18n })`; root layout untouched; switcher in `actions` and on login; middleware unchanged with the session-first note; `error-messages.ts` deleted and the error screens on the catalog; `global-error` cookie-driven `lang`; preview mode without session locale; `.env.example`; `docs/I18N.md`; `CLAUDE.md` fix; migration with every file, `env.add`, `deps.bump`, manual deps and script; `sync:template-lock`; `check:drift`. D-5 verification is Task 7.
- Type consistency: `setLocale(value: string): Promise<IGRPSetLocaleResult>` matches `IGRPLocaleSwitcher.action`; `resolvePublicErrorCopy: IGRPErrorCopyResolver` matches Plan 3; `igrpCreateRequestConfig(i18n, { pt, en, fr })` matches Plan 4; the `home` keys used in Task 5 exist in all three catalogs (plural arguments `count`, `failing`, `total`, `index`, `provider`, `org`).
- Review Focus 1 to 4 are exercised in Task 8's smoke steps; 5 in Task 5 Step 5.
