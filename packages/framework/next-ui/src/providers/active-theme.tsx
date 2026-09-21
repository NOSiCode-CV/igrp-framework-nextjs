'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

const COOKIE_NAME = 'igrp_active_theme';
const DEFAULT_THEME = 'default';

/**
 * `useLayoutEffect` runs before the browser paints; `useEffect` runs after.
 * Applying the theme class in a plain `useEffect` meant every load painted once
 * with the DEFAULT theme and then swapped — a visible flash for anyone whose
 * active theme is not `default`.
 *
 * React warns when `useLayoutEffect` is called during SSR (it cannot run there
 * and the warning is correct), so the choice is made once, at module scope.
 * This only narrows the flash to zero *frames* on the client; to remove it
 * before hydration as well, the app's root layout should render
 * {@link igrpActiveThemeClassName} on `<body>` server-side — it already reads
 * the cookie to pass `activeThemeValue` down.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function setThemeCookie(theme: string) {
  if (typeof window === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;
}

/**
 * The `theme-*` classes for an active theme, space-separated.
 *
 * Render this on `<body>` from the server (the same cookie value that feeds
 * `initialTheme`) so the first paint already carries the theme. The provider
 * applies the identical classes on the client, so the two agree.
 */
export function igrpActiveThemeClassName(activeTheme: string = DEFAULT_THEME): string {
  return activeTheme.endsWith('-scaled')
    ? `theme-${activeTheme} theme-scaled`
    : `theme-${activeTheme}`;
}

/** Name of the cookie the provider persists the active theme in. */
export const IGRP_ACTIVE_THEME_COOKIE = COOKIE_NAME;

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

  useIsomorphicLayoutEffect(() => {
    Array.from(document.body.classList)
      .filter((className) => className.startsWith('theme-'))
      .forEach((className) => {
        document.body.classList.remove(className);
      });

    document.body.classList.add(...igrpActiveThemeClassName(activeTheme).split(' '));
  }, [activeTheme]);

  // Persisting is not a paint concern, so it stays in a passive effect and off
  // the critical path.
  useEffect(() => {
    setThemeCookie(activeTheme);
  }, [activeTheme]);

  const value = useMemo(() => ({ activeTheme, setActiveTheme }), [activeTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useIGRPThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useIGRPThemeConfig must be used within an <IGRPActiveThemeProvider>');
  }
  return context;
}

export { IGRPActiveThemeProvider, type IGRPActiveThemeProviderArgs };
