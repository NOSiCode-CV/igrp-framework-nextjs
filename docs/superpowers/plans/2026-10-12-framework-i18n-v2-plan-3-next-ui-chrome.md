# Framework i18n v2, Plan 3 of 5: `framework-next-ui` chrome catalog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put every user-visible chrome string (header, sidebar, user menu, auth screens, error, forbidden and not-found screens, platform error copy) into one typed catalog in three languages, selected through a context with a cookie fallback, while every existing label prop keeps working.

**Architecture:** `src/i18n/strings.ts` owns `IGRPChromeStrings` and the Portuguese catalog; `strings.en.ts` and `strings.fr.ts` the other two, pinned by a parity test. `IGRPChromeI18nProvider` supplies a catalog; `useIGRPChromeI18n()` returns it, or, with no provider, the catalog for the `IGRP_LOCALE` cookie on the client and Portuguese on the server (via `useSyncExternalStore`, so hydration never mismatches). Components read the hook for their defaults; props still win. Error screens get a default copy resolver keyed by platform error code. The existing `*_LABELS_PT_PT` exports become deprecated aliases into the Portuguese catalog.

**Tech Stack:** React 19, TypeScript 6, Vitest 5 (`node` env, `// @vitest-environment jsdom` per file), `react-dom/client` + `act` for DOM tests, Babel build, ESLint + Prettier.

**Spec:** `docs/superpowers/specs/2026-10-12-framework-i18n-v2-design.md` (section "framework-next-ui").

**Series:** Plan 1 auth/types → Plan 2 design-system → **Plan 3 (this)** → Plan 4 framework-next + i18n-tools → Plan 5 template + migration.

## Global Constraints

- The barrel `src/index.ts` carries no `'use client'`; the directive lives on each client leaf (`context.tsx` here). Pure data modules (`strings*.ts`, `catalogs.ts`, `cookie.ts`, `error-copy.ts`) carry no directive and import nothing client-only. `src/__tests__/client-boundaries.test.ts` enforces this.
- Explicit named exports in the barrel, no wildcards, no aliasing.
- Relative imports carry `.js`.
- This package must not import `@igrp/framework-next` (it is below it). The cookie name is declared here (`IGRP_LOCALE_COOKIE`) and Plan 4 asserts equality with its own constant.
- Strings keep the `{token}` format; `igrpFormatMessage` from the design system substitutes them. No plurals: `resultCountOne` / `resultCountOther` stay two keys as today.
- ESLint + Prettier before commit. Changeset `patch` for `@igrp/framework-next-ui`.
- Theme option names (`IGRP_DEFAULT_THEMES[].name`) are data passed by the consumer and stay out of the catalog.

## Review Focus

