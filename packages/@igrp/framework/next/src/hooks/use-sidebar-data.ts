import type { SidebarData } from '../types';

export function useSidebarData() {
  const mockData: SidebarData = {
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
  };

  return {
    data: mockData,
    loading: false,
    error: null,
  };
}
