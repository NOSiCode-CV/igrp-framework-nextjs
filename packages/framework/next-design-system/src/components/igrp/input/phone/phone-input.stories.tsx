import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { IGRPInputPhone, type IGRPInputPhoneProps } from '.';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IGRPButton } from '@/components/igrp/button';

export default {
  title: 'Components/Input/Phone',
  component: IGRPInputPhone,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    international: { control: 'boolean' },
    defaultCountry: {
      control: 'select',
      options: [undefined, 'US', 'CA', 'GB', 'BR', 'PT', 'DE', 'FR', 'AU', 'JP'],
    },
    countries: { control: 'object' },
    defaultValue: { control: 'text' },
    dir: { control: 'radio', options: ['ltr', 'rtl'] },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputPhoneProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
    <IGRPInputPhone
      {...args}
      onChange={(value) => console.log('Phone number changed:', value)}
    />
  </div>
);

const FormTemplate: StoryFn<IGRPInputPhoneProps> = (args) => {
  const schema = z.object({
    [args.name]: z
      .string()
      .min(1, 'Número de telefone é obrigatório')
      .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de número de telefone inválido'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`Número de telefone: ${data[args.name]}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputPhone {...args} />

          <IGRPButton
            type='submit'
            className='w-full mt-4'
          >
            Confirmar
          </IGRPButton>
        </form>
      </FormProvider>
    </div>
  );
};

export const Default: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    placeholder: 'Enter phone number',
  },
};

export const WithDefaultCountry: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'US Phone Number',
    defaultCountry: 'US',
    placeholder: 'Enter US phone number',
  },
};

export const WithDescription: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    description: "We'll use this number to send you order updates",
    placeholder: 'Enter phone number',
  },
};

export const NationalFormat: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number (National Format)',
    international: false,
    defaultCountry: 'CV',
    placeholder: 'Enter phone number',
  },
};

export const LimitedCountries: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    countries: ['CV', 'PT'],
    defaultCountry: 'CV',
    placeholder: 'Enter phone number',
  },
};

export const Required: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    required: true,
    placeholder: 'Enter phone number (required)',
  },
};

export const Disabled: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    disabled: true,
    defaultValue: '+1234567890',
    placeholder: 'Field is disabled',
  },
};

export const WithError: StoryObj<IGRPInputPhoneProps> = {
  render: Template,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    error: 'Invalid phone number format',
    placeholder: 'Enter phone number',
  },
};

export const WithFormValidation: StoryObj<IGRPInputPhoneProps> = {
  render: FormTemplate,
  args: {
    name: 'phoneNumber',
    label: 'Phone Number',
    required: true,
    helperText: 'Enter a valid international phone number',
    placeholder: 'e.g. +1 555 123 4567',
    defaultCountry: 'US',
  },
};
