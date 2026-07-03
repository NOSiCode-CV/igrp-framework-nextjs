import type { IGRPApplicationArgs } from "@igrp/framework-next-types";

/**
 * Mock application catalogue used in preview / auth-bypass mode
 * (`IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`). It feeds the app switcher
 * (`IGRPTemplateAppSwitcher` in `@igrp/framework-next-ui`).
 *
 * ── Application types (`IGRPApplicationType`) ──────────────────────────────────
 *  • INTERNAL  An app served by this IGRP deployment. Navigates via `slug`
 *              (resolved against the current origin) unless `url` is set.
 *  • EXTERNAL  A separate system. Always navigates to its absolute `url`.
 *  • SYSTEM    A framework/system app (e.g. access management, app center).
 *
 * ── Field rules ────────────────────────────────────────────────────────────────
 *  • `code`         unique key; matches a menu item's `applicationCode` and is
 *                   what the switcher's `appCode` prop selects as the active app.
 *  • href           `url` wins; otherwise `<origin>/<slug>`; otherwise `<origin>`.
 *  • `picture`       avatar shown in the switcher; empty/null falls back to an icon.
 *  • `description`   subtitle under the app name in the switcher.
 *  • `status`        lifecycle flag ("ACTIVE" | "INACTIVE" | "DELETED").
 *  • `departments`   department codes the app belongs to.
 *
 * The first app (`APP_DEMO`) is the active one and owns the menus defined in
 * `src/temp/menus/menus.ts` (their `applicationCode` is `APP_DEMO`).
 */
export const IGRP_MOCK_APPS_DATA: IGRPApplicationArgs[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // 1. Primary INTERNAL app — slug-based, ties to the mock menus via APP_DEMO.
  //    Resolves to `<origin>/demo`.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    code: "APP_DEMO",
    name: "Demo App",
    description: "Aplicação de demonstração",
    status: "ACTIVE",
    type: "INTERNAL",
    owner: "superadmin",
    picture: "",
    url: null,
    slug: "demo",
    departments: ["DEPT_IGRP"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 2. INTERNAL app with a `picture` — the switcher renders the image instead of
  //    the default icon.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 2,
    code: "APP_HR",
    name: "Recursos Humanos",
    description: "Gestão de pessoal",
    status: "ACTIVE",
    type: "INTERNAL",
    owner: "superadmin",
    picture: "https://avatar.vercel.sh/hr.png",
    url: null,
    slug: "hr",
    departments: ["DEPT_HR"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 3. EXTERNAL app — always navigates to its absolute `url` (slug ignored).
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 3,
    code: "APP_PORTAL",
    name: "Portal IGRP",
    description: "Site institucional",
    status: "ACTIVE",
    type: "EXTERNAL",
    owner: "superadmin",
    picture: "",
    url: "https://igrp.cv",
    departments: ["DEPT_IGRP"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 4. SYSTEM app — a framework-level app (e.g. access management).
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 4,
    code: "APP_ACCESS_MGMT",
    name: "Gestão de Acessos",
    description: "Administração de utilizadores e perfis",
    status: "ACTIVE",
    type: "SYSTEM",
    owner: "superadmin",
    picture: "",
    url: null,
    slug: "access-management",
    departments: ["DEPT_IGRP"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 5. INACTIVE app — present in the catalogue but flagged out of service.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 5,
    code: "APP_LEGACY",
    name: "App Legada",
    description: "Descontinuada",
    status: "INACTIVE",
    type: "INTERNAL",
    owner: "superadmin",
    picture: "",
    url: null,
    slug: "legacy",
    departments: ["DEPT_IGRP"],
  },
];
