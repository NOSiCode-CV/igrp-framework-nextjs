import { useRef, useState } from 'react';
import { type JSX } from 'react/jsx-runtime';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPCombobox, type IGRPComboboxProps } from '.';
import type { IGRPOptionsProps } from '@/types/globals';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPIconObject } from '@/components/igrp/icon';
import { IGRPForm, type IGRPFormHandle } from '../../form';
import z from 'zod';

export default {
  title: 'Components/Input/Combobox',
  component: IGRPCombobox,
  argTypes: {
    variant: { control: 'select', options: ['single', 'multiple'] },
    options: { control: 'object' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    required: { control: 'boolean' },
    errorText: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon from Lucide.',
    },
    showGroup: { control: 'boolean' },
    showSearch: { control: 'boolean' },
    showStatus: {
      control: 'boolean',
      options: ['default', 'success', 'warning', 'error', 'pending', 'completed'],
    },
    gridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
  },
} as Meta;

type Story = StoryObj<typeof IGRPCombobox>;

// Sample data
const COUNTRIES: IGRPOptionsProps[] = [
  { value: 'cv', label: 'Cabo Verde', color: 'text-blue-500' },
  { value: 'us', label: 'Estados Unidos', color: 'text-red-500' },
  { value: 'ca', label: 'Canadá', color: 'text-red-700' },
  { value: 'gb', label: 'Reino Unido', color: 'text-blue-700' },
  { value: 'fr', label: 'França', color: 'text-blue-600' },
  { value: 'de', label: 'Alemanha', color: 'text-yellow-500' },
  { value: 'jp', label: 'Japão', color: 'text-red-500' },
  { value: 'au', label: 'Austrália', color: 'text-green-500' },
  { value: 'cn', label: 'China', color: 'text-red-600' },
  { value: 'ru', label: 'Rússia', color: 'text-red-800' },
];

const PRIORITIES: IGRPOptionsProps[] = [
  { value: 'low', label: 'Baixa Prioridade', color: 'text-green-500' },
  { value: 'medium', label: 'Média Prioridade', color: 'text-amber-500' },
  { value: 'high', label: 'Alta Prioridade', color: 'text-red-500' },
  { value: 'critical', label: 'Crítica', color: 'text-red-700 font-bold' },
];

const STATUS: IGRPOptionsProps[] = [
  { label: 'Completed', value: 'success', status: 'success' },
  { label: 'In Progress', value: 'info', status: 'info' },
  { label: 'Cancelled', value: 'error', status: 'destructive' },
  { label: 'Completed0', value: 'success2', status: 'success' },
  { label: 'In Progress0', value: 'info2', status: 'info' },
  { label: 'Cancelled0', value: 'error2', status: 'destructive' },
  { label: 'Completed1', value: 'success3', status: 'success' },
  { label: 'In Progress1', value: 'info3', status: 'info' },
  { label: 'Cancelled1', value: 'error3', status: 'destructive' },
  { label: 'Completed2', value: 'success4', status: 'success' },
  { label: 'In Progress2', value: 'info4', status: 'info' },
  { label: 'Cancelled2', value: 'error4', status: 'destructive' },
  { label: 'Completed3', value: 'success5', status: 'success' },
  { label: 'In Progress3', value: 'info5', status: 'info' },
  { label: 'Cancelled3', value: 'error5', status: 'destructive' },
  { label: 'Completed4', value: 'success6', status: 'success' },
  { label: 'In Progress4', value: 'info6', status: 'info' },
  { label: 'Cancelled4', value: 'error6', status: 'destructive' },
  { label: 'Completed5', value: 'success7', status: 'success' },
  { label: 'In Progress5', value: 'info7', status: 'info' },
  { label: 'Cancelled5', value: 'error7', status: 'destructive' },
  { label: 'Completed6', value: 'success', status: 'success' },
  { label: 'In Progress6', value: 'info', status: 'info' },
  { label: 'Cancelled6', value: 'error', status: 'destructive' },
];

const FRAMEWORKS: IGRPOptionsProps[] = [
  { label: 'React', value: 'react', color: 'text-blue-500' },
  { label: 'Vue', value: 'vue', color: 'text-green-500' },
  { label: 'Next.js', value: 'next', color: 'text-red-500' },
  { label: 'React1', value: 'react1', color: 'text-blue-500' },
  { label: 'Vue1', value: 'vue1', color: 'text-green-500' },
  { label: 'Next.js1', value: 'next1', color: 'text-red-500' },
  { label: 'React2', value: 'react2', color: 'text-blue-500' },
  { label: 'Vue2', value: 'vue2', color: 'text-green-500' },
  { label: 'Next.js2', value: 'next2', color: 'text-red-500' },
];

