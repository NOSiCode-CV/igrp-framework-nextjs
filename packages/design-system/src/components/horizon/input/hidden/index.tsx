'use client';

import { useId } from 'react';
import { useFormContext } from 'react-hook-form';

import { Input } from '../../../primitives/input';
import { IGRPFormField } from '../../form/form-field';
import type { IGRPInputProps } from '../../../../types';

function IGRPInputHidden({ name, required = false, ...props }: Omit<IGRPInputProps, 'showIcon'>) {
  const id = useId();
  const ref = name || id;

  const formContext = useFormContext();

  if (!formContext) {
    return <Input id={ref} name={ref} required={required} type="hidden" {...props} />;
  }

  return (
    <IGRPFormField name={ref} control={formContext.control}>
      {(field) => (
        <Input id={ref} required={required} type="hidden" {...field} {...props} name={ref} />
      )}
    </IGRPFormField>
  );
}

export { IGRPInputHidden };
