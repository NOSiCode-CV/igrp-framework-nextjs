import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";

/**
 * Mock menu catalogue used in preview / auth-bypass mode (`IGRP_PREVIEW_MODE=true`
 * or `AUTH_PROVIDER=none`). It is a flat list — the sidebar renderer
 * (`IGRPTemplateMenus` in `@igrp/framework-next-ui`) turns it into a tree using
 * `parentCode` and `position`, then dispatches on `type`.
 *
 * ── Menu types (`IGRPMenuType`) ────────────────────────────────────────────────
 *  • GROUP        Top-level labeled section header. Its children (items whose
 *                 `parentCode` points at the group's `code`) render underneath the
 *                 label. A GROUP itself is never a link.
 *  • FOLDER       Collapsible folder. Its children render as leaf links inside it.
 *                 Folder children are always flattened to leaves (no deep nesting).
 *  • MENU_PAGE    Internal app page. Navigates via `pageSlug` (preferred) or `url`.
 *  • EXTERNAL_PAGE External link — set `url` + `target: "_blank"`.
 *  • SYSTEM_PAGE  Framework/system page. Rendered as a normal leaf link.
 *
 * ── Field rules ────────────────────────────────────────────────────────────────
 *  • `position`     ascending sort order within the same level.
 *  • `status`       only "ACTIVE" items render; "INACTIVE"/"DELETED" are dropped.
 *  • `parentCode`   null/unknown → top-level; otherwise nests under that `code`.
 *  • href           `pageSlug` wins over `url`; absolute/external `url` opens as a
 *                   real anchor, internal `pageSlug` routes via Next.js.
 *  • `icon`         any lucide icon name (string).
 *  • `roles`        role/department gating; empty array = visible to everyone.
 */
export const IGRP_DEFAULT_MENU: IGRPMenuItemArgs[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // 1. Top-level MENU_PAGE (no parent, no group) — a plain internal page link.
  //    Lives in the implicit unlabeled section at the top of the sidebar.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    code: "DASHBOARD",
    name: "Dashboard",
    type: "MENU_PAGE",
    position: 0,
    icon: "LayoutDashboard",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "dashboard",
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Top-level MENU_PAGE addressed by absolute internal `url` instead of slug.
  //    Use this when the page lives outside the slug-based router convention.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 2,
    code: "REPORTS",
    name: "Relatórios",
    type: "MENU_PAGE",
    position: 1,
    icon: "ChartColumn",
    status: "ACTIVE",
    target: "_self",
    url: "/reports",
    pageSlug: null,
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Top-level EXTERNAL_PAGE — opens an external site in a new tab.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 3,
    code: "IGRP_WEBSITE",
    name: "Portal IGRP",
    type: "EXTERNAL_PAGE",
    position: 2,
    icon: "ExternalLink",
    status: "ACTIVE",
    target: "_blank",
    url: "https://igrp.cv",
    pageSlug: null,
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 4. FOLDER + its leaf children.
  //    The folder is a collapsible group of links; children reference it by
  //    `parentCode: "ADMIN_FOLDER"`.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 10,
    code: "ADMIN_FOLDER",
    name: "Administração",
    type: "FOLDER",
    position: 3,
    icon: "Settings",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: null,
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },
  {
    id: 11,
    code: "ADMIN_USERS",
    name: "Utilizadores",
    type: "MENU_PAGE",
    position: 0,
    icon: "Users",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "admin/users",
    parentCode: "ADMIN_FOLDER",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  {
    id: 12,
    code: "ADMIN_ROLES",
    name: "Perfis & Permissões",
    type: "MENU_PAGE",
    position: 1,
    icon: "ShieldCheck",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "admin/roles",
    parentCode: "ADMIN_FOLDER",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  {
    id: 13,
    code: "ADMIN_AUDIT_LOG",
    name: "Registo de Auditoria",
    type: "EXTERNAL_PAGE",
    position: 2,
    icon: "FileClock",
    status: "ACTIVE",
    target: "_blank",
    url: "https://audit.example.cv/logs",
    pageSlug: null,
    parentCode: "ADMIN_FOLDER",
    applicationCode: "APP_DEMO",
    roles: [],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 5. GROUP — a labeled section header — containing both a FOLDER and leaves.
  //    GROUP children can themselves be FOLDERs, MENU_PAGEs, etc.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 20,
    code: "GRP_OPERATIONS",
    name: "Operações",
    type: "GROUP",
    position: 4,
    icon: "Workflow",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: null,
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },
  // 5a. A MENU_PAGE directly under the group.
  {
    id: 21,
    code: "OPS_ORDERS",
    name: "Pedidos",
    type: "MENU_PAGE",
    position: 0,
    icon: "ClipboardList",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "operations/orders",
    parentCode: "GRP_OPERATIONS",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  // 5b. A FOLDER nested inside the group, with its own leaf children.
  {
    id: 22,
    code: "OPS_INVENTORY_FOLDER",
    name: "Inventário",
    type: "FOLDER",
    position: 1,
    icon: "Boxes",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: null,
    parentCode: "GRP_OPERATIONS",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  {
    id: 23,
    code: "OPS_STOCK",
    name: "Stock",
    type: "MENU_PAGE",
    position: 0,
    icon: "Package",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "operations/inventory/stock",
    parentCode: "OPS_INVENTORY_FOLDER",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  {
    id: 24,
    code: "OPS_SUPPLIERS",
    name: "Fornecedores",
    type: "MENU_PAGE",
    position: 1,
    icon: "Truck",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "operations/inventory/suppliers",
    parentCode: "OPS_INVENTORY_FOLDER",
    applicationCode: "APP_DEMO",
    roles: [],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 6. A second GROUP — demonstrates multiple labeled sections in one sidebar.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 30,
    code: "GRP_SYSTEM",
    name: "Sistema",
    type: "GROUP",
    position: 5,
    icon: "Server",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: null,
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },
  // 6a. SYSTEM_PAGE — a framework/system page, rendered as a leaf link.
  {
    id: 31,
    code: "SYS_SETTINGS",
    name: "Definições do Sistema",
    type: "SYSTEM_PAGE",
    position: 0,
    icon: "Cog",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "system/settings",
    parentCode: "GRP_SYSTEM",
    applicationCode: "APP_DEMO",
    roles: [],
  },
  // 6b. Role-gated MENU_PAGE — only visible to users with the matching role in
  //     the given department (empty `roles` would make it visible to everyone).
  {
    id: 32,
    code: "SYS_CONFIG",
    name: "Configuração Avançada",
    type: "MENU_PAGE",
    position: 1,
    icon: "SlidersHorizontal",
    status: "ACTIVE",
    target: "_self",
    url: null,
    pageSlug: "system/config",
    parentCode: "GRP_SYSTEM",
    applicationCode: "APP_DEMO",
    roles: [{ roleCode: "ADMIN", departmentCode: "IT" }],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // 7. INACTIVE item — present in the data but filtered out by the renderer.
  //    Useful to show how status gating behaves; this will NOT appear.
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 40,
    code: "LEGACY_PAGE",
    name: "Página Legada (oculta)",
    type: "MENU_PAGE",
    position: 6,
    icon: "Archive",
    status: "INACTIVE",
    target: "_self",
    url: null,
    pageSlug: "legacy",
    parentCode: null,
    applicationCode: "APP_DEMO",
    roles: [],
  },
];
