import type { IGRPLocale } from '../config.js';
import type { IGRPSetLocaleResult } from '../server/set-locale.js';

export interface IGRPLocaleChangeHandlers {
  action: (value: string) => Promise<IGRPSetLocaleResult>;
  onChanged?: (locale: IGRPLocale) => void | Promise<void>;
  refresh: () => void;
}

/**
 * The switcher's change flow, kept free of React so it can be unit-tested:
 * `action` → `onChanged` → `refresh`. Resolves to `true` when the change
 * failed. It never throws: a rejected `action` is a failure with no refresh;
 * a rejected `onChanged` is reported as a failure but still refreshes, because
 * the locale was already saved and the UI must not stay stale.
 */
export async function igrpRunLocaleChange(
  next: string,
  { action, onChanged, refresh }: IGRPLocaleChangeHandlers,
): Promise<boolean> {
  let result: IGRPSetLocaleResult;
  try {
    result = await action(next);
  } catch (error) {
    console.error('[igrp-i18n] locale change failed', error);
    return true;
  }
  if (!result.success) return true;

  let failed = false;
  try {
    await onChanged?.(result.data.locale);
  } catch (error) {
    console.error('[igrp-i18n] onChanged failed after the locale was saved', error);
    failed = true;
  }
  refresh();
  return failed;
}
