import { igrpFormatMessage } from '@igrp/igrp-framework-react-design-system';

/**
 * User-visible strings for the sidebar menu surfaces.
 *
 * pt-PT defaults, exposed as an overridable prop — the same contract the error
 * and 403 screens use. The design system's `useIGRPi18n()` catalog is closed
 * (`IGRPI18nStrings` enumerates DS component groups and the provider merges a
 * fixed list), so a framework package cannot add a group to it without editing
 * the design system. Until that catalog opens up, props are the seam.
 */
export interface IGRPMenuLabels {
  /** `aria-label` on the menu `<nav>`. */
  navAriaLabel: string;
  /** Placeholder of the menu filter input. */
  searchPlaceholder: string;
  /** `aria-label` of the menu filter input. */
  searchAriaLabel: string;
  /** `aria-label` of the clear-filter button. */
  clearSearch: string;
  /** Shown when the application has no active menu items. */
  emptyMenus: string;
  /** Empty search result. `{query}` is substituted. */
  noResults: string;
  /** Result count, exactly one. `{count}` is substituted. */
  resultCountOne: string;
  /** Result count, zero or many. `{count}` is substituted. */
  resultCountOther: string;
  /** `aria-label` of a folder's expand/collapse trigger. `{name}` is substituted. */
  toggleSubmenu: string;
  /** `aria-label` of a folder's icon-mode dropdown trigger. `{name}` is substituted. */
  folderMenu: string;
  /** `aria-label` of a link that opens a new tab. `{name}` is substituted. */
  opensInNewTab: string;
}

export const IGRP_MENU_LABELS_PT_PT: IGRPMenuLabels = {
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
};

/** Resolves a partial override against the pt-PT defaults. */
export function resolveMenuLabels(overrides?: Partial<IGRPMenuLabels>): IGRPMenuLabels {
  return overrides ? { ...IGRP_MENU_LABELS_PT_PT, ...overrides } : IGRP_MENU_LABELS_PT_PT;
}

/**
 * Substitutes `{token}` placeholders.
 *
 * Re-exported from the design system rather than reached for with
 * `String.prototype.replace(string, string)`, which interprets `$&`, `` $` ``,
 * `$'` and `$n` **in the replacement**. Menu names come from the backend and
 * the search query is typed by the user, so a name or query containing `$&`
 * corrupted the rendered string and leaked the surrounding template:
 * searching `` a$`b `` rendered `Sem resultados para "aSem resultados para "b".`
 * `igrpFormatMessage` uses a function replacer and is immune.
 */
export const formatMenuLabel = igrpFormatMessage;

/**
 * `aria-label` for a menu link: the plain name, or the new-tab variant when the
 * link leaves the app. Shared so leaf, sub-leaf and search results cannot drift.
 */
export function menuLinkAriaLabel(
  name: string,
  target: string | undefined,
  labels: IGRPMenuLabels,
): string {
  return target === '_blank' ? formatMenuLabel(labels.opensInNewTab, { name }) : name;
}
