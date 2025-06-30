/* eslint-disable perfectionist/sort-exports */

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// hooks

import './index.css';

export { META_THEME_COLORS, useMetaColor } from "./hooks/use-meta-color";

export { IGRPThemeSelector } from './components/horizon/theme-selector';

export { IGRPRootProviders } from './providers/root';

export * from "../types/globals";