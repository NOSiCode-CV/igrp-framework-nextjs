import { statusSchema } from '@/schemas/global';

export const ROUTES = {
  APPLICATIONS: '/applications',
  APPS: '/apps',
  NEW_APPS: '/applications/new',
  USERS: '/user',
  USER_PROFILE: '/user/profile',
  DEPARTMENTS: '/departments',
  DEPARTMENTS_ROLE: 'roles',
  EDIT: '/editar',
} as const;

export const STATUS_OPTIONS = [
  { value: statusSchema.enum.ACTIVE, label: 'Ativo' },
  { value: statusSchema.enum.INACTIVE, label: 'Inativo' },
] as const;

export const OPEN_TYPE_VIEW = 'view';
