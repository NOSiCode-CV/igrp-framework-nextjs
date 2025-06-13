import { SidebarData, MockDataProvider } from '../types';
import { isPreviewMode, getMockDataProvider, getAppCode } from '../utils/config';

export function useSidebarData() {
  // Versão simplificada que retorna dados mock diretamente
  const mockData: SidebarData = {
    menuItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'home',
        isActive: true
      },
      {
        id: 'pages',
        title: 'Páginas',
        href: '/pages',
        icon: 'file-text',
        children: [
          {
            id: 'pages-list',
            title: 'Listar Páginas',
            href: '/pages'
          },
          {
            id: 'pages-new',
            title: 'Nova Página',
            href: '/pages/new'
          }
        ]
      },
      {
        id: 'users',
        title: 'Utilizadores',
        href: '/users',
        icon: 'users'
      }
    ],
    collapsed: false,
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@igrp.com',
      avatar: '/api/placeholder/40/40',
      role: 'Administrator',
      permissions: ['read', 'write', 'admin']
    }
  };

  return { 
    data: mockData, 
    loading: false, 
    error: null 
  };
} 