1. `useIGRPChromeI18n()` with no provider and a cookie `IGRP_LOCALE=fr-FR` (a regional tag, not a bare code) must resolve the French catalog. Test in Task 2.
2. With no provider and a cookie holding an unsupported value (`de`) or no cookie, it must resolve Portuguese, never throw. Test in Task 2.
3. A consumer `resolveCopy` that returns only `{ description }` (the template's AppError digest case) must keep the catalog title. Test in Task 3.
4. An error carrying an unknown `code` string must fall back to the generic copy, not to `undefined` text. Test in Task 3.
5. Passing `labels={{ profile: 'Profile' }}` to `IGRPTemplateNavUser` inside a French provider must render the English `profile` and the French `logout`: prop over context over default. Test in Task 4.

---

### Task 1: The chrome catalog in three languages

**Files:**
- Create: `packages/framework/next-ui/src/i18n/strings.ts`
- Create: `packages/framework/next-ui/src/i18n/strings.en.ts`
- Create: `packages/framework/next-ui/src/i18n/strings.fr.ts`
- Create: `packages/framework/next-ui/src/i18n/catalogs.ts`
- Create: `packages/framework/next-ui/src/i18n/cookie.ts`
- Create: `packages/framework/next-ui/src/i18n/__tests__/parity.test.ts`

**Interfaces:**
- Produces: `IGRPChromeStrings`, `IGRPChromeErrorCode`, `IGRPErrorCopy`, the label interfaces (`IGRPNavUserLabels`, `IGRPNotificationsLabels`, `IGRPModeSwitcherLabels`, `IGRPThemeSelectorLabels`, `IGRPCommandSearchLabels`, `IGRPMenuLabels`, now declared here), `IGRP_CHROME_STRINGS_PT | _EN | _FR`, `igrpChromeStringsFor(tag: string): IGRPChromeStrings`, `IGRP_LOCALE_COOKIE = 'IGRP_LOCALE'`. Plan 4 imports the catalogs and `IGRPChromeStrings`.

- [ ] **Step 1: Write the parity test**

`packages/framework/next-ui/src/i18n/__tests__/parity.test.ts`:

```ts
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

const tokens = (message: string) =>
  [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();

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
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n/__tests__/parity.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the interface and the Portuguese catalog**

`packages/framework/next-ui/src/i18n/strings.ts` (pure data, no directive). The Portuguese values are the defaults the components carry today, moved here verbatim; the `errorCodes` copy comes from the application center's `global-error.tsx`.

```ts
/**
 * Chrome string catalog: every user-visible default string of the template
 * surfaces this package owns. One interface, three catalogs (`_PT` here,
 * `strings.en.ts`, `strings.fr.ts`), kept in step by `__tests__/parity.test.ts`.
 *
 * Strings use `{token}` placeholders (`igrpFormatMessage`); no plurals.
 * Components read the catalog through `useIGRPChromeI18n()` and still accept
 * their label props, which win over the catalog.
 */

/** Platform error codes thrown by `@igrp/framework-next` (`IgrpErrorCode`), restated here because this package precedes it. */
export type IGRPChromeErrorCode =
  | 'IGRP_CONFIG_NOT_INITIALIZED'
  | 'IGRP_CONFIG_INVALID'
  | 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING'
  | 'IGRP_APP_CODE_MISSING'
  | 'IGRP_APP_HOME_SLUG_INVALID'
  | 'IGRP_AUTH_CONFIG_INVALID'
  | 'IGRP_LAYOUT_DATA_FAILED';

export interface IGRPErrorCopy {
  title: string;
  description: string;
}

export interface IGRPNavUserLabels {
  profile: string;
  notifications: string;
  settings: string;
  logout: string;
  /** Shown in place of a missing user name. */
  unknownUser: string;
}

export interface IGRPNotificationsLabels {
  /** Dropdown heading and the trigger's screen-reader name. */
  title: string;
  markAllRead: string;
  empty: string;
  viewAll: string;
  /** Unread-count announcement. `{count}` is substituted. */
  unreadCount: string;
}

export interface IGRPModeSwitcherLabels {
  toggle: string;
  switchToLight: string;
  switchToDark: string;
}

export interface IGRPThemeSelectorLabels {
  srLabel: string;
  triggerPrefix: string;
  triggerShort: string;
  placeholder: string;
  defaultGroup: string;
  scaledGroup: string;
}

export interface IGRPCommandSearchLabels {
  trigger: string;
  placeholder: string;
  empty: string;
  dialogTitle: string;
  dialogDescription: string;
}

export interface IGRPMenuLabels {
  navAriaLabel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearch: string;
  emptyMenus: string;
  /** `{query}` is substituted. */
  noResults: string;
  /** `{count}` is substituted; exactly one. */
  resultCountOne: string;
  /** `{count}` is substituted; zero or many. */
  resultCountOther: string;
  /** `{name}` is substituted. */
  toggleSubmenu: string;
  /** `{name}` is substituted. */
  folderMenu: string;
  /** `{name}` is substituted. */
  opensInNewTab: string;
}

export interface IGRPChromeStrings {
  header: {
    /** Accessible name of the settings link. */
    settings: string;
  };
  navUser: IGRPNavUserLabels;
  notifications: IGRPNotificationsLabels;
  modeSwitcher: IGRPModeSwitcherLabels;
  themeSelector: IGRPThemeSelectorLabels;
  commandSearch: IGRPCommandSearchLabels;
  breadcrumbs: {
    home: string;
    ellipsis: string;
  };
  appSwitcher: {
    appCenter: string;
    unknown: string;
  };
  menus: IGRPMenuLabels;
  loading: {
    text: string;
  };
  authCarousel: {
    region: string;
    /** `{index}` is substituted. */
    goToSlide: string;
  };
  authForm: {
    signInError: string;
  };
  forbidden: {
    title: string;
    description: string;
    home: string;
  };
  notFound: {
    subtitle: string;
    description: string;
    home: string;
    imageAlt: string;
  };
  globalError: {
    title: string;
    description: string;
    reset: string;
    retrying: string;
    errorRef: string;
  };
  segmentError: {
    title: string;
    description: string;
    home: string;
    reset: string;
    retrying: string;
    errorRef: string;
  };
  errorCodes: Record<IGRPChromeErrorCode, IGRPErrorCopy>;
}

export const IGRP_CHROME_STRINGS_PT: IGRPChromeStrings = {
  header: { settings: 'Definições' },
  navUser: {
    profile: 'Perfil',
    notifications: 'Notificações',
    settings: 'Definições',
    logout: 'Terminar sessão',
    unknownUser: 'N/D',
  },
  notifications: {
    title: 'Notificações',
    markAllRead: 'Marcar todas como lidas',
    empty: 'Sem notificações',
    viewAll: 'Todas as notificações',
    unreadCount: '{count} por ler',
  },
  modeSwitcher: {
    toggle: 'Alternar tema',
    switchToLight: 'Mudar para o tema claro',
    switchToDark: 'Mudar para o tema escuro',
  },
  themeSelector: {
    srLabel: 'Tema',
    triggerPrefix: 'Selecionar tema:',
    triggerShort: 'Tema',
    placeholder: 'Selecionar tema',
    defaultGroup: 'Padrão',
    scaledGroup: 'Escalado',
  },
  commandSearch: {
    trigger: 'Pesquisar...',
    placeholder: 'Digite um comando ou pesquisa...',
    empty: 'Sem resultados.',
    dialogTitle: 'Paleta de comandos',
    dialogDescription: 'Pesquise e execute um comando.',
  },
  breadcrumbs: { home: 'Página inicial', ellipsis: 'Mostrar restantes níveis' },
  appSwitcher: { appCenter: 'Centro de Aplicações', unknown: 'N/D' },
  menus: {
    navAriaLabel: 'Menu principal',
    searchPlaceholder: 'Pesquisar menus...',
    searchAriaLabel: 'Pesquisar menus',
    clearSearch: 'Limpar pesquisa',
    emptyMenus: 'Aplicação sem menus.',
    noResults: 'Sem resultados para "{query}".',
    resultCountOne: '{count} resultado',
    resultCountOther: '{count} resultados',
    toggleSubmenu: 'Abrir ou fechar o submenu {name}',
    folderMenu: 'Menu {name}',
    opensInNewTab: '{name} (abre num novo separador)',
  },
  loading: { text: 'Aguarde...' },
  authCarousel: { region: 'Destaques', goToSlide: 'Ir para o destaque {index}' },
  authForm: { signInError: 'Não foi possível iniciar sessão. Tente novamente.' },
  forbidden: {
    title: 'Acesso negado',
    description: 'Não tem permissão para aceder a este conteúdo.',
    home: 'Voltar à Página Inicial',
  },
  notFound: {
    subtitle: 'Página não encontrada',
    description: 'Desculpe, a página não foi encontrada.',
    home: 'Voltar à Página Inicial',
    imageAlt: 'Página não encontrada',
  },
  globalError: {
    title: 'Ocorreu um erro inesperado.',
    description:
      'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
    reset: 'Tentar novamente',
    retrying: 'A tentar...',
    errorRef: 'ID de referência:',
  },
  segmentError: {
    title: 'Ocorreu um erro nesta secção.',
    description:
      'Tente novamente ou volte ao início. Se o problema persistir, contacte a equipa de suporte.',
    home: 'Voltar ao início',
    reset: 'Tentar novamente',
    retrying: 'A tentar...',
    errorRef: 'ID de referência:',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'Configuração do IGRP não inicializada',
      description:
        'O ficheiro de configuração da aplicação não foi carregado. Contacte a equipa técnica para verificar o arranque do servidor.',
    },
    IGRP_CONFIG_INVALID: {
      title: 'Configuração do IGRP inválida',
      description:
        'A configuração da aplicação contém valores em falta ou inválidos. Verifique o ficheiro de configuração do IGRP e as variáveis de ambiente.',
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Gestão de acesso não configurada',
      description:
        'A URL da API de gestão de acesso não está definida. Defina a variável de ambiente da aplicação ou active o modo de pré-visualização para continuar.',
    },
    IGRP_APP_CODE_MISSING: {
      title: 'Código da aplicação em falta',
      description:
        'A aplicação não declarou o seu código identificador. Verifique o ficheiro de configuração do IGRP.',
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: 'URL inicial da aplicação inválida',
      description:
        'O valor de NEXT_PUBLIC_IGRP_APP_HOME_SLUG não começa por "/". Corrija a variável de ambiente e reinicie o servidor.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: 'Configuração de autenticação inválida',
      description:
        'Uma ou mais variáveis de ambiente necessárias ao provedor de autenticação estão em falta ou incorrectas.',
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Falha ao carregar os dados de layout',
      description:
        'Não foi possível carregar os menus ou dados do utilizador. Tente novamente; se persistir, contacte o suporte.',
    },
  },
};
```

- [ ] **Step 4: Write the English catalog**

`packages/framework/next-ui/src/i18n/strings.en.ts`:

```ts
import type { IGRPChromeStrings } from './strings.js';

