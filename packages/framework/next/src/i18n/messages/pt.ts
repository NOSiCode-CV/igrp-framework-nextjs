/** Generic namespaces every IGRP app gets. Apps own every other namespace and may shadow these keys. */
export const IGRP_MESSAGES_PT = {
  common: {
    actions: {
      backHome: 'Voltar ao início',
      retry: 'Tentar novamente',
      retrying: 'A tentar...',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      close: 'Fechar',
      search: 'Pesquisar',
      loading: 'A carregar...',
      loadingApp: 'A carregar {name}...',
    },
    notAvailable: 'N/D',
    yes: 'Sim',
    no: 'Não',
  },
  i18n: {
    localeSwitcher: {
      label: 'Idioma',
      changeError: 'Não foi possível alterar o idioma. Tente novamente.',
    },
  },
  errors: {
    errorRef: 'ID de referência:',
    unexpected: {
      title: 'Ocorreu um erro inesperado.',
      description:
        'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
    },
    auth: {
      title: 'Não foi possível concluir a autenticação.',
      description:
        'Verifique a configuração do provedor de autenticação e as variáveis de ambiente. Se o problema persistir, contacte o suporte.',
    },
    actions: {
      SESSION_INVALID: 'Sessão inválida ou expirada.',
      MENUS_LOAD_FAILED: 'Não foi possível carregar os menus.',
      USER_LOAD_FAILED: 'Não foi possível carregar os dados do utilizador.',
      APPS_LOAD_FAILED: 'Não foi possível carregar as aplicações.',
      APP_LOAD_FAILED: 'Não foi possível carregar os dados da aplicação.',
    },
    status: {
      '401': 'Sessão necessária',
      '403': 'Acesso negado',
      '404': 'Página não encontrada',
      '500': 'Erro interno',
      '503': 'Serviço indisponível',
      fallback: 'Ocorreu um erro',
    },
  },
};

export type IGRPFrameworkMessages = typeof IGRP_MESSAGES_PT;
