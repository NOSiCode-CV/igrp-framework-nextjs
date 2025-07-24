import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { useForm, FormProvider } from 'react-hook-form';
import { IGRPDatePicker } from './date-picker';
import type { DateBefore } from 'react-day-picker';

const meta: Meta<typeof IGRPDatePicker> = {
  title: 'Components/Input/DatePicker',
  component: IGRPDatePicker,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onDateChange: { action: 'onDateChange' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPDatePicker>;

const Demo: StoryFn<typeof IGRPDatePicker> = (args) => {
  const matcher: DateBefore = { before: new Date(2019, 1, 2) };

  return (
    <div className='container mx-auto px-4 py-10'>
      <IGRPDatePicker
        {...args}
        disabled={matcher}
      />
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
          <IGRPDatePicker {...args} />
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