export const IGRP_CHROME_STRINGS_EN: IGRPChromeStrings = {
  header: { settings: 'Settings' },
  navUser: {
    profile: 'Profile',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Sign out',
    unknownUser: 'N/A',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    empty: 'No notifications',
    viewAll: 'All notifications',
    unreadCount: '{count} unread',
  },
  modeSwitcher: {
    toggle: 'Toggle theme',
    switchToLight: 'Switch to the light theme',
    switchToDark: 'Switch to the dark theme',
  },
  themeSelector: {
    srLabel: 'Theme',
    triggerPrefix: 'Select theme:',
    triggerShort: 'Theme',
    placeholder: 'Select theme',
    defaultGroup: 'Default',
    scaledGroup: 'Scaled',
  },
  commandSearch: {
    trigger: 'Search...',
    placeholder: 'Type a command or search...',
    empty: 'No results.',
    dialogTitle: 'Command palette',
    dialogDescription: 'Search for and run a command.',
  },
  breadcrumbs: { home: 'Home', ellipsis: 'Show remaining levels' },
  appSwitcher: { appCenter: 'Applications Center', unknown: 'N/A' },
  menus: {
    navAriaLabel: 'Main menu',
    searchPlaceholder: 'Search menus...',
    searchAriaLabel: 'Search menus',
    clearSearch: 'Clear search',
    emptyMenus: 'This application has no menus.',
    noResults: 'No results for "{query}".',
    resultCountOne: '{count} result',
    resultCountOther: '{count} results',
    toggleSubmenu: 'Open or close the {name} submenu',
    folderMenu: '{name} menu',
    opensInNewTab: '{name} (opens in a new tab)',
  },
  loading: { text: 'Please wait...' },
  authCarousel: { region: 'Highlights', goToSlide: 'Go to highlight {index}' },
  authForm: { signInError: 'Could not sign in. Please try again.' },
  forbidden: {
    title: 'Access denied',
    description: 'You do not have permission to access this content.',
    home: 'Back to Home',
  },
  notFound: {
    subtitle: 'Page not found',
    description: 'Sorry, the page could not be found.',
    home: 'Back to Home',
    imageAlt: 'Page not found',
  },
  globalError: {
    title: 'An unexpected error occurred.',
    description:
      'Please try again. If the problem persists, contact the support team and quote the reference ID shown below.',
    reset: 'Try again',
    retrying: 'Retrying...',
    errorRef: 'Reference ID:',
  },
  segmentError: {
    title: 'An error occurred in this section.',
    description: 'Try again or go back home. If the problem persists, contact the support team.',
    home: 'Back to home',
    reset: 'Try again',
    retrying: 'Retrying...',
    errorRef: 'Reference ID:',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'IGRP configuration not initialized',
      description:
        'The application configuration file was not loaded. Contact the technical team to check the server startup.',
    },
    IGRP_CONFIG_INVALID: {
      title: 'Invalid IGRP configuration',
      description:
        'The application configuration has missing or invalid values. Check the IGRP configuration file and the environment variables.',
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Access management not configured',
      description:
        'The access management API URL is not set. Set the application environment variable or enable preview mode to continue.',
    },
    IGRP_APP_CODE_MISSING: {
      title: 'Application code missing',
      description:
        'The application did not declare its identifier code. Check the IGRP configuration file.',
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: 'Invalid application home URL',
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG does not start with "/". Fix the environment variable and restart the server.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: 'Invalid authentication configuration',
      description:
        'One or more environment variables required by the authentication provider are missing or incorrect.',
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Failed to load layout data',
      description:
        'The menus or user data could not be loaded. Try again; if it persists, contact support.',
    },
  },
};
```

- [ ] **Step 5: Write the French catalog**

`packages/framework/next-ui/src/i18n/strings.fr.ts`:

```ts
import type { IGRPChromeStrings } from './strings.js';

