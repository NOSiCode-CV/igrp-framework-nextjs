'use client';

import { useCallback } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/primitives/button';
import { META_THEME_COLORS, useMetaColor } from '@/hooks/use-meta-color';

export function IGRPModeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();
  const { setMetaColor } = useMetaColor();

  console.log('theme toggle render');

  const toggleTheme = useCallback(() => {
    console.log('theme toogle');
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    setMetaColor(resolvedTheme === 'dark' ? META_THEME_COLORS.light : META_THEME_COLORS.dark);
  }, [resolvedTheme, setTheme, setMetaColor]);

  return (
    <Button
      variant='ghost'
      size='icon'
      className='group/toggle size-6'
      onClick={toggleTheme}
    >
      <SunIcon
        className='hidden [html.dark_&]:block'
        strokeWidth={2}
      />
      <MoonIcon
        className='hidden [html.light_&]:block'
        strokeWidth={2}
      />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  );
}
