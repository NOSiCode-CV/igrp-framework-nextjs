'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  Button,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  cn,
} from '@igrp/igrp-framework-react-design-system';
import { MoonIcon, SunIcon } from 'lucide-react';

import { useIGRPChromeI18n } from '../i18n/context.js';
import { IGRP_CHROME_STRINGS_PT, type IGRPModeSwitcherLabels } from '../i18n/strings.js';

export type { IGRPModeSwitcherLabels };

/** @deprecated Use IGRP_CHROME_STRINGS_PT.modeSwitcher. */
export const IGRP_MODE_SWITCHER_LABELS_PT_PT: IGRPModeSwitcherLabels =
  IGRP_CHROME_STRINGS_PT.modeSwitcher;

interface IGRPTemplateModeSwitcherProps {
  /** Partial override of the chrome catalog group. Missing keys keep the catalog value. */
  labels?: Partial<IGRPModeSwitcherLabels>;
}

const subscribeNever = () => () => {};

function IGRPTemplateModeSwitcher({ labels: labelOverrides }: IGRPTemplateModeSwitcherProps = {}) {
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useIGRPMetaColor();

  // `false` on the server and during hydration, `true` after — without an effect.
  // Only picks the action label: `resolvedTheme` is unknown until then, the icons are not.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const chrome = useIGRPChromeI18n();
  const labels = labelOverrides
    ? { ...chrome.modeSwitcher, ...labelOverrides }
    : chrome.modeSwitcher;

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    setMetaColor(next === 'dark' ? IGRP_META_THEME_COLORS.dark : IGRP_META_THEME_COLORS.light);
  }, [isDark, setTheme, setMetaColor]);

  const actionLabel = !mounted
    ? labels.toggle
    : isDark
      ? labels.switchToLight
      : labels.switchToDark;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-6 relative overflow-hidden')}
      onClick={toggleTheme}
      aria-label={actionLabel}
    >
      {/* Both icons always render; the `.dark` class next-themes sets before paint picks one. */}
      <div className={cn('relative size-4 flex items-center justify-center')}>
        <SunIcon
          size={16}
          strokeWidth={2}
          className={cn(
            'absolute transition-all duration-300 rotate-90 scale-0 opacity-0',
            'dark:rotate-0 dark:scale-100 dark:opacity-100',
          )}
          aria-hidden="true"
        />
        <MoonIcon
          size={16}
          strokeWidth={2}
          className={cn(
            'absolute transition-all duration-300 rotate-0 scale-100 opacity-100',
            'dark:rotate-90 dark:scale-0 dark:opacity-0',
          )}
          aria-hidden="true"
        />
      </div>
      <span className={cn('sr-only')}>{actionLabel}</span>
    </Button>
  );
}

export { IGRPTemplateModeSwitcher, type IGRPTemplateModeSwitcherProps };
