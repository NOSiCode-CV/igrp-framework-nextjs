'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../horizon/button';
import { IGRP_META_THEME_COLORS, useIGRPMetaColor } from '../../hooks/use-meta-color';

function IGRPTemplateModeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useIGRPMetaColor();

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setMetaColor(
      resolvedTheme === 'dark' ? IGRP_META_THEME_COLORS.light : IGRP_META_THEME_COLORS.dark,
    );
  }, [resolvedTheme, setTheme, setMetaColor]);

  return (
    <Button variant="ghost" size="icon" className="group/toggle size-6" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun strokeWidth={2} /> : <Moon strokeWidth={2} />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export { IGRPTemplateModeSwitcher };
