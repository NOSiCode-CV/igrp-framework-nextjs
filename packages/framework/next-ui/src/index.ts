/* eslint-disable perfectionist/sort-exports */
'use client';

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do not alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// Auth components

export {
  IGRPAuthCarousel,
  type IGRPAuthCarouselProps,
  type IGRPCarousel,
} from './auths/carousel';

export {
  IGRPAuthForm,
  type IGRPAuthFormProps,
  type IGRPLoginTexts,
  type IGRPSiteLogo,
} from './auths/form';

// erros components

export { IGRPGlobalError, type IGRPGlobalErrorProps } from './errors/global';
export { IGRPSegmentError, type IGRPSegmentErrorProps } from './errors/segment';
export {
  IGRPLayoutErrorBoundary,
  useIGRPLayoutErrorReset,
} from './templates/layout-error-boundary';
export { useIGRPLayoutRetry } from './hooks/use-igrp-layout-retry';
export { IGRPHeaderSkeleton } from './templates/header-skeleton';
export { IGRPSidebarSkeleton } from './templates/sidebar-skeleton';
export { IGRPHeaderError } from './templates/header-error';
export { IGRPSidebarError } from './templates/sidebar-error';

// templates

export {
  IGRPTemplateAppSwitcher,
  type IGRPTemplateAppSwitcherProps,
} from './templates/app-switcher';

export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
  type BreadcrumbItem,
} from './templates/breadcrumbs';

export {
  IGRPTemplateCommandSearch,
  type IGRPTemplateCommandSearchProps,
  type IGRPCommandItem,
} from './templates/command-search';

export { IGRPTemplateHeader, type IGRPHeaderSlots } from './templates/header';

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps } from './templates/sidebar';

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps } from './templates/loading';

export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './templates/menus';

export { IGRPTemplateModeSwitcher } from './templates/mode-switcher';

export {
  IGRPTemplateNavUser,
  type IGRPTemplateNavUserProps,
} from './templates/nav-user';

export {
  IGRPTemplateNotFound,
  type IGRPTemplateNotFoundProps,
} from './templates/not-found';

export {
  IGRPTemplateNotifications,
  type IGRPTemplateNotificationsProps,
} from './templates/notifications';

export { IGRPSessionWatcher } from './templates/session-watcher';

export { IGRPTemplateThemeSelector } from './templates/theme-selector';

// providers

export {
  IGRPActiveThemeProvider,
  type IGRPActiveThemeProviderArgs,
} from './providers/active-theme';

export { IGRPNestedProviders, type IGRPNestedProvidersArgs } from './providers/nested';

export {
  IGRPRootProvidersFull,
  type IGRPRootProvidersFullProps,
} from './providers/root-full';

export {
  IGRPRootProvidersBlank,
  type IGRPRootProvidersBlankProps,
} from './providers/root-blank';

// @deprecated Use IGRPRootProvidersFull instead.
export { IGRPRootProviders, type IGRPRootProvidersArgs } from './providers/root';

export { IGRPSessionProvider } from './providers/session';

// permissions
export { IGRPSectionPermissions } from './permissions/section-permissions';
export { usePermissions } from './permissions/use-permissions';
export { IGRPForbidden, type IGRPForbiddenProps } from './permissions/forbidden';
export { IGRPAuthorization, type IGRPAuthorizationProps } from './permissions/authorization';
export { IGRPGuardPage } from './permissions/guard-page';
