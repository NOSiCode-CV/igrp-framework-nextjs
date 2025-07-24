'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const COOKIE_NAME = 'igrp_active_theme';
const DEFAULT_THEME = 'default';

function setThemeCookie(theme: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
}

type ThemeContextArgs = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextArgs | undefined>(undefined);

type IGRPActiveThemeProviderArgs = {
  children: React.ReactNode;
  initialTheme?: string;
};

function IGRPActiveThemeProvider({ children, initialTheme }: IGRPActiveThemeProviderArgs) {
  const [activeTheme, setActiveTheme] = useState<string>(() => initialTheme || DEFAULT_THEME);

  useEffect(() => {
    setThemeCookie(activeTheme);

    Array.from(document.body.classList)
      .filter((className) => className.startsWith('theme-'))
      .forEach((className) => {
        document.body.classList.remove(className);
      });

    document.body.classList.add(`theme-${activeTheme}`);

    if (activeTheme.endsWith('-scaled')) {
      document.body.classList.add('theme-scaled');
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIGRPThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeConfig must be used within an ActiveThemeProvider');
  }
  return context;
}

export { IGRPActiveThemeProvider, type IGRPActiveThemeProviderArgs }
