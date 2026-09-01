import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { IGRPDatePickerSingle, IGRPForm, type IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';
import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useEffect, useState } from 'react';
import { z } from 'zod';

const meta: Meta<typeof IGRPDatePickerSingle> = {
  title: 'Components/Input/DatePicker/Single',
  component: IGRPDatePickerSingle,  
  argTypes: {
    onDateChange: { action: 'onDateChange' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPDatePickerSingle>;

const Demo: StoryFn<typeof IGRPDatePickerSingle> = (args) => { 
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(args.date);
  
  return (
    <div className='container mx-auto px-4 py-10'>
      <IGRPDatePickerSingle
        {...args}
        date={selectedDate}
        onDateChange={setSelectedDate} 
      />
      <p className='text-xs text-center'>Debug | Selected Date: {selectedDate?.toDateString()}</p>
    </div>
  );
};

export const Default: Story = {
  args: {
    label: 'Date of Birth',
    helperText: 'Select your date of birth',
    required: true,
    disableBefore: new Date(2019, 1, 2),
  },
  render: Demo,
};

export const WithForm: Story = {
  args: {
    name: 'bookingDate',
    label: 'Booking Date',
    helperText: 'Pick a range',
    required: true,
  },
  render: (args) => {
    const methods = useForm({});

    const onSubmit = methods.handleSubmit((data) => {
      alert(JSON.stringify(data, null, 2));
    });

    return (
      <FormProvider {...methods}>
        <form
          onSubmit={onSubmit}
          className='space-y-4 max-w-md p-4'
        >
          <IGRPDatePickerSingle {...args} />
          <button
            type='submit'
            className='bg-primary text-white px-4 py-2 rounded-md'
          >
            Submit
          </button>
        </form>
      </FormProvider>
    );
  },
};

/**
 * Regression story: the date picker button must carry aria-invalid="true" and
 * an aria-describedby pointing at the error message when the field is in error.
 *
 * NOTE: test:vitest runner is currently broken in this environment (pre-existing
 * "Failed to initialize projects" issue). Build gate: `pnpm build:ds`.
 */
const DatePickerErrorA11ySchema = z.object({ birthDate: z.date({ required_error: 'Date is required' }) });

const DatePickerErrorA11yTemplate: React.FC = () => {
  const formRef = useRef<IGRPFormHandle<typeof DatePickerErrorA11ySchema>>(null);

  useEffect(() => {
    formRef.current?.setError('birthDate', { message: 'Date is required' });
  }, []);

  return (
    <IGRPForm
      schema={DatePickerErrorA11ySchema}
      onSubmit={() => {}}
      formRef={formRef}
      gridClassName='space-y-4 w-80'
    >
      <IGRPDatePickerSingle
        name='birthDate'
        label='Date of Birth'
        required
      />
    </IGRPForm>
  );
};

export const DatePickerErrorA11y: Story = {
  name: 'DatePickerErrorA11y',
  render: () => <DatePickerErrorA11yTemplate />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('date button carries aria-invalid when field has an error', async () => {
      const button = canvas.getByRole('button', { name: /pick a date/i });
      expect(button.getAttribute('aria-invalid')).toBe('true');
    });

    await step('date button aria-describedby resolves to the error message element', async () => {
      const button = canvas.getByRole('button', { name: /pick a date/i });
      const describedById = button.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      const messageEl = document.getElementById(describedById!);
      expect(messageEl).not.toBeNull();
      expect(messageEl?.textContent).toMatch(/required/i);
    });
  },
};
