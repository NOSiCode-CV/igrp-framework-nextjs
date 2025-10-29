import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPDatePickerInputSingle } from '@igrp/igrp-framework-react-design-system';
import { useForm, FormProvider } from 'react-hook-form';
import { useState } from 'react';

const meta: Meta<typeof IGRPDatePickerInputSingle> = {
  title: 'Components/Input/DatePickerInput/Single',
  component: IGRPDatePickerInputSingle,  
  argTypes: {
    onDateChange: { action: 'onDateChange' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPDatePickerInputSingle>;

const Demo: StoryFn<typeof IGRPDatePickerInputSingle> = (args) => { 
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(args.date);
  
  return (
    <div className='container mx-auto px-4 py-10'>
      <IGRPDatePickerInputSingle
        {...args}
        date={selectedDate}
        onDateChange={setSelectedDate} 
      />
      <p className='text-xs text-center'>
        Debug | Selected Date: {selectedDate?.toDateString()}
      </p>
    </div>
  );
};

export const Default: Story = {
  args: {
    label: 'Date of Birth',
    helperText: 'Select your date of birth',
    required: true,    
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
          <IGRPDatePickerInputSingle {...args} />
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
