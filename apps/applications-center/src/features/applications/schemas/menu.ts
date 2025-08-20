import { z } from 'zod';

export const menuSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['FOLDER', 'EXTERNAL_PAGE', 'MENU_PAGE']),
  position: z.number().min(0),
  icon: z.string().min(1, 'Icon is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED']),
  target: z.enum(['INTERNAL', 'EXTERNAL']).optional(),
  url: z.string().optional(),
  parentId: z.number().nullable().optional(),
  applicationId: z.number().min(1, 'Application ID is required'),
  resourceId: z.number().nullable().optional(),
  createdBy: z.string().optional(),
  createdDate: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedDate: z.string().optional(),
});

export const baseMenySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['FOLDER', 'EXTERNAL_PAGE', 'MENU_PAGE']),
  position: z.number().min(0),
  icon: z.string().min(1, 'Icon is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED']),
  parentId: z.number().nullable().optional(),
  applicationId: z.number().min(1, 'Application ID is required'),
});

export const folderMenuSchema = baseMenySchema.extend({
  type: z.literal('FOLDER'),
});

export const menuPageSchema = baseMenySchema.extend({
  type: z.literal('MENU_PAGE'),
  resourceId: z.number().min(1, 'Resource is required'),
});

export const externalPageSchema = baseMenySchema.extend({
  type: z.literal('EXTERNAL_PAGE'),
  url: z.string().min(1, 'URL is required'),
  target: z.enum(['INTERNAL', 'EXTERNAL']),
});

export const createMenuSchema = z.discriminatedUnion('type', [
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
      applicationId: values.applicationId,
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  } else if (values.type === 'MENU_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      applicationId: values.applicationId,
      resourceId: values.resourceId,
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  } else if (values.type === 'EXTERNAL_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon,
      status: values.status,
      applicationId: values.applicationId,
      url: values.url,
      target: values.target,
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  }

  throw new Error('Invalid menu type');
};

export const normalizeMenuValues = (
  values: z.infer<typeof createMenuSchema> | z.infer<typeof updateMenuSchema>,
): Partial<MenuFormData> => {
  if (values.type === 'FOLDER') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon || '',
      status: values.status,
      applicationId: values.applicationId,
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  } else if (values.type === 'MENU_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon || '',
      status: values.status,
      applicationId: values.applicationId,
      resourceId: values.resourceId,
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  } else if (values.type === 'EXTERNAL_PAGE') {
    return {
      name: values.name,
      type: values.type,
      position: values.position,
      icon: values.icon || '',
      status: values.status,
      applicationId: values.applicationId,
      url: values.url,
      target: values.target || 'INTERNAL',
      ...(values.parentId !== null &&
        values.parentId !== undefined && { parentId: values.parentId }),
    };
  }

  return {
    name: values.name,
    type: values.type,
    position: values.position,
    icon: values.icon || '',
    status: values.status,
    applicationId: values.applicationId,
    ...(values.parentId !== null && values.parentId !== undefined && { parentId: values.parentId }),
  };
};

export type MenuFormData = z.infer<typeof menuSchema>;
export type CreateMenuFormData = z.infer<typeof createMenuSchema>;
export type UpdateMenuFormData = z.infer<typeof updateMenuSchema>;
export type FolderMenu = z.infer<typeof folderMenuSchema>;
export type MenuPage = z.infer<typeof menuPageSchema>;
export type ExternalPage = z.infer<typeof externalPageSchema>;
