import type { IGRPLocale } from '../config.js';
import type { IGRPSetLocaleResult } from '../server/set-locale.js';

export interface IGRPLocaleChangeHandlers {
  action: (value: string) => Promise<IGRPSetLocaleResult>;
  onChanged?: (locale: IGRPLocale, persisted: boolean) => void | Promise<void>;
  refresh: () => void;
  /** The locale shown before this change, so a persisted change can be rolled back. */
  previous?: string;
}

/**
 * The switcher's change flow, kept free of React so it can be unit-tested:
 * `action` → `onChanged` → `refresh`. Resolves to `true` when the change
 * failed. It never throws: a rejected `action` is a failure with no refresh.
 *
 * A rejected `onChanged` is a failure too. When the change was persisted
 * (session-first) and `previous` is known, the profile and cookie are rolled
 * back to `previous` and the page is not refreshed: the session still holds
 * the old locale, so refreshing would render it anyway and leave the profile
 * pointing at a language the user sees only at their next sign-in. Otherwise
 * it still refreshes, because the locale was saved and the UI must not stay stale.
 */
export async function igrpRunLocaleChange(
  next: string,
  { action, onChanged, refresh, previous }: IGRPLocaleChangeHandlers,
): Promise<boolean> {
  let result: IGRPSetLocaleResult;
  try {
    result = await action(next);
  } catch (error) {
    console.error('[igrp-i18n] locale change failed', error);
    return true;
  }
  if (!result.success) return true;

  try {
    await onChanged?.(result.data.locale, result.data.persisted);
  } catch (error) {
    console.error('[igrp-i18n] onChanged failed after the locale was saved', error);
    if (result.data.persisted && previous && previous !== result.data.locale) {
      try {
        await action(previous);
      } catch (rollbackError) {
        console.error('[igrp-i18n] rolling the locale back failed', rollbackError);
      }
      return true;
    }
    refresh();
    return true;
  }
  refresh();
  return false;
}
