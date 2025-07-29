import { z } from 'zod';

export const convertValuesToFormData = <TSchema extends z.ZodTypeAny>(
  values: z.infer<TSchema>,
): FormData => {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return formData;
};