export const IGRP_CHROME_STRINGS_FR: IGRPChromeStrings = {
  header: { settings: 'Paramètres' },
  navUser: {
    profile: 'Profil',
    notifications: 'Notifications',
    settings: 'Paramètres',
    logout: 'Se déconnecter',
    unknownUser: 'N/D',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Tout marquer comme lu',
    empty: 'Aucune notification',
    viewAll: 'Toutes les notifications',
    unreadCount: '{count} non lue(s)',
  },
  modeSwitcher: {
    toggle: 'Changer de thème',
    switchToLight: 'Passer au thème clair',
    switchToDark: 'Passer au thème sombre',
  },
  themeSelector: {
    srLabel: 'Thème',
    triggerPrefix: 'Choisir un thème :',
    triggerShort: 'Thème',
    placeholder: 'Choisir un thème',
    defaultGroup: 'Standard',
    scaledGroup: 'Agrandi',
  },
  commandSearch: {
    trigger: 'Rechercher...',
    placeholder: 'Saisissez une commande ou une recherche...',
    empty: 'Aucun résultat.',
    dialogTitle: 'Palette de commandes',
    dialogDescription: 'Recherchez et exécutez une commande.',
  },
  breadcrumbs: { home: "Page d'accueil", ellipsis: 'Afficher les niveaux restants' },
  appSwitcher: { appCenter: 'Centre des applications', unknown: 'N/D' },
  menus: {
    navAriaLabel: 'Menu principal',
    searchPlaceholder: 'Rechercher dans les menus...',
    searchAriaLabel: 'Rechercher dans les menus',
    clearSearch: 'Effacer la recherche',
    emptyMenus: "Cette application n'a pas de menus.",
    noResults: 'Aucun résultat pour "{query}".',
    resultCountOne: '{count} résultat',
    resultCountOther: '{count} résultats',
    toggleSubmenu: 'Ouvrir ou fermer le sous-menu {name}',
    folderMenu: 'Menu {name}',
    opensInNewTab: "{name} (s'ouvre dans un nouvel onglet)",
  },
  loading: { text: 'Veuillez patienter...' },
  authCarousel: { region: 'À la une', goToSlide: "Aller à l'élément {index}" },
  authForm: { signInError: 'Connexion impossible. Veuillez réessayer.' },
  forbidden: {
    title: 'Accès refusé',
    description: "Vous n'avez pas la permission d'accéder à ce contenu.",
    home: "Retour à la page d'accueil",
  },
  notFound: {
    subtitle: 'Page introuvable',
    description: "Désolé, la page n'a pas été trouvée.",
    home: "Retour à la page d'accueil",
    imageAlt: 'Page introuvable',
  },
  globalError: {
    title: "Une erreur inattendue s'est produite.",
    description:
      "Veuillez réessayer. Si le problème persiste, contactez l'équipe d'assistance en indiquant l'identifiant de référence ci-dessous.",
    reset: 'Réessayer',
    retrying: 'Nouvelle tentative...',
    errorRef: 'Identifiant de référence :',
  },
  segmentError: {
    title: "Une erreur s'est produite dans cette section.",
    description:
      "Réessayez ou revenez à l'accueil. Si le problème persiste, contactez l'équipe d'assistance.",
    home: "Retour à l'accueil",
    reset: 'Réessayer',
    retrying: 'Nouvelle tentative...',
    errorRef: 'Identifiant de référence :',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'Configuration IGRP non initialisée',
      description:
        "Le fichier de configuration de l'application n'a pas été chargé. Contactez l'équipe technique pour vérifier le démarrage du serveur.",
    },
    IGRP_CONFIG_INVALID: {
      title: 'Configuration IGRP invalide',
      description:
        "La configuration de l'application contient des valeurs manquantes ou invalides. Vérifiez le fichier de configuration IGRP et les variables d'environnement.",
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Gestion des accès non configurée',
      description:
        "L'URL de l'API de gestion des accès n'est pas définie. Définissez la variable d'environnement de l'application ou activez le mode aperçu pour continuer.",
    },
    IGRP_APP_CODE_MISSING: {
      title: "Code de l'application manquant",
      description:
        "L'application n'a pas déclaré son code d'identification. Vérifiez le fichier de configuration IGRP.",
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: "URL d'accueil de l'application invalide",
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG ne commence pas par "/". Corrigez la variable d\'environnement et redémarrez le serveur.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: "Configuration d'authentification invalide",
      description:
        "Une ou plusieurs variables d'environnement requises par le fournisseur d'authentification sont manquantes ou incorrectes.",
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Échec du chargement des données de mise en page',
      description:
        "Impossible de charger les menus ou les données de l'utilisateur. Réessayez ; si le problème persiste, contactez l'assistance.",
    },
  },
};
```

- [ ] **Step 6: Catalog selection and the cookie constant**

`packages/framework/next-ui/src/i18n/cookie.ts`:

```ts
/**
 * Cookie carrying the user's locale choice. Declared here (not imported from
 * `@igrp/framework-next`, which sits above this package); the framework's
 * `./i18n` entry asserts its own constant equals this one.
 */
export const IGRP_LOCALE_COOKIE = 'IGRP_LOCALE';
```

`packages/framework/next-ui/src/i18n/catalogs.ts`:

```ts
import { IGRP_CHROME_STRINGS_PT, type IGRPChromeStrings } from './strings.js';
import { IGRP_CHROME_STRINGS_EN } from './strings.en.js';
import { IGRP_CHROME_STRINGS_FR } from './strings.fr.js';

const BY_LANGUAGE: Record<string, IGRPChromeStrings> = {
  pt: IGRP_CHROME_STRINGS_PT,
  en: IGRP_CHROME_STRINGS_EN,
  fr: IGRP_CHROME_STRINGS_FR,
};

