import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPDatePickerSingle } from '@igrp/igrp-framework-react-design-system';
import { useForm, FormProvider } from 'react-hook-form';

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

  return (
    <div className='container mx-auto px-4 py-10'>
      <IGRPDatePickerSingle
        {...args}
      />
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
