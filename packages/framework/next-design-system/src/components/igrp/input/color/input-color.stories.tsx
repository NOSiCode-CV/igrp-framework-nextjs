import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/horizon/button';
import { IGRPInputColor, type IGRPInputColorProps } from '.';

export default {
  title: 'Components/Input/Color',
  component: IGRPInputColor,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    defaultValue: { control: 'color' },
    showHexValue: { control: 'boolean' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputColorProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
    <IGRPInputColor {...args} />
  </div>
);

const FormTemplate: StoryFn<IGRPInputColorProps> = (args) => {
  const schema = z.object({
    [args.name]: z
      .string()
      .min(1, 'Selecione uma cor')
      .regex(/^#([0-9A-F]{6})$/i, 'Formato de cor inválido'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name]: args.defaultValue || '#000000',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`Cor selecionada: ${data[args.name]}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputColor {...args} />

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

export const Default: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'themeColor',
    label: 'Theme Color',
    defaultValue: '#3B82F6',
  },
};

export const WithCustomDefaultValue: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'themeColor',
    label: 'Theme Color',
    defaultValue: '#FF5733',
  },
};

export const WithoutHexValue: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'accentColor',
    label: 'Accent Color',
    defaultValue: '#10B981',
    showHexValue: false,
  },
};

export const WithHelperText: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'backgroundColor',
    label: 'Background Color',
    defaultValue: '#6366F1',
    helperText: 'Select a color for the background of your site',
  },
};

export const Required: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'brandColor',
    label: 'Brand Color',
    defaultValue: '#EC4899',
    required: true,
  },
};

export const Disabled: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'lockedColor',
    label: 'Locked Color',
    defaultValue: '#9333EA',
    disabled: true,
  },
};

export const WithError: StoryObj<IGRPInputColorProps> = {
  render: Template,
  args: {
    name: 'errorColor',
    label: 'Color with Error',
    defaultValue: '#F59E0B',
    error: 'This color is not available for your selected theme',
  },
};

export const WithValidation: StoryObj<IGRPInputColorProps> = {
  render: FormTemplate,
  args: {
    name: 'validatedColor',
    label: 'Select a Color',
    required: true,
    helperText: 'Choose a color for your profile',
  },
};
