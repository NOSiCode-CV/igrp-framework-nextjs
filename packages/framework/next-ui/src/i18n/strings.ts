/**
 * Chrome string catalog: every user-visible default string of the template
 * surfaces this package owns. One interface, three catalogs (`_PT` here,
 * `strings.en.ts`, `strings.fr.ts`), kept in step by `__tests__/parity.test.ts`.
 *
 * Strings use `{token}` placeholders (`igrpFormatMessage`); no plurals.
 * Components read the catalog through `useIGRPChromeI18n()` and still accept
 * their label props, which win over the catalog.
 */

/** Platform error codes thrown by `@igrp/framework-next` (`IgrpErrorCode`), restated here because this package precedes it. */
export type IGRPChromeErrorCode =
  | 'IGRP_CONFIG_NOT_INITIALIZED'
  | 'IGRP_CONFIG_INVALID'
  | 'IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING'
  | 'IGRP_APP_CODE_MISSING'
  | 'IGRP_APP_HOME_SLUG_INVALID'
  | 'IGRP_AUTH_CONFIG_INVALID'
  | 'IGRP_LAYOUT_DATA_FAILED'
  | 'IGRP_I18N_CONFIG_INVALID';

export interface IGRPErrorCopy {
  title: string;
  description: string;
}

export interface IGRPNavUserLabels {
  profile: string;
  notifications: string;
  settings: string;
  logout: string;
  /** Shown in place of a missing user name. */
  unknownUser: string;
}

export interface IGRPNotificationsLabels {
  /** Dropdown heading and the trigger's screen-reader name. */
  title: string;
  markAllRead: string;
  empty: string;
  viewAll: string;
  /** Unread-count announcement. `{count}` is substituted. */
  unreadCount: string;
}

export interface IGRPModeSwitcherLabels {
  toggle: string;
  switchToLight: string;
  switchToDark: string;
}

export interface IGRPCommandSearchLabels {
  trigger: string;
  placeholder: string;
  empty: string;
  dialogTitle: string;
  dialogDescription: string;
}

export interface IGRPMenuLabels {
  navAriaLabel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  clearSearch: string;
  emptyMenus: string;
  /** `{query}` is substituted. */
  noResults: string;
  /** `{count}` is substituted; exactly one. */
  resultCountOne: string;
  /** `{count}` is substituted; zero or many. */
  resultCountOther: string;
  /** `{name}` is substituted. */
  toggleSubmenu: string;
  /** `{name}` is substituted. */
  folderMenu: string;
  /** `{name}` is substituted. */
  opensInNewTab: string;
}

export interface IGRPChromeStrings {
  header: {
    /** Accessible name of the settings link. */
    settings: string;
  };
  navUser: IGRPNavUserLabels;
  notifications: IGRPNotificationsLabels;
  modeSwitcher: IGRPModeSwitcherLabels;
  commandSearch: IGRPCommandSearchLabels;
  breadcrumbs: {
    home: string;
    ellipsis: string;
  };
  appSwitcher: {
    appCenter: string;
    unknown: string;
  };
  menus: IGRPMenuLabels;
  loading: {
    text: string;
  };
  authCarousel: {
    region: string;
    /** `{index}` is substituted. */
    goToSlide: string;
  };
  authForm: {
    /** Primary action of the login form. */
    loginButton: string;
    signInError: string;
    /** Word between the two footer links ("iGRP *na* NOSi"). */
    footerJoin: string;
  };
  /** Fallbacks of the header and sidebar error boundaries (`IGRPHeaderError`, `IGRPSidebarError`). */
  layoutError: {
    header: string;
    sidebar: string;
    retry: string;
    retrying: string;
  };
  forbidden: {
    title: string;
    description: string;
    home: string;
  };
  notFound: {
    subtitle: string;
    description: string;
    home: string;
    imageAlt: string;
  };
  globalError: {
    title: string;
    description: string;
    reset: string;
    retrying: string;
    errorRef: string;
  };
  segmentError: {
    title: string;
    description: string;
    home: string;
    reset: string;
    retrying: string;
    errorRef: string;
  };
  errorCodes: Record<IGRPChromeErrorCode, IGRPErrorCopy>;
}

