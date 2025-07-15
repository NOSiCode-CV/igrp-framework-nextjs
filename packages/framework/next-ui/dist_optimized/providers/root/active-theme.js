'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
const COOKIE_NAME = 'igrp_active_theme';
const DEFAULT_THEME = 'default';
function setThemeCookie(theme) {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
}
const ThemeContext = /*#__PURE__*/createContext(undefined);
export function IGRPActiveThemeProvider({
  children,
  initialTheme
}) {
  const [activeTheme, setActiveTheme] = useState(() => initialTheme || DEFAULT_THEME);
  useEffect(() => {
    setThemeCookie(activeTheme);
    Array.from(document.body.classList).filter(className => className.startsWith('theme-')).forEach(className => {
      document.body.classList.remove(className);
    });
    document.body.classList.add(`theme-${activeTheme}`);
    if (activeTheme.endsWith('-scaled')) {
      document.body.classList.add('theme-scaled');
    }
  }, [activeTheme]);
  return /*#__PURE__*/_jsx(ThemeContext.Provider, {
    value: {
      activeTheme,
      setActiveTheme
    },
    children: children
  });
}
// eslint-disable-next-line react-refresh/only-export-components
export function useIGRPThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeConfig must be used within an ActiveThemeProvider');
  }
  return context;
}
//# sourceMappingURL=active-theme.js.map