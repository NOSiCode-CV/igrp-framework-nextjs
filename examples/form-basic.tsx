/**
 * Basic form example using IGRP Design System.
 * Copy into your app or use as reference.
 */
'use client';

import { useRef } from 'react';
import {
  IGRPForm,
  IGRPFormField,
  IGRPInputText,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

type FormValues = z.infer<typeof schema>;

export function FormBasicExample() {
  const formRef = useRef(null);

  const handleSubmit = (values: FormValues) => {
    console.log(values);
  };

  return (
    <IGRPForm schema={schema} onSubmit={handleSubmit} formRef={formRef}>
      <IGRPFormField name="name" label="Name" required>
        <IGRPInputText name="name" placeholder="Enter your name" />
      </IGRPFormField>
      <IGRPFormField name="email" label="Email" required>
        <IGRPInputText name="email" type="email" placeholder="email@example.com" />
      </IGRPFormField>
      <IGRPButton type="submit">Submit</IGRPButton>
    </IGRPForm>
  );
}