export const IGRP_CHROME_STRINGS_PT: IGRPChromeStrings = {
  header: { settings: 'Definições' },
  navUser: {
    profile: 'Perfil',
    notifications: 'Notificações',
    settings: 'Definições',
    logout: 'Terminar sessão',
    unknownUser: 'N/D',
  },
  notifications: {
    title: 'Notificações',
    markAllRead: 'Marcar todas como lidas',
    empty: 'Sem notificações',
    viewAll: 'Todas as notificações',
    unreadCount: '{count} por ler',
  },
  modeSwitcher: {
    toggle: 'Alternar tema',
    switchToLight: 'Mudar para o tema claro',
    switchToDark: 'Mudar para o tema escuro',
  },
  commandSearch: {
    trigger: 'Pesquisar...',
    placeholder: 'Digite um comando ou pesquisa...',
    empty: 'Sem resultados.',
    dialogTitle: 'Paleta de comandos',
    dialogDescription: 'Pesquise e execute um comando.',
  },
  breadcrumbs: { home: 'Página inicial', ellipsis: 'Mostrar restantes níveis' },
  appSwitcher: { appCenter: 'Centro de Aplicações', unknown: 'N/D' },
  menus: {
    navAriaLabel: 'Menu principal',
    searchPlaceholder: 'Pesquisar menus...',
    searchAriaLabel: 'Pesquisar menus',
    clearSearch: 'Limpar pesquisa',
    emptyMenus: 'Aplicação sem menus.',
    noResults: 'Sem resultados para "{query}".',
    resultCountOne: '{count} resultado',
    resultCountOther: '{count} resultados',
    toggleSubmenu: 'Abrir ou fechar o submenu {name}',
    folderMenu: 'Menu {name}',
    opensInNewTab: '{name} (abre num novo separador)',
  },
  loading: { text: 'Aguarde...' },
  authCarousel: { region: 'Destaques', goToSlide: 'Ir para o destaque {index}' },
  authForm: {
    loginButton: 'Iniciar sessão',
    signInError: 'Não foi possível iniciar sessão. Tente novamente.',
    footerJoin: 'na',
  },
  layoutError: {
    header: 'Falha ao carregar o cabeçalho.',
    sidebar: 'Falha ao carregar a navegação.',
    retry: 'Tentar novamente',
    retrying: 'A tentar…',
  },
  forbidden: {
    title: 'Acesso negado',
    description: 'Não tem permissão para aceder a este conteúdo.',
    home: 'Voltar à Página Inicial',
  },
  notFound: {
    subtitle: 'Página não encontrada',
    description: 'Desculpe, a página não foi encontrada.',
    home: 'Voltar à Página Inicial',
    imageAlt: 'Página não encontrada',
  },
  globalError: {
    title: 'Ocorreu um erro inesperado.',
    description:
      'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
    reset: 'Tentar novamente',
    retrying: 'A tentar...',
    errorRef: 'ID de referência:',
  },
  segmentError: {
    title: 'Ocorreu um erro nesta secção.',
    description:
      'Tente novamente ou volte ao início. Se o problema persistir, contacte a equipa de suporte.',
    home: 'Voltar ao início',
    reset: 'Tentar novamente',
    retrying: 'A tentar...',
    errorRef: 'ID de referência:',
  },
  errorCodes: {
    IGRP_CONFIG_NOT_INITIALIZED: {
      title: 'Configuração do IGRP não inicializada',
      description:
        'O ficheiro de configuração da aplicação não foi carregado. Contacte a equipa técnica para verificar o arranque do servidor.',
    },
    IGRP_CONFIG_INVALID: {
      title: 'Configuração do IGRP inválida',
      description:
        'A configuração da aplicação contém valores em falta ou inválidos. Verifique o ficheiro de configuração do IGRP e as variáveis de ambiente.',
    },
    IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: {
      title: 'Gestão de acesso não configurada',
      description:
        'A URL da API de gestão de acesso não está definida. Defina a variável de ambiente da aplicação ou active o modo de pré-visualização para continuar.',
    },
    IGRP_APP_CODE_MISSING: {
      title: 'Código da aplicação em falta',
      description:
        'A aplicação não declarou o seu código identificador. Verifique o ficheiro de configuração do IGRP.',
    },
    IGRP_APP_HOME_SLUG_INVALID: {
      title: 'URL inicial da aplicação inválida',
      description:
        'O valor de NEXT_PUBLIC_IGRP_APP_HOME_SLUG não começa por "/". Corrija a variável de ambiente e reinicie o servidor.',
    },
    IGRP_AUTH_CONFIG_INVALID: {
      title: 'Configuração de autenticação inválida',
      description:
        'Uma ou mais variáveis de ambiente necessárias ao provedor de autenticação estão em falta ou incorrectas.',
    },
    IGRP_LAYOUT_DATA_FAILED: {
      title: 'Falha ao carregar os dados de layout',
      description:
        'Não foi possível carregar os menus ou dados do utilizador. Tente novamente; se persistir, contacte o suporte.',
    },
    IGRP_I18N_CONFIG_INVALID: {
      title: 'Configuração de idiomas inválida',
      description:
        'A configuração de idiomas da aplicação (IGRP_FORMAT_LOCALES ou i18n) contém valores em falta ou inválidos. Corrija a configuração e reinicie o servidor.',
    },
  },
};