/**
 * Chrome catalog for a locale or language tag (`fr`, `fr-FR`, `EN_gb`).
 * Unsupported, empty or missing tags resolve to Portuguese: this is the
 * fallback path of `useIGRPChromeI18n()` and must never throw.
 */
export function igrpChromeStringsFor(tag: string | null | undefined): IGRPChromeStrings {
  const language = (tag ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return BY_LANGUAGE[language] ?? IGRP_CHROME_STRINGS_PT;
}
```

- [ ] **Step 7: Run the parity test to see it pass**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n/__tests__/parity.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 8: Commit**

```bash
git add packages/framework/next-ui/src/i18n
git commit -m "feat(next-ui): chrome string catalog in pt, en and fr with a parity test"
```

---

### Task 2: `IGRPChromeI18nProvider` and `useIGRPChromeI18n()` with cookie fallback

**Files:**
- Create: `packages/framework/next-ui/src/i18n/context.tsx`
- Create: `packages/framework/next-ui/src/i18n/__tests__/context.test.tsx`

**Interfaces:**
- Produces: `IGRPChromeI18nProvider({ strings: IGRPChromeStrings; children })`, `useIGRPChromeI18n(): IGRPChromeStrings`. Plan 4's `IGRPIntlProvider` mounts the provider.

- [ ] **Step 1: Write the failing test**

`packages/framework/next-ui/src/i18n/__tests__/context.test.tsx`:

```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { IGRPChromeI18nProvider, useIGRPChromeI18n } from '../context.js';
import { IGRP_CHROME_STRINGS_EN } from '../strings.en.js';

function Probe() {
  const strings = useIGRPChromeI18n();
  return <span data-testid="probe">{strings.navUser.logout}</span>;
}

let root: Root | null = null;
let host: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  document.cookie = 'IGRP_LOCALE=; Max-Age=0; path=/';
});

function mount(ui: React.ReactNode): string {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(ui));
  return host.querySelector('[data-testid="probe"]')?.textContent ?? '';
}

