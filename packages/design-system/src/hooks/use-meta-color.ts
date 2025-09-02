import { useTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';

export const IGRP_META_THEME_COLORS = {
  dark: '#ffffff',
  light: '#09090b',
};

export function useIGRPMetaColor() {
  const { resolvedTheme } = useTheme();

  const metaColor = useMemo(() => {
    return resolvedTheme !== 'dark' ? IGRP_META_THEME_COLORS.dark : IGRP_META_THEME_COLORS.light;
  }, [resolvedTheme]);

  const setMetaColor = useCallback((color: string) => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, []);

  return {
    metaColor,
    setMetaColor,
  };
}
