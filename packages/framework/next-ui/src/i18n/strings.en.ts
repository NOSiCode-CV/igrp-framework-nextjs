import type { IGRPChromeStrings } from './strings.js';

export const IGRP_CHROME_STRINGS_EN: IGRPChromeStrings = {
  header: { settings: 'Settings' },
  navUser: {
    profile: 'Profile',
    notifications: 'Notifications',
    settings: 'Settings',
    logout: 'Sign out',
    unknownUser: 'N/A',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    empty: 'No notifications',
    viewAll: 'All notifications',
    unreadCount: '{count} unread',
  },
  modeSwitcher: {
    toggle: 'Toggle theme',
    switchToLight: 'Switch to the light theme',
    switchToDark: 'Switch to the dark theme',
  },
  commandSearch: {
    trigger: 'Search...',
    placeholder: 'Type a command or search...',
    empty: 'No results.',
    dialogTitle: 'Command palette',
    dialogDescription: 'Search for and run a command.',
  },
  breadcrumbs: { home: 'Home', ellipsis: 'Show remaining levels' },
  appSwitcher: { appCenter: 'Applications Center', unknown: 'N/A' },
  menus: {
    navAriaLabel: 'Main menu',
    searchPlaceholder: 'Search menus...',
    searchAriaLabel: 'Search menus',
    clearSearch: 'Clear search',
    emptyMenus: 'This application has no menus.',
    noResults: 'No results for "{query}".',
    resultCountOne: '{count} result',
    resultCountOther: '{count} results',
    toggleSubmenu: 'Open or close the {name} submenu',
    folderMenu: '{name} menu',
    opensInNewTab: '{name} (opens in a new tab)',
  },
  loading: { text: 'Please wait...' },
  authCarousel: { region: 'Highlights', goToSlide: 'Go to highlight {index}' },
  authForm: {
    loginButton: 'Sign in',
    signInError: 'Could not sign in. Please try again.',
    footerJoin: 'at',
  },
  layoutError: {
    header: 'The header could not be loaded.',
    sidebar: 'The navigation could not be loaded.',
    retry: 'Try again',
    retrying: 'Retrying…',
  },
  forbidden: {
    title: 'Access denied',
    description: 'You do not have permission to access this content.',
    home: 'Back to Home',
  },
  notFound: {
    subtitle: 'Page not found',
    description: 'Sorry, the page could not be found.',
    home: 'Back to Home',
    imageAlt: 'Page not found',
  },
  globalError: {
    title: 'An unexpected error occurred.',
    description:
      'Please try again. If the problem persists, contact the support team and quote the reference ID shown below.',
    reset: 'Try again',
    retrying: 'Retrying...',
    errorRef: 'Reference ID:',
  },
  segmentError: {
    title: 'An error occurred in this section.',
    description: 'Try again or go back home. If the problem persists, contact the support team.',
    home: 'Back to home',
    reset: 'Try again',
    retrying: 'Retrying...',
    errorRef: 'Reference ID:',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'IGRP configuration not initialized',
      description:
        'The application configuration file was not loaded. Contact the technical team to check the server startup.',
    },
    IGRP_CONFIG_INVALID: {
      title: 'Invalid IGRP configuration',
      description:
        'The application configuration has missing or invalid values. Check the IGRP configuration file and the environment variables.',
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Access management not configured',
      description:
        'The access management API URL is not set. Set the application environment variable or enable preview mode to continue.',
    },
    IGRP_APP_CODE_MISSING: {
      title: 'Application code missing',
      description:
        'The application did not declare its identifier code. Check the IGRP configuration file.',
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: 'Invalid application home URL',
      description:
        'NEXT_PUBLIC_IGRP_APP_HOME_SLUG does not start with "/". Fix the environment variable and restart the server.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: 'Invalid authentication configuration',
      description:
        'One or more environment variables required by the authentication provider are missing or incorrect.',
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Failed to load layout data',
      description:
        'The menus or user data could not be loaded. Try again; if it persists, contact support.',
    },
    IGRP_I18N_CONFIG_INVALID: {
      title: 'Invalid language configuration',
      description:
        "The application's language settings (IGRP_FORMAT_LOCALES or i18n) have missing or invalid values. Fix the configuration and restart the server.",
    },
  },
};
