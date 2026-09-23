import { IGRP_ICON_NAMES } from "./names.js"

/**
 * Every lucide icon name (PascalCase), sorted — for icon pickers and Storybook
 * controls.
 *
 * Built from committed data (`./names.ts`), NOT from lucide's `icons` object.
 * Importing `icons` pulls every icon's code, and because `IGRPIcon` lazy-loads
 * icons one per chunk, a bundler then emits a separate chunk for each of the
 * ~1,700 icons: a Storybook story that merely listed the names fetched all of
 * them. `__tests__/names.test.ts` keeps the data in sync with lucide.
 */
const IGRPIconObject: string[] = [...IGRP_ICON_NAMES]

export { IGRPIconObject }
