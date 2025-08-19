import type { ChangeEvent } from 'react';
import type { UseFormReturn, FieldValues, ControllerRenderProps } from 'react-hook-form';

const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export function handleImageUpload<T extends FieldValues>(
  e: ChangeEvent<HTMLInputElement>,
  field: ControllerRenderProps<T, any>,
  form: UseFormReturn<T>,
) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    form.setError(field.name as any, {
      type: 'manual',
      message: 'Apenas ficheiros de imagem são permitidos.',
    });
    e.target.value = '';
    return;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !validExtensions.includes(ext)) {
    form.setError(field.name as any, {
      type: 'manual',
      message: 'Extensão inválida.',
    });
    e.target.value = '';
    return;
  }

  form.clearErrors(field.name as any);
  field.onChange(file);
}
