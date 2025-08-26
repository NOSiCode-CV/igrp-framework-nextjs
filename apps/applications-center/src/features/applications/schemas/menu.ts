import { z } from 'zod';
import { 
  CreateMenuRequest, 
  MenuType, 
  Status, 
  UpdateMenuRequest 
} from '@igrp/platform-access-management-client-ts';

export const menuTypeSchema = z.enum(['GROUP','FOLDER', 'EXTERNAL_PAGE', 'MENU_PAGE']);

export const menuStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DELETED']);

export const menuTargetSchema = z.enum(['INTERNAL', 'EXTERNAL']);

export const menuSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Nome é obrigatório.'),
  type: z.string(menuTypeSchema).default('MENU_PAGE'),
  position: z.number().min(0),
  icon: z.string().min(1, 'Icone é obrigatório.'),
  status: z.string(menuStatusSchema).default('ACTIVE'),
  target: z.string(menuTargetSchema).default('INTERNAL'),
  url: z.string().optional(),
  parentCode: z.string().nullable().optional(),
  pageSlug: z.string().nullable().optional(),
  applicationCode: z.string().min(1, 'Aplicação é obrigatória.'),
  createdBy: z.string().optional(),
  createdDate: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedDate: z.string().optional(),
  permissions: z.array(z.string()).optional().nullable()
});

export const baseMenuSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  type: z.string(menuTypeSchema),
  position: z.number().min(0),
  icon: z.string().min(1, 'Icone é obrigatório.'),
  status: z.string(menuStatusSchema).default('ACTIVE'),
  parentCode: z.string().nullable().optional(),
  applicationCode: z.string().min(6, 'Código de aolicação é obrigatório'),
});

export const groupMenuSchema = baseMenuSchema.extend({
  type: z.literal('GROUP'),
});

export const folderMenuSchema = baseMenuSchema.extend({
  type: z.literal('FOLDER'),
});

export const menuPageSchema = baseMenuSchema.extend({
  type: z.literal('MENU_PAGE'),
  pageSlug: z.string().min(3, 'Url Relativo é obrigatório'),
});

export const externalPageSchema = baseMenuSchema.extend({
  type: z.literal('EXTERNAL_PAGE'),
  url: z.string().min(1, 'URL Completo é obrigatório'),
  target: z.literal('EXTERNAL'),
});

export const createMenuSchema = z.discriminatedUnion('type', [
  groupMenuSchema,
  folderMenuSchema,
  menuPageSchema,
  externalPageSchema,
]);

export const updateMenuSchema = menuSchema.partial().omit({
  id: true,
  createdBy: true,
  createdDate: true,
  lastModifiedBy: true,
  lastModifiedDate: true,
});

export const createMenuPayload = (values: z.infer<typeof createMenuSchema>) => {
  if (values.type === 'FOLDER') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      applicationCode: values.applicationCode,
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  } else if (values.type === 'MENU_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      applicationCode: values.applicationCode,      
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  } else if (values.type === 'EXTERNAL_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      applicationCode: values.applicationCode,
      url: values.url,
      target: values.target,
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  }

  throw new Error('Tipo invalido');
};

export const normalizeMenuValues = (
  values: z.infer<typeof createMenuSchema> | z.infer<typeof updateMenuSchema>,
): CreateMenuRequest | UpdateMenuRequest => {
  if (values.type === 'FOLDER') {
    return {
      name: values.name,
      type: values.type as MenuType,
      position: values.position,
      icon: values.icon || '',
      status: values.status as Status,
      applicationCode: values.applicationCode,
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  } else if (values.type === 'MENU_PAGE') {
    return {
      name: values.name,
      type: values.type as MenuType,
      position: values.position,
      icon: values.icon || '',
      status: values.status as Status,
      applicationCode: values.applicationCode,
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  } else if (values.type === 'EXTERNAL_PAGE') {
    return {
      name: values.name,
      type: values.type as MenuType,
      position: values.position,
      icon: values.icon || '',
      status: values.status as Status,
      applicationCode: values.applicationCode,
      url: values.url,
      target: values.target || 'INTERNAL',
      ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
    };
  }

  return {
    name: values.name,
    type: values.type as MenuType,
    position: values.position,
    icon: values.icon || '',
    status: values.status as Status,
    applicationCode: values.applicationCode,
    ...(values.parentCode !== undefined && { parentCode: values.parentCode }),
  };
};

export type MenuFormData = z.infer<typeof menuSchema>;
export type CreateMenuFormData = z.infer<typeof createMenuSchema>;
export type UpdateMenuFormData = z.infer<typeof updateMenuSchema>;
export type FolderMenu = z.infer<typeof folderMenuSchema>;
export type MenuPage = z.infer<typeof menuPageSchema>;
export type ExternalPage = z.infer<typeof externalPageSchema>;
