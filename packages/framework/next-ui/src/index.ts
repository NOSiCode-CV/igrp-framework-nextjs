'use client';

import "./styles.css";

export { META_THEME_COLORS, useMetaColor } from './hooks/use-meta-color';

export { IGRPThemeSelector } from './components/horizon/theme-selector';

export { IGRPActiveThemeProvider, type IGRPActiveThemeProviderArgs } from "./providers/active-theme";
export { IGRPProgressBarProvider } from "./providers/progress-bar";
export { IGRPRootProviders } from './providers/root';
export { IGRPSessionProvider } from "./providers/session";

export { IGRPGlobalError, type IGRPGlobalErrorProps }from './components/errors/global';