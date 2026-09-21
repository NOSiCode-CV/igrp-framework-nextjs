'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Button,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  IGRPIcon,
  cn,
} from '@igrp/igrp-framework-react-design-system';

/** pt-PT defaults for the light/dark toggle. Override individually. */
export interface IGRPModeSwitcherLabels {
  /** Accessible name while the resolved theme is still unknown. */
  toggle: string;
  /** Accessible name when the current theme is dark (the action switches to light). */
  switchToLight: string;
  /** Accessible name when the current theme is light (the action switches to dark). */
  switchToDark: string;
}

export const IGRP_MODE_SWITCHER_LABELS_PT_PT: IGRPModeSwitcherLabels = {
  toggle: 'Alternar tema',
  switchToLight: 'Mudar para o tema claro',
  switchToDark: 'Mudar para o tema escuro',
};

interface IGRPTemplateModeSwitcherProps {
  /** Partial override of the pt-PT strings. Missing keys keep their default. */
  labels?: Partial<IGRPModeSwitcherLabels>;
}

function IGRPTemplateModeSwitcher({ labels: labelOverrides }: IGRPTemplateModeSwitcherProps = {}) {
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useIGRPMetaColor();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const labels = labelOverrides
    ? { ...IGRP_MODE_SWITCHER_LABELS_PT_PT, ...labelOverrides }
    : IGRP_MODE_SWITCHER_LABELS_PT_PT;

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
