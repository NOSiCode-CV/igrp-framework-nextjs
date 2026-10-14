import { igrpFormatMessage } from '@igrp/igrp-framework-react-design-system';

import { IGRP_CHROME_STRINGS_PT, type IGRPMenuLabels } from '../../i18n/strings.js';

export type { IGRPMenuLabels };

/** @deprecated Use IGRP_CHROME_STRINGS_PT.menus. */
export const IGRP_MENU_LABELS_PT_PT: IGRPMenuLabels = IGRP_CHROME_STRINGS_PT.menus;

/** Resolves a partial override against `base` (the chrome catalog's `menus` group; Portuguese when omitted). */
export function resolveMenuLabels(
  overrides?: Partial<IGRPMenuLabels>,
  base: IGRPMenuLabels = IGRP_MENU_LABELS_PT_PT,
): IGRPMenuLabels {
  return overrides ? { ...base, ...overrides } : base;
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
