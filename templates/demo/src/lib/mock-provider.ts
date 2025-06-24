import { MockDataProvider } from '@igrp/framework-next';

export const igrpMockDataProvider: MockDataProvider = {
  getHeaderData: async () => ({
   user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@igrp.com',
      image: '/api/placeholder/40/40',
      role: 'Administrator',
      permissions: ['read', 'write', 'admin'],
      fullname: 'Demo User',
      username: 'demo.user',
    },
    notifications: [
      {
        id: '1',
        title: 'Detecção Concluída',
        message: 'A análise de páginas foi concluída com sucesso',
        type: 'success',
        timestamp: new Date(),
        isRead: false
      },
      {
        id: '2',
        title: 'Novo Relatório',
        message: 'Relatório de permissões está disponível',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false
      },
      {
        id: '3',
        title: 'Sistema Atualizado',
        message: 'IGRP CLI Next foi atualizado para v3.0.0',
        type: 'success',
        timestamp: new Date(Date.now() - 7200000),
        isRead: true
      }
    ],
    quickActions: [
      {
        id: '1',
        title: 'Nova Detecção',
        icon: 'plus',
        href: '/detector'
      },
      {
        id: '2',
        title: 'Relatórios',
        icon: 'file-text',
        href: '/analytics'
      },
      {
        id: '3',
        title: 'Configurações',
        icon: 'settings',
        href: '/settings'
      }
    ]
  }),

  getSidebarData: async () => ({
    menuItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
        isActive: true,
      },
      {
        id: 'pages',
        title: 'Páginas',
        href: '/pages',
        icon: 'FileText',
        children: [
          {
            id: 'pages-list',
            title: 'Listar Páginas',
            href: '/pages',
          },
          {
            id: 'pages-new',
            title: 'Nova Página',
            href: '/pages/new',
          },
        ],
      },
      {
        id: 'users',
        title: 'Utilizadores',
        href: '/users',
        icon: 'Users',
      },
    ],
    collapsed: false,
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@igrp.com',
      image: '/api/placeholder/40/40',
      role: 'Administrator',
      permissions: ['read', 'write', 'admin'],
      fullname: 'Demo User',
      username: 'demo.user',
    },
    footerItems: [
      {
        id: 'settings',
        title: 'Settings',
        href: '/system-settings',
        icon: 'Settings2',
      },
    ],
  })
}; 