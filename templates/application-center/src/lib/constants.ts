export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
] as const;

export const STATUS_TYPES = ['ACTIVE', 'INACTIVE', 'DELETED'] as const;

export const ROUTES = {
  APPS: '/apps',
  NEW_APPS: '/apps/novo',
} as const;
