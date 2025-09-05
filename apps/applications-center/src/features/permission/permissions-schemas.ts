import { z } from 'zod';

export const permissionStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

// Keep this as a ZodString so .min() works
const trimmed = z.string().trim();

// For description we DO want a transform ("" -> null)
const emptyToNull = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable();

export const permissionFormSchema = z
  .object({
    id: z.number().int().nonnegative().optional(),
    name: trimmed.min(3, 'Nome da permissão é obrigatório'),
    description: emptyToNull.optional(), // "" -> null
    applicationCode: trimmed.min(3, 'Aplicação é obrigatória'),
    status: permissionStatusSchema,
  })
  .strict();

export type PermissionFormValues = z.infer<typeof permissionFormSchema>;

export const createPermissionSchema = z
  .object({
    name: trimmed.min(3, 'O nome é obrigatório.'),
    description: emptyToNull.optional(),
    applicationCode: trimmed.min(3, 'Código da aplicação é obrigatório.'),
  })
  .strict();

export type CreatePermissionType = z.infer<typeof createPermissionSchema>;

export const updatePermissionSchema = z
  .object({
    name: trimmed.min(3).optional(),
    description: emptyToNull.optional(),
    status: permissionStatusSchema.optional(),
    applicationCode: trimmed.min(3).optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, {
    message: 'É necessário fornecer pelo menos um campo para atualização.',
  });

export type UpdatePermissionType = z.infer<typeof updatePermissionSchema>;
