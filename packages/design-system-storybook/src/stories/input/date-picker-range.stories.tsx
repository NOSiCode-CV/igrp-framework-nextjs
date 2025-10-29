import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPDatePickerRange, type DateRange } from '@igrp/igrp-framework-react-design-system';
import { useForm, FormProvider } from 'react-hook-form';
import { useState } from 'react';

const meta: Meta<typeof IGRPDatePickerRange> = {
  title: 'Components/Input/DatePicker/Range',
  component: IGRPDatePickerRange,
  argTypes: {
    onDateChange: { action: 'onDateChange' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPDatePickerRange>;

const Demo: StoryFn<typeof IGRPDatePickerRange> = (args) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: args.date?.from,
    to: args.date?.to,
  })

  return (
    <div className='flex flex-col gap-4 m-10'>
      <IGRPDatePickerRange
        {...args}
        date={dateRange}
        onDateChange={setDateRange}
      />
      <p className='text-xs'>
        Debug | Selected Date:
      </p>
      <p className='text-xs'>
        {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}
      </p>
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
          <IGRPDatePickerRange {...args} />
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
