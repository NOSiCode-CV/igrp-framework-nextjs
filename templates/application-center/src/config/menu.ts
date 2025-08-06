import {
  AppWindowIcon,
  GalleryVerticalEnd,
  GlobeLock,
  Home,
  Library,
  Settings2,
  UserCog,
  Users,
} from 'lucide-react';

export const menuConfig = {
  user: {
    name: 'igrp',
    email: 'user@igrp.com',
    avatar: '',
  },
  teams: {
    name: 'IGRP',
    logo: {
      src: '/igrp/logo-no-text.png',
      srcDark: '/igrp/logo-negative.png',
    },
    icon: GalleryVerticalEnd,
    description: 'App Center',
  },
  navMain: [
    {
      title: 'Página Inicial',
      url: '/',
      icon: Home,
    },
    {
      title: 'Bibliotecas',
      url: 'https://igrp.cv',
      icon: Library,
    },
  ],
  navAccess: [
    {
      title: 'Gestão de Aplicações',
      url: '/applications',
      icon: AppWindowIcon,
    },
    {
      title: 'Gestão de Acesso',
      url: '#',
      icon: UserCog,
      items: [
        {
          title: 'Utilizadores',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Departamentos',
          url: '/department',
          icon: GlobeLock,
        },
      ],
    },
  ],
  navFooter: {
    title: 'Settings',
    url: '/system-settings',
    icon: Settings2,
  },
};

export type MenuConfig = typeof menuConfig;
