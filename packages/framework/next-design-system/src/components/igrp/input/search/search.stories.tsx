import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { IGRPInputSearch, type IGRPInputSearchProps } from '.';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/horizon/button';

export default {
  title: 'Components/Input/Search',
  component: IGRPInputSearch,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showStartIcon: { control: 'boolean' },
    showSubmitButton: { control: 'boolean' },
    submitButtonLabel: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    gridSize: {
      control: 'select',
      options: ['default', 'full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputSearchProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputSearch
      {...args}
      onSearch={(value) => alert(`Searching for: ${value}`)}
    />
  </div>
);

const FormTemplate: StoryFn<IGRPInputSearchProps> = (args) => {
  const name = args.name || 'search'; // Fallback if undefined

  const schema = z.object({
    [name]: z.string().min(2, 'A busca deve ter pelo menos 2 caracteres'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [name]: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`Busca enviada: ${data[name]}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPInputSearch
            {...args}
            onSearch={() => {
              form.handleSubmit(onSubmit)();
            }}
          />

          <Button
            type='submit'
            className='w-full mt-4'
          >
            Pesquisar
          </Button>
        </form>
      </FormProvider>
    </div>
  );
};

export const Default: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    placeholder: 'Type to search...',
    submitButtonLabel: 'Search here...',
  },
};

export const WithHelperText: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Product Search',
    helperText: 'Search for products by name or code',
    placeholder: 'Enter product name...',
  },
};

export const WithDefaultValue: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    defaultValue: 'initial query',
    placeholder: 'Type to search...',
  },
};

export const WithoutIcon: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    showStartIcon: false,
    placeholder: 'Type to search...',
  },
};

export const WithoutSubmitButton: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    showSubmitButton: false,
    placeholder: 'Press Enter to search...',
  },
};

export const WithCustomIcons: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search GitHub Repositories',
    placeholder: 'Enter repository name...',
    startIcon: 'GitGraph',
    submitIcon: 'Mail',
    submitButtonLabel: 'Send search',
  },
};

export const Required: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    required: true,
    placeholder: 'Type to search...',
  },
};

export const Disabled: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    disabled: true,
    defaultValue: 'locked search',
    placeholder: 'Search is disabled',
  },
};

export const WithError: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    error: 'Invalid search query',
    placeholder: 'Type to search...',
  },
};

export const HalfWidth: StoryObj<IGRPInputSearchProps> = {
  render: Template,
  args: {
    name: 'search',
    label: 'Search',
    placeholder: 'Type to search...',
    gridSize: '1/2',
  },
};

export const WithFormValidation: StoryObj<IGRPInputSearchProps> = {
  render: FormTemplate,
  args: {
    name: 'searchQuery',
    label: 'Search',
    required: true,
    helperText: 'Enter at least 2 characters',
    placeholder: 'Type and press enter or click search...',
  },
};
