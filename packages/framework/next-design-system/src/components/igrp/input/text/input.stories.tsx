/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { IGRPInputText, type IGRPInputTextProps } from '.';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/horizon/button';

export default {
  title: 'Components/Input/Text',
  component: IGRPInputText,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    iconName: { control: 'text' },
    iconSize: { control: 'number' },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
    },
    placeholder: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
    className: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputTextProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputText {...args} />
  </div>
);

const FormTemplate: StoryFn<IGRPInputTextProps> = (args) => {
  const schema = z.object({
    [args.name as string]: z.string().min(2, 'O campo deve ter pelo menos 2 caracteres'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name as string]: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log('Formulário enviado:', data);
    alert(`Formulário enviado com sucesso: ${JSON.stringify(data)}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-md'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputText {...args} />

          <Button
            type='submit'
            className='mt-4'
          >
            Enviar
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export const Default: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'username',
    label: 'Nome de Usuário',
    placeholder: 'Digite seu nome de usuário',
  },
};

export const WithIcon: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'email',
    label: 'Email',
    placeholder: 'Digite seu email',
    showIcon: true,
    iconName: 'Mail',
    iconPlacement: 'start',
  },
};

export const WithHelperText: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'password',
    label: 'Senha',
    helperText: 'A senha deve ter pelo menos 8 caracteres',
    placeholder: 'Digite sua senha',
    type: 'text',
  },
};

export const WithError: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'username',
    label: 'Nome de Usuário',
    placeholder: 'Digite seu nome de usuário',
    error: 'Este campo é obrigatório',
  },
};

export const Disabled: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'disabled-field',
    label: 'Campo Desabilitado',
    placeholder: 'Este campo está desabilitado',
    disabled: true,
  },
};

export const DifferentSizes: StoryObj<IGRPInputTextProps> = {
  render: Template,
  args: {
    name: 'half-width',
    label: 'Campo com Metade da Largura',
    placeholder: 'Este campo ocupa metade do espaço disponível',
    gridSize: '1/2',
  },
};

export const InFormContext: StoryObj<IGRPInputTextProps> = {
  render: FormTemplate,
  args: {
    name: 'username',
    label: 'Nome de Usuário (Validado)',
    placeholder: 'Digite pelo menos 2 caracteres',
    required: true,
    helperText: 'Este campo está dentro de um contexto de formulário com validação',
  },
};
