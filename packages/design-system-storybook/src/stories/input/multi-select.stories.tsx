import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPMultiSelect,
  type IGRPOptionsProps,
  IGRPButton,
  IGRPForm,
  type IGRPFormHandle,
} from '@igrp/igrp-framework-react-design-system';
import z from 'zod';

const TIPOS: IGRPOptionsProps[] = [
  { label: 'Alteração de titular', value: 'TITULAR', description: 'Mudança da entidade licenciada' },
  { label: 'Alteração de morada', value: 'MORADA' },
  { label: 'Alteração de atividade', value: 'ATIVIDADE' },
  { label: 'Alteração de horário', value: 'HORARIO' },
  { label: 'Alteração de área', value: 'AREA' },
  { label: 'Averbamento', value: 'AVERBAMENTO', disabled: true },
];

const CIDADES: IGRPOptionsProps[] = [
  { label: 'Praia', value: 'praia', group: 'Santiago' },
  { label: 'Assomada', value: 'assomada', group: 'Santiago' },
  { label: 'Tarrafal', value: 'tarrafal', group: 'Santiago' },
  { label: 'Mindelo', value: 'mindelo', group: 'São Vicente' },
  { label: 'Espargos', value: 'espargos', group: 'Sal' },
  { label: 'Santa Maria', value: 'santa-maria', group: 'Sal' },
  { label: 'Sal Rei', value: 'sal-rei', group: 'Boa Vista' },
  { label: 'São Filipe', value: 'sao-filipe', group: 'Fogo' },
];

export default {
  title: 'Components/Input/MultiSelect',
  component: IGRPMultiSelect,
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    helperText: { control: 'text' },
    errorText: { control: 'text' },
    showSearch: { control: 'boolean' },
    hideBulkActions: { control: 'boolean' },
    hideChips: { control: 'boolean' },
    maxSelected: { control: 'number' },
  },
} as Meta;

type Story = StoryObj<typeof IGRPMultiSelect>;

export const Controlled: Story = {
  args: { label: 'Tipo de atualização', options: TIPOS, helperText: 'Escolha pelo menos um tipo.' },
  render: (args) => {
    const [value, setValue] = useState<string[]>(['MORADA']);
    return (
      <div className='w-96'>
        <IGRPMultiSelect {...args} value={value} onChange={setValue} />
        <pre className='mt-4 text-xs'>{JSON.stringify(value)}</pre>
      </div>
    );
  },
};

export const GroupedWithSearch: Story = {
  args: { label: 'Cidades', options: CIDADES },
  render: (args) => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <div className='w-96'>
        <IGRPMultiSelect {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const WithCap: Story = {
  args: { label: 'Até duas cidades', options: CIDADES, maxSelected: 2 },
  render: (args) => {
    const [value, setValue] = useState<string[]>(['praia']);
    return (
      <div className='w-96'>
        <IGRPMultiSelect {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

const schema = z.object({
  tipoAtualizacao: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de atualização.'),
});

/** Edit-screen round trip: rehydrates a saved selection and validates on touch. */
export const InForm: Story = {
  render: () => {
    const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);
    const [submitted, setSubmitted] = useState<string>('');
    return (
      <div className='w-96'>
        <IGRPForm
          schema={schema}
          formRef={formRef}
          validationMode='onTouched'
          defaultValues={{ tipoAtualizacao: ['TITULAR', 'HORARIO'] }}
          onSubmit={(values) => setSubmitted(JSON.stringify(values))}
        >
          <IGRPMultiSelect
            name='tipoAtualizacao'
            label='Tipo de atualização'
            required
            options={TIPOS}
          />
          <IGRPButton type='submit' className='mt-4'>
            Submeter
          </IGRPButton>
        </IGRPForm>
        {submitted && <pre className='mt-4 text-xs'>{submitted}</pre>}
      </div>
    );
  },
};
