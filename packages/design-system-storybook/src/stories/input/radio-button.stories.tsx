'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPRadioGroup, IGRPButton } from '@igrp/igrp-framework-react-design-system';

type IGRPRadioGroupProps = React.ComponentProps<typeof IGRPRadioGroup>;

const meta: Meta<typeof IGRPRadioGroup> = {
  title: 'Components/input/RadioGroup',
  component: IGRPRadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'The layout orientation of the radio group',
    },
    // position: {
    //   control: 'select',
    //   options: ['left', 'right'],
    //   description: 'The position of the radio button relative to the label',
    // },

    dir: {
      control: 'select',
      options: ['ltr', 'rtl'],
      description: 'The position of the radio button relative to the label',
    },

    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Dot-and-label options, or option cards (icon, badge, description)',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the radio group is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the radio group is required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPRadioGroup>;

const Template = (args: IGRPRadioGroupProps) => <IGRPRadioGroup {...args} />;

const FormTemplate = (args: IGRPRadioGroupProps) => {
  const schema = z.object({
    [args.name || 'field']: z.string().min(1, 'Esta seleção é obrigatória'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name || 'field']: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    console.log('Formulário enviado:', data);
    alert(`Opção selecionada: ${data[args.name || 'field']}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <h2 className='text-xl font-semibold mb-4'>Form with Validation</h2>
      <p className='text-gray-500 mb-6'>
        Try submitting without selecting an option to see validation error.
      </p>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPRadioGroup {...args} />

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

export const Default: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    defaultValue: 'option1',
    label: 'Select an option',
  },
};

export const WithDescriptions: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1', description: 'This is the first option' },
      { value: 'option2', label: 'Option 2', description: 'This is the second option' },
      { value: 'option3', label: 'Option 3', description: 'This is the third option' },
    ],
    defaultValue: 'option1',
    label: 'Select an option',
    helperText: 'Choose one of the available options',
  },
};

export const WithOrientation: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    defaultValue: 'option1',
    orientation: 'horizontal',
    label: 'Select an option',
  },
};

export const WithPosition: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    defaultValue: 'option1',
    //position: 'right',
    label: 'Select an option',
  },
};

export const Disabled: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    defaultValue: 'option1',
    disabled: true,
    label: 'Disabled radio group',
  },
};

export const WithError: Story = {
  render: Template,
  args: {
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    defaultValue: 'option1',
    label: 'Select an option',
    errorText: 'Please select a valid option',
  },
};

export const WithFormIntegration: Story = {
  render: FormTemplate,
  args: {
    name: 'plan',
    options: [
      { value: 'basic', label: 'Basic Plan', description: '$10/month' },
      { value: 'pro', label: 'Pro Plan', description: '$20/month' },
      { value: 'enterprise', label: 'Enterprise Plan', description: '$50/month' },
    ],
    required: true,
    label: 'Select a plan',
  },
};

const requestTypes: IGRPRadioGroupProps['options'] = [
  {
    value: 'nova',
    label: 'Nova licença',
    description: 'Primeiro pedido para esta actividade.',
    icon: 'FilePlus',
  },
  {
    value: 'renovacao',
    label: 'Renovação',
    description: 'Prolonga uma licença existente pelo mesmo período.',
    icon: 'RefreshCw',
    badge: 'Permite renovação',
  },
  {
    value: 'alteracao',
    label: 'Alteração',
    description: 'Muda os dados de uma licença em vigor sem alterar o prazo.',
    icon: 'FilePen',
    disabled: true,
  },
];

export const OptionCards: Story = {
  render: (args: IGRPRadioGroupProps) => (
    <div className='w-[56rem] max-w-full'>
      <IGRPRadioGroup {...args} />
    </div>
  ),
  args: {
    variant: 'card',
    options: requestTypes,
    defaultValue: 'renovacao',
    label: 'Tipo de pedido',
    helperText: 'Escolha o tipo que corresponde à sua situação.',
  },
};

export const OptionCardsVertical: Story = {
  ...OptionCards,
  args: { ...OptionCards.args, orientation: 'vertical' },
};

export const OptionCardsInForm: Story = {
  render: FormTemplate,
  args: {
    variant: 'card',
    name: 'tipo',
    options: requestTypes,
    required: true,
    label: 'Tipo de pedido',
  },
};
