import { z } from 'zod';

export const applicationSchema = z
  .object({
    owner: z.string().min(3, 'Owner is required'),
    name: z.string().min(3, 'Name is required'),
    code: z
      .string()
      .regex(/^[A-Z0-9_]+$/, 'Code must only contain letters, numbers, and underscores')
      .min(2, 'Code is required'),
    type: z.enum(['INTERNAL', 'EXTERNAL']),
    slug: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    picture: z.string().optional(),
    userPermissions: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'INTERNAL' && !data.slug) {
      ctx.addIssue({
        path: ['slug'],
        code: z.ZodIssueCode.custom,
        message: 'Slug is required',
      });
    }

    if (data.type === 'EXTERNAL') {
      if (!data.url) {
        ctx.addIssue({
          path: ['url'],
          code: z.ZodIssueCode.custom,
          message: 'URL is required',
        });
      } else {
        try {
          new URL(data.url);
        } catch {
          ctx.addIssue({
            path: ['url'],
            code: z.ZodIssueCode.custom,
            message: 'Invalid URL',
          });
        }
      }
    }
  });

export type ApplicationProps = z.infer<typeof applicationSchema>;
