'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  IGRPButtonPrimitive,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  IGRPIcon,
  cn,
} from '@igrp/igrp-framework-react-design-system';

function IGRPTemplateModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useIGRPMetaColor();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    setMetaColor(next === 'dark' ? IGRP_META_THEME_COLORS.dark : IGRP_META_THEME_COLORS.light);
  }, [isDark, setTheme, setMetaColor]);

  if (!mounted) {
    return (
      <IGRPButtonPrimitive
        variant="ghost"
        size="icon"
        className={cn('size-6')}
        aria-label="Toggle theme"
        disabled
      >
        <div className={cn('size-4')} aria-hidden="true" />
        <span className={cn('sr-only')}>Toggle theme</span>
      </IGRPButtonPrimitive>
    );
  }

  return (
    <IGRPButtonPrimitive
      variant="ghost"
      size="icon"
      className={cn('size-6 relative overflow-hidden')}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
      <span className={cn('sr-only')}>
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </IGRPButtonPrimitive>
  );
}

export { IGRPTemplateModeSwitcher };