const COUNTRIES_WITH_ICONS: IGRPOptionsProps[] = [
  { label: 'USA', value: 'usa', icon: 'Flag' },
  { label: 'Germany', value: 'germany', icon: 'Globe' },
  { label: 'Japan', value: 'japan', icon: 'Airplay' },
];

const ControlledTemplate = (args: JSX.IntrinsicAttributes & IGRPComboboxProps) => {
  const [selected, setSelected] = useState(args.value || '');
  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <IGRPCombobox
        {...args}
        value={selected}
        onChange={(value) => {
          setSelected(value);
          console.log('Selected:', value);
        }}
      />
    </div>
  );
};

const FormTemplate = (args: IGRPComboboxProps) => {
  const [selected, setSelected] = useState(args.value || '');

  const schema = z.object({
    fruit: z.string(),
  });
  const formRef = useRef<IGRPFormHandle<typeof schema>>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => alert(JSON.stringify(data));

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <IGRPForm
        schema={schema}
        onSubmit={onSubmit}
        formRef={formRef}
        gridClassName='space-y-4 w-80'
      >
        <IGRPCombobox
          {...args}
          value={selected}
          onChange={(value) => {
            setSelected(value);
            console.log('Selected:', value);
          }}
        />
      </IGRPForm>
      <IGRPButton
        type='submit'
        className='w-full mt-4'
      >
        Enviar
      </IGRPButton>
    </div>
  );
};

export const Default: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'single',
    options: FRAMEWORKS,
    label: 'Select a framework',
    placeholder: 'Select an option...',
  },
};

export const WithForm: Story = {
  render: FormTemplate,
  args: {
    variant: 'single',
    options: FRAMEWORKS,
    label: 'Select a framework',
    helperText: 'Choose a framework to submit',
    placeholder: 'Select a framework...',
    required: true,
  },
};

export const PriorityColors: Story = {
  render: ControlledTemplate,
  args: {
    name: 'priority',
    label: 'Nível de Prioridade',
    options: PRIORITIES,
    placeholder: 'Selecione a prioridade',
    helperText: 'A cor do texto indica o nível de urgência',
  },
};

export const Required: Story = {
  render: ControlledTemplate,
  args: {
    name: 'status',
    label: 'Estado da Tarefa',
    options: STATUS,
    required: true,
    placeholder: 'Selecione o estado (obrigatório)',
  },
};

export const WithError: Story = {
  render: ControlledTemplate,
  args: {
    name: 'country',
    label: 'País',
    options: COUNTRIES,
    placeholder: 'Selecione um país',
    errorText: 'Por favor, selecione um país para continuar',
  },
};

export const WithHelper: Story = {
  render: ControlledTemplate,
  args: {
    name: 'country',
    label: 'País',
    options: COUNTRIES,
    placeholder: 'Selecione um país',
    helperText: 'Por favor, selecione um país para continuar',
  },
};

export const Disabled: Story = {
  render: ControlledTemplate,
  args: {
    name: 'country',
    label: 'País',
    options: COUNTRIES,
    disabled: true,
    placeholder: 'Campo desativado',
  },
};

export const Multiple: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'multiple',
    name: 'frameworks',
    options: FRAMEWORKS,
    label: 'Select a framework',
    placeholder: 'Select an option...',
  },
};

export const WithSearch: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'single',
    options: FRAMEWORKS,
    label: 'Select a framework',
    placeholder: 'Select an option...',
    showSearch: true,
  },
};

export const WithStatus: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'single',
    options: STATUS,
    label: 'Select a framework',
    placeholder: 'Select an option...',
    showStatus: true,
  },
};

export const WithIcon: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'single',
    options: COUNTRIES_WITH_ICONS,
    label: 'Select a framework',
    placeholder: 'Select an option...',
    showIcon: true,
  },
};

export const WithGroup: Story = {
  render: ControlledTemplate,
  args: {
    variant: 'single',
    label: 'Select a framework',
    placeholder: 'Select an option...',
    showGroup: true,
    options: [
      { value: 'option1', label: 'Option 1', color: 'text-blue-500', group: 'First Group' },
      { value: 'option2', label: 'Option 2', color: 'text-green-500', group: 'Second Group' },
      { value: 'option3', label: 'Option 3', color: 'text-red-500', group: 'Third Group' },
    ],
  },
};

export const WithFormContext: Story = {
  render: FormTemplate,
  args: {
    name: 'status',
    label: 'Estado da Tarefa',
    options: STATUS,
    showStatus: true,
    placeholder: 'Selecione o estado (obrigatório)',
  },
};
