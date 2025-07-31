/* eslint-disable perfectionist/sort-exports */
'use client';

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// errs components
export { IGRPGlobalError, type IGRPGlobalErrorProps } from './components/errors/global';

// templates
export {
  IGRPTemplateAppSwitcher,
  type IGRPTemplateAppSwitcherProps,
} from './components/templates/app-switcher';

export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
} from './components/templates/breadcrumbs';

export { IGRPTemplateCommandSearch } from './components/templates/command-search';

export { IGRPTemplateHeader } from './components/templates/header';

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps } from './components/templates/loading';

export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './components/templates/menus';

export { IGRPTemplateModeSwitcher } from './components/templates/mode-switcher';

export {
  IGRPTemplateNavUser,
  type IGRPTemplateNavUserProps,
} from './components/templates/nav-user';

export { IGRPTemplateNavUserHeader } from './components/templates/nav-user-header';

export {
  IGRPTemplateNotFound,
  type IGRPTemplateNotFoundProps,
} from './components/templates/not-found';

export { IGRPTemplateNotifications } from './components/templates/notifications';

export { IGRPTemplateThemeSelector } from './components/templates/theme-selector';

// providers
export {
  IGRPActiveThemeProvider,
  type IGRPActiveThemeProviderArgs,
} from './components/providers/active-theme';
export { IGRPProgressBarProvider } from './components/providers/progress-bar';
export { IGRPRootProviders } from './components/providers/root';
export { IGRPSessionProvider } from './components/providers/session';
