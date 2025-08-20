import { z } from 'zod';
import { APPLICATIONS_TYPES } from '../lib/utils';
import { STATUS_TYPES } from '@/lib/constants';
import { fileWithPreviewSchema } from '@/schemas/file';

export const applicationSchema = z
  .object({
    owner: z.string().min(3, 'Proprietário é obrigatório'),
    name: z.string().min(3, 'Nome é obrigatório'),
    code: z
      .string()
      .regex(/^[A-Z0-9_]+$/, 'O código deve conter apenas letras, números e sublinhados')
      .min(2, 'Código é obrigatório'),
    type: z.enum(APPLICATIONS_TYPES),
    slug: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(STATUS_TYPES),
    departmentCode: z.string().min(3, 'Departamento é obrigatório'),
    picture: z.string().optional(),
    image: fileWithPreviewSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'INTERNAL' && !data.slug) {
      ctx.addIssue({
        path: ['slug'],
        code: z.ZodIssueCode.custom,
        message: 'URL Relativo é obrigatório',
      });
    }

    if (data.type === 'EXTERNAL') {
      if (!data.url) {
        ctx.addIssue({
          path: ['url'],
          code: z.ZodIssueCode.custom,
          message: 'URL é obrigatório',
        });
      } else {
        try {
          new URL(data.url);
        } catch {
          ctx.addIssue({
            path: ['url'],
            code: z.ZodIssueCode.custom,
            message: 'URL inválida',
          });
        }
      }
    }
  });

export type ApplicationType = z.infer<typeof applicationSchema>;
