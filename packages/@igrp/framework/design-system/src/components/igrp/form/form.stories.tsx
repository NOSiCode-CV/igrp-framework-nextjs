/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { z } from 'zod';
import { IGRPForm, type IGRPFormHandle } from './form';
import { Button } from '@/components/horizon/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/primitives/form';
import { Input } from '@/components/horizon/input';
import {
  IGRPCheckbox,
  IGRPInputHidden,
  IGRPInputNumber,
  IGRPInputText,
} from '@/components/igrp/input';

const meta: Meta<typeof IGRPForm> = {
  title: 'Components/Form',
  component: IGRPForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};
export default meta;

// ─── Schemas ─────────────────────────────────────────────────────────
const basicSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.coerce.number().min(1, 'Age must be at least 1'),
  remember: z.boolean().optional(),
  uuid: z.string().optional(),
});

const advancedSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  age: z.coerce.number().min(0),
  phone: z.string().min(8),
  address: z.string().min(5),
  city: z.string().min(2),
});

// ─── Fields ───────────────────────────────────────────────────────────
const BasicFields = () => (
  <>
    <IGRPInputHidden name='uuid' />
    <IGRPInputText
      name='name'
      label='Name'
      placeholder='John Doe'
      required
    />
    <IGRPInputText
      name='email'
      label='Email'
      placeholder='you@example.com'
      type='email'
      required
    />
    <IGRPInputNumber
      name='age'
      label='Age'
      placeholder='30'
      required
    />
    <IGRPCheckbox
      name='remember'
      label='Remember me'
    />
  </>
);

const AdvancedFields = () => (
  <>
    {[
      { name: 'firstName', label: 'First Name' },
      { name: 'lastName', label: 'Last Name' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'address', label: 'Address' },
      { name: 'city', label: 'City' },
    ].map(({ name, label, type }) => (
      <FormField
        key={name}
        name={name}
        render={({ field }) => (
          <FormItem className='col-span-12 sm:col-span-6'>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type={type}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))}
  </>
);

// ─── Stories ──────────────────────────────────────────────────────────

export const BasicExternalTrigger: StoryObj = {
  name: 'Basic - External Submit Button',
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof basicSchema> | null>(null);
    return (
      <div className='space-y-4'>
        <IGRPForm
          schema={basicSchema}
          onSubmit={(values) => alert(`Submitted externally: ${JSON.stringify(values)}`)}
          formRef={formRef}
        >
          <BasicFields />
        </IGRPForm>
        <Button onClick={() => formRef.current?.submit()}>Submit Externally</Button>
      </div>
    );
  },
};

export const AdvancedExternalTrigger: StoryObj = {
  name: 'Advanced - External Submit Button',
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof advancedSchema>>(null);
    return (
      <div className='space-y-4'>
        <IGRPForm
          schema={advancedSchema}
          onSubmit={(values) => console.log('Advanced External Submit:', values)}
          formRef={formRef}
        >
          <AdvancedFields />
        </IGRPForm>
        <Button
          onClick={() =>
            formRef.current?.handleSubmit((values) => console.log('Submit from button:', values))()
          }
        >
          Finish
        </Button>
      </div>
    );
  },
};
