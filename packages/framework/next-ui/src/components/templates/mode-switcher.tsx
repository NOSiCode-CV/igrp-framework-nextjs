'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  IGRPButtonPrimitive,
  IGRP_META_THEME_COLORS,
  useIGRPMetaColor,
  IGRPIcon,
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

  return (
    <IGRPButtonPrimitive
      variant="ghost"
      size="icon"
      className="group/toggle size-6"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {mounted &&
        (isDark ? (
          <IGRPIcon iconName="Sun" strokeWidth={2} />
        ) : (
          <IGRPIcon iconName="Moon" strokeWidth={2} />
        ))}
      <span className="sr-only">Toggle theme</span>
    </IGRPButtonPrimitive>
  );
}

export { IGRPTemplateModeSwitcher };
