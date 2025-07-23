'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../primitives/button';
import { META_THEME_COLORS, useMetaColor } from '../../hooks/use-meta-color';

export function IGRPModeSwitcher() {
  const { theme,setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useMetaColor();

  const toggleTheme = React.useCallback(() => {
    console.log('theme toogle');
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setMetaColor(resolvedTheme === 'dark' ? META_THEME_COLORS.light : META_THEME_COLORS.dark);
  }, [resolvedTheme, setTheme, setMetaColor]);

  return (
    <Button variant="ghost" size="icon" className="group/toggle size-6" onClick={toggleTheme}>      
      {theme === 'dark' ? <Sun strokeWidth={2} /> : <Moon strokeWidth={2} />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
