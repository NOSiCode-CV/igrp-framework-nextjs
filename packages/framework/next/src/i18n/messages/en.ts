import type { IGRPFrameworkMessages } from './pt.js';

export const IGRP_MESSAGES_EN: IGRPFrameworkMessages = {
  common: {
    actions: {
      backHome: 'Back to home',
      retry: 'Try again',
      retrying: 'Retrying...',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      close: 'Close',
      search: 'Search',
      loading: 'Loading...',
      loadingApp: 'Loading {name}...',
    },
    notAvailable: 'N/A',
    yes: 'Yes',
    no: 'No',
  },
  i18n: {
    localeSwitcher: {
      label: 'Language',
      changeError: 'The language could not be changed. Please try again.',
    },
  },
  errors: {
    errorRef: 'Reference ID:',
    unexpected: {
      title: 'An unexpected error occurred.',
      description:
        'Please try again. If the problem persists, contact the support team and quote the reference ID shown below.',
    },
    auth: {
      title: 'Authentication could not be completed.',
      description:
        'Check the authentication provider configuration and the environment variables. If the problem persists, contact support.',
    },
    status: {
      '401': 'Sign-in required',
      '403': 'Access denied',
      '404': 'Page not found',
      '500': 'Internal error',
      '503': 'Service unavailable',
      fallback: 'Something went wrong',
    },
  },
};
