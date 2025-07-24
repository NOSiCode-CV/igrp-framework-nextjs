import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IGRPInputPassword, type IGRPInputPasswordProps } from '.';
import { IGRPButton } from '@/components/igrp/button';

export default {
  title: 'Components/Input/Password',
  component: IGRPInputPassword,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showPasswordToggle: { control: 'boolean' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputPasswordProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputPassword
      {...args}
      onChange={(value) => console.log('Password changed:', value)}
    />
  </div>
);

const FormTemplate: StoryFn<IGRPInputPasswordProps> = (args) => {
  const schema = z.object({
    [args.name]: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`Senha definida com sucesso!`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputPassword {...args} />

          <IGRPButton
            type='submit'
            className='w-full mt-4'
          >
            Confirmar Senha
          </IGRPButton>
        </form>
      </FormProvider>
    </div>
  );
};

export const Default: StoryObj<IGRPInputPasswordProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
  },
};

export const WithHelperText: StoryObj<IGRPInputPasswordProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Password',
    helperText: 'Password must be at least 8 characters long',
    placeholder: 'Enter your password',
  },
};

export const WithoutToggle: StoryObj<IGRPInputPasswordProps> = {
  render: Template,

  args: {
    name: 'password',
    label: 'Password',
    showPasswordToggle: false,
    placeholder: 'Enter your password',
  },
};

export const Required: StoryObj<IGRPInputPasswordProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Password',
    required: true,
    placeholder: 'Enter your password (required)',
  },
};

export const Disabled: StoryObj<IGRPInputPasswordProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Password',
    disabled: true,
    defaultValue: 'securePassword123',
    placeholder: 'Password field is disabled',
  },
};

export const WithError: StoryObj<IGRPInputPasswordProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Password',
    error: 'Password is too weak',
    placeholder: 'Enter your password',
  },
};

export const WithFormValidation: StoryObj<IGRPInputPasswordProps> = {
  render: FormTemplate,
  args: {
    name: 'password',
    label: 'Create Password',
    required: true,
    helperText: 'Must contain at least 8 characters, including uppercase, lowercase and numbers',
    placeholder: 'Create a strong password',
  },
};
