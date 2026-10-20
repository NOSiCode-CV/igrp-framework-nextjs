'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  Button,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  IGRPIcon,
  cn,
} from '@igrp/igrp-framework-react-design-system';

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

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('size-6')}
        aria-label={labels.toggle}
        disabled
      >
        <div className={cn('size-4')} aria-hidden="true" />
        <span className={cn('sr-only')}>{labels.toggle}</span>
      </Button>
    );
  }

  const actionLabel = isDark ? labels.switchToLight : labels.switchToDark;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-6 relative overflow-hidden')}
      onClick={toggleTheme}
      aria-label={actionLabel}
      aria-pressed={isDark}
    >
      <div className={cn('relative size-4 flex items-center justify-center')}>
        <IGRPIcon
          iconName="Sun"
          strokeWidth={2}
          className={cn(
            'absolute transition-all duration-300 rotate-90 scale-0 opacity-0',
            isDark && 'rotate-0 scale-100 opacity-100',
          )}
          aria-hidden="true"
        />
        <IGRPIcon
          iconName="Moon"
          strokeWidth={2}
          className={cn(
            'absolute transition-all duration-300 rotate-0 scale-100 opacity-100',
            isDark && 'rotate-90 scale-0 opacity-0',
          )}
          aria-hidden="true"
        />
      </div>
      <span className={cn('sr-only')}>{actionLabel}</span>
    </Button>
  );
}

export { IGRPTemplateModeSwitcher, type IGRPTemplateModeSwitcherProps };