describe('useIGRPChromeI18n', () => {
  it('returns the provided catalog', () => {
    expect(
      mount(
        <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_EN}>
          <Probe />
        </IGRPChromeI18nProvider>,
      ),
    ).toBe('Sign out');
  });

  it('without a provider reads the IGRP_LOCALE cookie on the client, regional tags included', () => {
    document.cookie = 'IGRP_LOCALE=fr-FR; path=/';
    expect(mount(<Probe />)).toBe('Se déconnecter');
  });

  it('without a provider and without a usable cookie falls back to Portuguese', () => {
    expect(mount(<Probe />)).toBe('Terminar sessão');
    document.cookie = 'IGRP_LOCALE=de; path=/';
    expect(mount(<Probe />)).toBe('Terminar sessão');
  });

  it('renders Portuguese on the server regardless of cookies (no document there)', () => {
    expect(renderToString(<Probe />)).toContain('Terminar sessão');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n/__tests__/context.test.tsx`
Expected: FAIL, `context.js` not found.

- [ ] **Step 3: Implement the provider and hook**

`packages/framework/next-ui/src/i18n/context.tsx`:

```tsx
'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

import { igrpChromeStringsFor } from './catalogs.js';
import { IGRP_LOCALE_COOKIE } from './cookie.js';
import type { IGRPChromeStrings } from './strings.js';

const ChromeI18nContext = createContext<IGRPChromeStrings | null>(null);

/**
 * Supplies the chrome catalog for the current locale. Mounted by
 * `IGRPIntlProvider` in `@igrp/framework-next/i18n/client`; apps without i18n
 * never mount it and get the fallback below.
 */
export function IGRPChromeI18nProvider({
  strings,
  children,
}: {
  strings: IGRPChromeStrings;
  children: ReactNode;
}) {
  return <ChromeI18nContext.Provider value={strings}>{children}</ChromeI18nContext.Provider>;
}

const subscribeNever = () => () => {};

/** The `IGRP_LOCALE` cookie value on the client; `''` when absent. */
function readCookieLocale(): string {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${IGRP_LOCALE_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(IGRP_LOCALE_COOKIE.length + 1)) : '';
}

const serverSnapshot = () => '';

/**
 * The chrome catalog in effect.
 *
 * With a provider: its catalog. Without one (an app that has not configured
 * i18n, or `global-error.tsx`, which renders outside every provider): the
 * catalog for the `IGRP_LOCALE` cookie on the client, Portuguese on the server.
 * `useSyncExternalStore` renders the server snapshot during hydration and then
 * the cookie value, so the markup never mismatches.
 */
export function useIGRPChromeI18n(): IGRPChromeStrings {
  const provided = useContext(ChromeI18nContext);
  const cookieLocale = useSyncExternalStore(subscribeNever, readCookieLocale, serverSnapshot);
  return provided ?? igrpChromeStringsFor(cookieLocale);
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n/__tests__/context.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/framework/next-ui/src/i18n/context.tsx packages/framework/next-ui/src/i18n/__tests__/context.test.tsx
git commit -m "feat(next-ui): IGRPChromeI18nProvider and useIGRPChromeI18n with a cookie fallback"
```

---

### Task 3: Error copy resolution keyed by platform code

**Files:**
- Create: `packages/framework/next-ui/src/i18n/error-copy.ts`
- Create: `packages/framework/next-ui/src/i18n/__tests__/error-copy.test.ts`
- Modify: `packages/framework/next-ui/src/errors/global.tsx`
- Modify: `packages/framework/next-ui/src/errors/segment.tsx`

**Interfaces:**
- Produces: `igrpResolveErrorCopy(error, { byCode, fallback }, custom?): IGRPErrorCopy`; `IGRPGlobalErrorProps.resolveCopy` and `IGRPSegmentErrorProps.resolveCopy` widened to `(error) => Partial<IGRPErrorCopy> | undefined | void`.

- [ ] **Step 1: Write the failing test**

`packages/framework/next-ui/src/i18n/__tests__/error-copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { igrpResolveErrorCopy } from '../error-copy.js';
import { IGRP_CHROME_STRINGS_PT } from '../strings.js';

const catalog = { byCode: IGRP_CHROME_STRINGS_PT.errorCodes, fallback: IGRP_CHROME_STRINGS_PT.globalError };
const withCode = (code: unknown) => Object.assign(new Error('x'), { code });

describe('igrpResolveErrorCopy', () => {
  it('uses the catalog entry for a known platform code', () => {
    expect(igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog)).toEqual(
      IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING,
    );
  });

  it('falls back to the generic pair for an unknown or missing code', () => {
    const generic = { title: catalog.fallback.title, description: catalog.fallback.description };
    expect(igrpResolveErrorCopy(withCode('SOMETHING_ELSE'), catalog)).toEqual(generic);
    expect(igrpResolveErrorCopy(new Error('x'), catalog)).toEqual(generic);
    expect(igrpResolveErrorCopy(withCode(42), catalog)).toEqual(generic);
  });

  it('lets a custom resolver override fully or partially', () => {
    const full = igrpResolveErrorCopy(new Error('x'), catalog, () => ({ title: 'T', description: 'D' }));
    expect(full).toEqual({ title: 'T', description: 'D' });

    const partial = igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog, () => ({ description: 'From digest' }));
    expect(partial).toEqual({
      title: IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING.title,
      description: 'From digest',
    });
  });

  it('ignores a custom resolver that returns nothing', () => {
    expect(igrpResolveErrorCopy(withCode('IGRP_APP_CODE_MISSING'), catalog, () => undefined)).toEqual(
      IGRP_CHROME_STRINGS_PT.errorCodes.IGRP_APP_CODE_MISSING,
    );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n/__tests__/error-copy.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the resolver**

`packages/framework/next-ui/src/i18n/error-copy.ts`:

```ts
import type { IGRPChromeErrorCode, IGRPErrorCopy } from './strings.js';

export type IGRPErrorCopyResolver = (error: Error) => Partial<IGRPErrorCopy> | undefined | void;

/**
 * Title and description for an error screen.
 *
 * Order: the app's `custom` resolver (a partial result is merged over the
 * catalog, so returning only `{ description }` keeps the catalog title),
 * then the catalog entry for a known `IGRP_*` code carried on the error,
 * then the screen's generic pair.
 */
export function igrpResolveErrorCopy(
  error: Error,
  catalog: { byCode: Record<IGRPChromeErrorCode, IGRPErrorCopy>; fallback: IGRPErrorCopy },
  custom?: IGRPErrorCopyResolver,
): IGRPErrorCopy {
  const code = (error as { code?: unknown }).code;
  const byCode =
    typeof code === 'string' && Object.hasOwn(catalog.byCode, code)
      ? catalog.byCode[code as IGRPChromeErrorCode]
      : undefined;
  const base: IGRPErrorCopy = byCode ?? {
    title: catalog.fallback.title,
    description: catalog.fallback.description,
  };
  const override = custom?.(error);
  if (!override) return base;
  return {
    title: override.title ?? base.title,
    description: override.description ?? base.description,
  };
}
```

- [ ] **Step 4: Use it in both error screens**

`packages/framework/next-ui/src/errors/global.tsx`: delete `DEFAULT_COPY`; add imports:

```ts
import { useIGRPChromeI18n } from '../i18n/context.js';
import { igrpResolveErrorCopy, type IGRPErrorCopyResolver } from '../i18n/error-copy.js';
```

Change the props: `resolveCopy?: IGRPErrorCopyResolver;` and make the three labels plain optionals (`resetLabel?: string; retryingLabel?: string; errorRefLabel?: string;`) with their JSDoc now reading "Defaults to the chrome catalog." In the function signature drop the three default values. At the top of the body:

```ts
  const chrome = useIGRPChromeI18n();
  const labels = {
    reset: resetLabel ?? chrome.globalError.reset,
    retrying: retryingLabel ?? chrome.globalError.retrying,
    errorRef: errorRefLabel ?? chrome.globalError.errorRef,
  };
```

Replace `const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;` with:

```ts
  const { title, description } = igrpResolveErrorCopy(
    error,
    { byCode: chrome.errorCodes, fallback: chrome.globalError },
    resolveCopy,
  );
```

and the three JSX usages: `{labels.errorRef}`, `{isResetting ? labels.retrying : labels.reset}`.

`packages/framework/next-ui/src/errors/segment.tsx`: same change with `chrome.segmentError` (which also has `home`): `homeLabel ?? chrome.segmentError.home`, `resetLabel ?? chrome.segmentError.reset`, `retryingLabel ?? chrome.segmentError.retrying`, `errorRefLabel ?? chrome.segmentError.errorRef`; delete its `DEFAULT_COPY`; `resolveCopy?: IGRPErrorCopyResolver`.

The hooks must be called before the `if (children) return <>{children}</>;` early return in both components, next to the existing `useState` calls.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/i18n && pnpm --filter @igrp/framework-next-ui typecheck`
Expected: PASS; type-check exit 0.

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next-ui/src/i18n/error-copy.ts packages/framework/next-ui/src/i18n/__tests__/error-copy.test.ts packages/framework/next-ui/src/errors/global.tsx packages/framework/next-ui/src/errors/segment.tsx
git commit -m "feat(next-ui): error screens resolve copy from the chrome catalog by platform code"
```

---

### Task 4: Components read the catalog; deprecated aliases; barrel

**Files:**
- Modify: `packages/framework/next-ui/src/templates/nav-user.tsx`
- Modify: `packages/framework/next-ui/src/templates/notifications.tsx`
- Modify: `packages/framework/next-ui/src/templates/mode-switcher.tsx`
- Modify: `packages/framework/next-ui/src/templates/theme-selector.tsx`
- Modify: `packages/framework/next-ui/src/templates/command-search.tsx`
- Modify: `packages/framework/next-ui/src/templates/menus/labels.ts`
- Modify: `packages/framework/next-ui/src/templates/menus/menus.tsx`
- Modify: `packages/framework/next-ui/src/templates/header.tsx`
- Modify: `packages/framework/next-ui/src/templates/breadcrumbs.tsx`
- Modify: `packages/framework/next-ui/src/templates/app-switcher.tsx`
- Modify: `packages/framework/next-ui/src/templates/loading.tsx`
- Modify: `packages/framework/next-ui/src/templates/not-found.tsx`
- Modify: `packages/framework/next-ui/src/permissions/forbidden.tsx`
- Modify: `packages/framework/next-ui/src/auths/carousel.tsx`
- Modify: `packages/framework/next-ui/src/auths/form.tsx`
- Modify: `packages/framework/next-ui/src/index.ts`
- Create: `packages/framework/next-ui/src/templates/__tests__/chrome-labels.test.tsx`

**Interfaces:**
- Consumes: `useIGRPChromeI18n`, the label interfaces from `../i18n/strings.js`.
- Produces: unchanged component props; `IGRP_*_LABELS_PT_PT` constants kept as `@deprecated` aliases; new barrel exports listed in Step 4.

- [ ] **Step 1: Write the failing precedence test**

`packages/framework/next-ui/src/templates/__tests__/chrome-labels.test.tsx`:

```tsx
// @vitest-environment jsdom
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { IGRPChromeI18nProvider } from '../../i18n/context.js';
import { IGRP_CHROME_STRINGS_FR } from '../../i18n/strings.fr.js';
import { IGRPForbidden } from '../../permissions/forbidden.js';
import { IGRPTemplateLoading } from '../loading.js';

describe('chrome components and the catalog', () => {
  it('render Portuguese defaults with no provider', () => {
    expect(renderToString(<IGRPForbidden homeHref={null} />)).toContain('Acesso negado');
    expect(renderToString(<IGRPTemplateLoading />)).toContain('Aguarde...');
  });

  it('render the provided catalog', () => {
    const html = renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_FR}>
        <IGRPForbidden homeHref={null} />
      </IGRPChromeI18nProvider>,
    );
    expect(html).toContain('Accès refusé');
  });

  it('let a prop win over the catalog, key by key', () => {
    const html = renderToString(
      <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_FR}>
        <IGRPForbidden homeHref={null} title="Nope" />
      </IGRPChromeI18nProvider>,
    );
    expect(html).toContain('Nope');
    expect(html).toContain("Vous n'avez pas la permission");
  });
});
```

`IGRPTemplateNavUser` needs the sidebar context and a user, so precedence for the `labels` object is covered by the same pattern on `IGRPForbidden`; both resolve through `?? chrome.<group>` and `{ ...chrome.<group>, ...overrides }`.

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm --filter @igrp/framework-next-ui exec vitest run src/templates/__tests__/chrome-labels.test.tsx`
Expected: FAIL on the French assertions.

- [ ] **Step 3: Wire each component**

Apply the same two patterns everywhere. For components with a `labels` object:

```ts
const chrome = useIGRPChromeI18n();
const labels = labelOverrides ? { ...chrome.<group>, ...labelOverrides } : chrome.<group>;
```

For components with individual label props: remove the literal default from the parameter, and resolve `prop ?? chrome.<group>.<key>` in the body. Concretely:

- `nav-user.tsx`: delete the local `IGRPNavUserLabels` interface and `IGRP_NAV_USER_LABELS_PT_PT` declaration; `import { useIGRPChromeI18n } from '../i18n/context.js'; import { IGRP_CHROME_STRINGS_PT, type IGRPNavUserLabels } from '../i18n/strings.js';` then `export type { IGRPNavUserLabels };` and `/** @deprecated Use IGRP_CHROME_STRINGS_PT.navUser. */ export const IGRP_NAV_USER_LABELS_PT_PT: IGRPNavUserLabels = IGRP_CHROME_STRINGS_PT.navUser;`. Replace the `labels` computation with the pattern (`chrome.navUser`). The hook call goes before `if (!user) return null;`.
- `notifications.tsx`: same with `IGRPNotificationsLabels`, `IGRP_NOTIFICATIONS_LABELS_PT_PT`, `chrome.notifications`.
- `mode-switcher.tsx`: same with `IGRPModeSwitcherLabels`, `IGRP_MODE_SWITCHER_LABELS_PT_PT`, `chrome.modeSwitcher`.
- `theme-selector.tsx`: same with `IGRPThemeSelectorLabels`, `IGRP_THEME_SELECTOR_LABELS_PT_PT`, `chrome.themeSelector`.
- `command-search.tsx`: same with `IGRPCommandSearchLabels`, `IGRP_COMMAND_SEARCH_LABELS_PT_PT`, `chrome.commandSearch`.
- `menus/labels.ts`: delete the local interface and constant; `import { IGRP_CHROME_STRINGS_PT, type IGRPMenuLabels } from '../../i18n/strings.js'; export type { IGRPMenuLabels }; /** @deprecated Use IGRP_CHROME_STRINGS_PT.menus. */ export const IGRP_MENU_LABELS_PT_PT: IGRPMenuLabels = IGRP_CHROME_STRINGS_PT.menus;` and change the resolver to `export function resolveMenuLabels(overrides?: Partial<IGRPMenuLabels>, base: IGRPMenuLabels = IGRP_MENU_LABELS_PT_PT): IGRPMenuLabels { return overrides ? { ...base, ...overrides } : base; }`. Update its JSDoc: "Resolves a partial override against `base` (the chrome catalog's `menus` group; Portuguese when omitted)."
- `menus/menus.tsx`: `const chrome = useIGRPChromeI18n();` and `resolveMenuLabels(labelOverrides, chrome.menus)` inside the existing `useMemo`, adding `chrome.menus` to its dependency array.
- `header.tsx`: `settingsLabel` loses its default; `const chrome = useIGRPChromeI18n();` after `useIGRPToast()`; the link uses `aria-label={settingsLabel ?? chrome.header.settings}`.
- `breadcrumbs.tsx`: `homeLabel` and `ellipsisLabel` lose their defaults; resolve `?? chrome.breadcrumbs.home` / `?? chrome.breadcrumbs.ellipsis` in the body.
- `app-switcher.tsx`: `appCenterLabel ?? chrome.appSwitcher.appCenter`, `unknownLabel ?? chrome.appSwitcher.unknown`.
- `loading.tsx`: `text ?? chrome.loading.text`.
- `not-found.tsx`: `subtitle`, `description`, `homeLabel`, `imageAlt` resolve from `chrome.notFound`; `title = '404'` keeps its literal default (not a word).
- `forbidden.tsx`: `title`, `description`, `homeLabel` from `chrome.forbidden`.
- `auths/carousel.tsx`: `regionLabel ?? chrome.authCarousel.region`, `goToSlideLabel ?? chrome.authCarousel.goToSlide`.
- `auths/form.tsx`: the `signInError` fallback literal becomes `chrome.authForm.signInError` (hook called at the top of `IGRPAuthForm`).

Every one of these files already has `'use client'`.

- [ ] **Step 4: Export from the barrel**

In `packages/framework/next-ui/src/index.ts`, add a section before `// providers`:

```ts
// i18n (chrome catalog)

export { IGRPChromeI18nProvider, useIGRPChromeI18n } from './i18n/context.js';
export { igrpChromeStringsFor } from './i18n/catalogs.js';
export { IGRP_LOCALE_COOKIE } from './i18n/cookie.js';
export { igrpResolveErrorCopy, type IGRPErrorCopyResolver } from './i18n/error-copy.js';
export {
  IGRP_CHROME_STRINGS_PT,
  type IGRPChromeStrings,
  type IGRPChromeErrorCode,
  type IGRPErrorCopy,
} from './i18n/strings.js';
export { IGRP_CHROME_STRINGS_EN } from './i18n/strings.en.js';
export { IGRP_CHROME_STRINGS_FR } from './i18n/strings.fr.js';
```

The existing exports of `IGRP_*_LABELS_PT_PT` and the `IGRP*Labels` types stay as they are (the component modules still export them).

- [ ] **Step 5: Run everything**

Run: `pnpm --filter @igrp/framework-next-ui format && pnpm --filter @igrp/framework-next-ui typecheck && pnpm --filter @igrp/framework-next-ui test && pnpm --filter @igrp/framework-next-ui build`
Expected: all exit 0. `client-boundaries.test.ts` passes (pure i18n modules have no directive and no client-only imports; `context.tsx` has the directive). `build-pipeline.test.ts` passes.

- [ ] **Step 6: Commit**

```bash
git add packages/framework/next-ui/src
git commit -m "feat(next-ui): chrome components read the catalog; label props still win; deprecated *_PT_PT aliases"
```

---

### Task 5: Changeset and downstream build

**Files:**
- Create: `.changeset/next-ui-chrome-catalog.md`

- [ ] **Step 1: Changeset**

```md
---
'@igrp/framework-next-ui': patch
---

i18n: one typed chrome catalog (`IGRPChromeStrings`) in Portuguese, English and French, covering the header, user menu, notifications, mode and theme switchers, command palette, breadcrumbs, app switcher, sidebar menus, auth screens, loading, forbidden, not-found, the error screens and the platform error codes. `IGRPChromeI18nProvider` supplies it; `useIGRPChromeI18n()` reads it, or, with no provider, the `IGRP_LOCALE` cookie on the client and Portuguese on the server. Every existing label prop still wins. `IGRPGlobalError` / `IGRPSegmentError` resolve copy by platform code by default and accept a partial `resolveCopy`. The `IGRP_*_LABELS_PT_PT` constants are deprecated aliases into `IGRP_CHROME_STRINGS_PT`.
```

- [ ] **Step 2: Build the chain and the template**

Run: `pnpm build:framework && pnpm --filter @igrp/framework-next-template exec tsc --noEmit`
Expected: exit 0. The template's `resolveErrorCopy` (returns a full pair) still satisfies the widened `resolveCopy` type.

- [ ] **Step 3: Commit**

```bash
git add .changeset/next-ui-chrome-catalog.md
git commit -m "chore(next-ui): changeset for the chrome i18n catalog"
```

---

## Self-review

- Spec coverage: provider and hook with cookie fallback and `pt` server snapshot; catalog interface over every listed surface (header, sidebar menus, nav-user, notifications, theme and mode selector, command search, breadcrumbs, app switcher, auth form and carousel, forbidden, not-found, global and segment errors, loading, error codes); `_PT/_EN/_FR` exports; deprecated aliases; props still win; error-copy defaults; jsdom-per-file tests. The session watcher has no strings, so nothing to catalog there.
- Type consistency: `IGRPChromeStrings` group names used in Task 4 (`navUser`, `notifications`, `modeSwitcher`, `themeSelector`, `commandSearch`, `breadcrumbs`, `appSwitcher`, `menus`, `loading`, `authCarousel`, `authForm`, `forbidden`, `notFound`, `globalError`, `segmentError`, `errorCodes`, `header`) match Task 1. `igrpResolveErrorCopy(error, { byCode, fallback }, custom?)` is the same in Task 3's test, implementation and screens.
- Review Focus 1 to 5: Task 2 (1, 2), Task 3 (3, 4), Task 4 (5, via the equivalent `IGRPForbidden` precedence test and the shared pattern).
