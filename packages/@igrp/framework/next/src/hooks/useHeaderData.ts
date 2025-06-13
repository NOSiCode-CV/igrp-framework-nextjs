import { HeaderData, MockDataProvider } from '../types';
import { isPreviewMode, getMockDataProvider, getAppCode } from '../utils/config';

export function useHeaderData() {
  // Versão simplificada que retorna dados mock diretamente
  const mockData: HeaderData = {
    user: {
      id: '1',
      name: 'Demo User',
      email: 'demo@igrp.com',
      avatar: '/api/placeholder/40/40',
      role: 'Administrator',
      permissions: ['read', 'write', 'admin']
    },
    notifications: [
      {
        id: '1',
        title: 'Sistema Atualizado',
        message: 'O sistema foi atualizado com sucesso',
        type: 'success',
        timestamp: new Date(),
        isRead: false
      }
    ],
    quickActions: [
      {
        id: '1',
        title: 'Nova Página',
        icon: 'plus',
        href: '/pages/new'
      }
    ]
  };

  return { 
    data: mockData, 
    loading: false, 
    error: null 
  };
} 