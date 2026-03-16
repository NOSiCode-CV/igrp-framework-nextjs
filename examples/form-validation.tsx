/**
 * Form with validation example using IGRP Design System.
 * Shows zod validation rules and error handling.
 */
'use client';

import { useRef } from 'react';
import {
  IGRPForm,
  IGRPFormField,
  IGRPInputText,
  IGRPInputNumber,
  IGRPSelect,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  age: z.number().min(18, 'Must be 18+').max(120, 'Invalid age'),
  role: z.enum(['admin', 'user', 'guest']),
});

type FormValues = z.infer<typeof schema>;

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' },
];

export function FormValidationExample() {
  const formRef = useRef(null);

  const handleSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <IGRPForm schema={schema} onSubmit={handleSubmit} formRef={formRef}>
      <IGRPFormField name="name" label="Full Name" required>
        <IGRPInputText name="name" placeholder="John Doe" />
      </IGRPFormField>
      <IGRPFormField name="age" label="Age" required>
        <IGRPInputNumber name="age" placeholder="25" />
      </IGRPFormField>
      <IGRPFormField name="role" label="Role" required>
        <IGRPSelect name="role" options={roleOptions} placeholder="Select role" />
      </IGRPFormField>
      <IGRPButton type="submit">Save</IGRPButton>
    </IGRPForm>
  );
}
