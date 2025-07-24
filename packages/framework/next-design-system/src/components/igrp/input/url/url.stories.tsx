import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { IGRPInputUrl, type IGRPInputUrlProps } from '.';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/horizon/button';
import type { IGRPOptionsProps } from '@/types/globals';

export default {
  title: 'Components/Input/URL',
  component: IGRPInputUrl,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultValue: { control: 'text' },
    defaultProtocol: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const CUSTOM_PROTOCOLS: IGRPOptionsProps[] = [
  { value: 'https://', label: 'HTTPS' },
  { value: 'http://', label: 'HTTP' },
  { value: 'git://', label: 'Git' },
  { value: 'ssh://', label: 'SSH' },
];

const Template: StoryFn<IGRPInputUrlProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
    <IGRPInputUrl {...args} />
  </div>
);

const FormTemplate: StoryFn<IGRPInputUrlProps> = (args) => {
  const schema = z.object({
    [args.name]: z
      .string()
      .min(1, 'A URL é obrigatória')
      .regex(/^(https?|ftp|sftp|ws|wss|git|ssh):\/\/[^\s]+$/, 'URL inválida'),
  });

  // Setup do formulário
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`URL enviada: ${data[args.name]}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputUrl {...args} />

          <Button
            type='submit'
            className='w-full mt-4'
          >
            Enviar
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export const Default: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    placeholder: 'Insira a URL do site',
  },
};

export const WithDefaultValue: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    defaultValue: 'https://example.com',
    placeholder: 'Insira a URL do site',
  },
};

export const WithHttpDefaultProtocol: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    defaultProtocol: 'http://',
    placeholder: 'Insira a URL do site',
  },
};

export const CustomProtocols: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'repository',
    label: 'Repository URL',
    protocols: CUSTOM_PROTOCOLS,
    defaultProtocol: 'git://',
    placeholder: 'Insira a URL do repositório',
  },
};

export const WithHelperText: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    helperText: 'Insira a URL completa incluindo o protocolo',
    placeholder: 'Insira a URL do site',
  },
};

export const Required: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    required: true,
    placeholder: 'Insira a URL do site (obrigatório)',
  },
};

export const Disabled: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    disabled: true,
    defaultValue: 'https://example.com',
    placeholder: 'Campo desabilitado',
  },
};

export const WithError: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    placeholder: 'Insira a URL do site',
    error: 'URL inválida. A URL deve começar com um protocolo válido.',
  },
};

export const HalfWidth: StoryObj<IGRPInputUrlProps> = {
  render: Template,
  args: {
    name: 'website',
    label: 'Website URL',
    placeholder: 'Insira a URL do site',
    gridSize: '1/2',
  },
};

export const WithValidation: StoryObj<IGRPInputUrlProps> = {
  render: FormTemplate,
  args: {
    name: 'website',
    label: 'Website URL',
    required: true,
    helperText: 'Insira uma URL válida começando com http:// ou https://',
    placeholder: 'Exemplo: https://example.com',
  },
};
