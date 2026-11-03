import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IGRPLookupField,
  Button,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Input/Lookup',
  component: IGRPLookupField,
  args: {
    name: 'licenca',
    label: 'Licença',
    lookupLabel: 'Pesquisar licença',
    onLookup: () => {},
  },
} satisfies Meta<typeof IGRPLookupField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>('');
    return (
      <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
        <IGRPLookupField
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onLookup={() => setValue('LIC-2024-0042')}
          onClear={() => setValue(null)}
        />
      </div>
    );
  },
};

const schema = z.object({
  licencaId: z.string({ error: 'Selecione uma licença' }).min(1, 'Selecione uma licença'),
  licencaNumero: z.string().nullable(),
});

export const PickedValue: Story = {
  render: (args) => {
    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: { licencaId: null, licencaNumero: null },
    });
    return (
      <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((data) => console.log(data))}
            className='space-y-4'
          >
            <IGRPLookupField
              {...args}
              name='licencaNumero'
              valueName='licencaId'
              required
              inputDisabled
              onLookup={() => {
                // Stands in for the search dialog.
                form.setValue('licencaId', '42', { shouldValidate: true });
                form.setValue('licencaNumero', 'LIC-2024-0042', {
                  shouldValidate: true,
                });
              }}
              onClear={() => {}}
            />
            <Button type='submit'>Guardar</Button>
          </form>
        </FormProvider>
      </div>
    );
  },
};

export const DisabledWithReason: Story = {
  args: {
    lookupDisabled: true,
    lookupDisabledReason: 'Selecione primeiro o requerente',
  },
  render: (args) => (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
      <IGRPLookupField {...args} />
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
      <IGRPLookupField {...args} />
    </div>
  ),
};
