import { statusSchema } from '@/schemas/global';

export const ROUTES = {
  APPLICATIONS: '/apps',
  APPS: '/apps',
  NEW_APPS: '/apps/new',
  USERS: '/users',
  USER_PROFILE: '/users/profile',
  DEPARTMENTS: '/departments',
  DEPARTMENTS_ROLE: 'roles',
  EDIT: '/edit',
} as const;

export const STATUS_OPTIONS = [
  { value: statusSchema.enum.ACTIVE, label: 'Ativo' },
  { value: statusSchema.enum.INACTIVE, label: 'Inativo' },
] as const;

export const OPEN_TYPE_VIEW = 'view';
