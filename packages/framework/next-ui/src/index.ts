/* eslint-disable perfectionist/sort-exports */
'use client';

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do not alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// Auth components

export {
  IGRPAuthCarousel,
  type IGRPAuthCarouselProps,
  type IGRPCarousel,
} from './auths/carousel.js';

export {
  IGRPAuthForm,
  type IGRPAuthFormProps,
  type IGRPLoginTexts,
  type IGRPSiteLogo,
} from './auths/form.js';

// erros components

export { IGRPGlobalError, type IGRPGlobalErrorProps } from './errors/global.js';
export { IGRPSegmentError, type IGRPSegmentErrorProps } from './errors/segment.js';
export {
  IGRPLayoutErrorBoundary,
  useIGRPLayoutErrorReset,
} from './templates/layout-error-boundary.js';
export { useIGRPLayoutRetry } from './hooks/use-igrp-layout-retry.js';
export { IGRPHeaderSkeleton } from './templates/header-skeleton.js';
export { IGRPSidebarSkeleton } from './templates/sidebar-skeleton.js';
export { IGRPHeaderError } from './templates/header-error.js';
export { IGRPSidebarError } from './templates/sidebar-error.js';

// templates

export {
  IGRPTemplateAppSwitcher,
  type IGRPTemplateAppSwitcherProps,
} from './templates/app-switcher.js';

export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
  type BreadcrumbItem,
} from './templates/breadcrumbs.js';

export {
  IGRPTemplateCommandSearch,
  IGRP_COMMAND_SEARCH_LABELS_PT_PT,
  type IGRPTemplateCommandSearchProps,
  type IGRPCommandItem,
  type IGRPCommandSearchLabels,
} from './templates/command-search.js';

export { IGRPTemplateHeader, type IGRPHeaderSlots } from './templates/header.js';

export { IGRPTemplateImage, type IGRPTemplateImageProps } from './templates/template-image.js';

export { IGRPTemplateSidebar, type IGRPTemplateSidebarProps } from './templates/sidebar.js';

export { IGRPTemplateLoading, type IGRPTemplateLoadingProps } from './templates/loading.js';

export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './templates/menus.js';

export {
  IGRP_MENU_LABELS_PT_PT,
  resolveMenuLabels,
  type IGRPMenuLabels,
} from './templates/menus.js';

export {
  IGRPTemplateModeSwitcher,
  IGRP_MODE_SWITCHER_LABELS_PT_PT,
  type IGRPTemplateModeSwitcherProps,
  type IGRPModeSwitcherLabels,
} from './templates/mode-switcher.js';

export {
  IGRPTemplateNavUser,
  IGRP_NAV_USER_LABELS_PT_PT,
  type IGRPTemplateNavUserProps,
  type IGRPNavUserLabels,
} from './templates/nav-user.js';

export { IGRPTemplateNotFound, type IGRPTemplateNotFoundProps } from './templates/not-found.js';

export {
  IGRPTemplateNotifications,
  IGRP_NOTIFICATIONS_LABELS_PT_PT,
  type IGRPTemplateNotificationsProps,
  type IGRPNotificationsLabels,
} from './templates/notifications.js';

export { IGRPSessionWatcher } from './templates/session-watcher.js';

export {
  IGRPTemplateThemeSelector,
  IGRP_THEME_SELECTOR_LABELS_PT_PT,
  IGRP_DEFAULT_THEMES,
  IGRP_SCALED_THEMES,
  type IGRPTemplateThemeSelectorProps,
  type IGRPThemeSelectorLabels,
  type IGRPThemeOption,
} from './templates/theme-selector.js';

// providers

export {
  IGRPActiveThemeProvider,
  useIGRPThemeConfig,
  igrpActiveThemeClassName,
  IGRP_ACTIVE_THEME_COOKIE,
  type IGRPActiveThemeProviderArgs,
} from './providers/active-theme.js';

export { IGRPThemeProvider } from './providers/theme.js';

export { IGRPNestedProviders, type IGRPNestedProvidersArgs } from './providers/nested.js';

export { IGRPRootProvidersFull, type IGRPRootProvidersFullProps } from './providers/root-full.js';

export {
  IGRPRootProvidersBlank,
  type IGRPRootProvidersBlankProps,
} from './providers/root-blank.js';

/**
 * @deprecated Use {@link IGRPRootProvidersFull}. A `//` comment gave editors
 * nothing to strike through, so the deprecation was invisible at the call site.
 */
export { IGRPRootProviders, type IGRPRootProvidersArgs } from './providers/root.js';

export { IGRPSessionProvider } from './providers/session.js';

// permissions
export { IGRPSectionPermissions } from './permissions/section-permissions.js';
export { usePermissions } from './permissions/use-permissions.js';
export { IGRPForbidden, type IGRPForbiddenProps } from './permissions/forbidden.js';
export {
  IGRPAuthorization,
  igrpIsAllowedBy,
  type IGRPAuthorizationProps,
} from './permissions/authorization.js';
export { IGRPGuardPage, type IGRPGuardPageProps } from './permissions/guard-page.js';
