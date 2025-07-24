import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IGRPDateTimeInput, type IGRPDateTimeInputProps } from '.';
import { IGRPButton } from '@/components/igrp';

export default {
  title: 'Components/Input/DateTimeInput',
  component: IGRPDateTimeInput,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPDateTimeInputProps> = (args) => {
  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <IGRPDateTimeInput
        {...args}
        onChange={(value) => console.log('Value changed:', value)}
      />
    </div>
  );
};

const FormTemplate: StoryFn<IGRPDateTimeInputProps> = (args) => {
  // Check if args.name is defined, otherwise return an early return or a fallback
  if (!args.name) {
    throw new Error('Name is required for the form input');
  }

  const dateTimePattern =
    /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}, (0\d|1\d|2[0-3]):([0-5]\d)$/;

  const schema = z.object({
    [args.name]: z
      .string()
      .min(1, 'Este campo é obrigatório')
      .regex(dateTimePattern, 'Formato inválido. Use: mm/dd/yyyy, HH:MM'),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      [args.name]: args.defaultValue || '',
    },
  });

  const onSubmit = (data: Record<string, string>) => {
    if (!args.name) {
      console.error('Name is required');
      return; // Optionally, you can handle this case differently, like showing an alert or default value.
    }

    console.log('Formulário enviado:', data);
    alert(`Data e hora: ${data[args.name]}`);
  };

  return (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm max-w-lg'>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <IGRPDateTimeInput {...args} />

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

export const Default: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'appointmentDateTime',
    label: 'Data e Hora da Consulta',
    placeholder: 'mm/dd/yyyy, --:--',
  },
};

export const WithDefaultValue: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'meetingDateTime',
    label: 'Data e Hora da Reunião',
    defaultValue: '03/15/2024, 10:30',
  },
};

export const WithHelperText: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'eventDateTime',
    label: 'Data e Hora do Evento',
    helperText: 'Digite no formato: mm/dd/aaaa, hh:mm',
    placeholder: 'mm/dd/yyyy, --:--',
  },
};

export const Required: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'requiredDateTime',
    label: 'Data e Hora',
    required: true,
    placeholder: 'mm/dd/yyyy, --:--',
  },
};

export const WithCustomPlaceholder: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'customDateTime',
    label: 'Data e Hora Personalizada',
    placeholder: 'mês/dia/ano, hora:minuto',
  },
};

export const Disabled: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'disabledDateTime',
    label: 'Horário Fixo',
    defaultValue: '04/10/2024, 14:00',
    disabled: true,
  },
};

export const WithError: StoryObj<IGRPDateTimeInputProps> = {
  render: Template,
  args: {
    name: 'errorDateTime',
    label: 'Data e Hora',
    error: 'Data e hora inválidas',
    placeholder: 'mm/dd/yyyy, --:--',
  },
};

export const WithValidation: StoryObj<IGRPDateTimeInputProps> = {
  render: FormTemplate,
  args: {
    name: 'validatedDateTime',
    label: 'Data e Hora da Entrevista',
    required: true,
    helperText: 'Use o formato: mm/dd/aaaa, hh:mm',
    placeholder: 'mm/dd/yyyy, --:--',
  },
};
