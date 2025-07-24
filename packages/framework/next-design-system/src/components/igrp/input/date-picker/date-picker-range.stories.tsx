import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { IGRPDatePickerRange, type IGRPDatePickerRangeProps } from './date-picker-range';
import type { DateRange } from 'react-day-picker';

const meta: Meta<typeof IGRPDatePickerRange> = {
  title: 'Components/Input/DatePicker/Range',
  component: IGRPDatePickerRange,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof IGRPDatePickerRange>;

const DefaultTemplate = (args: IGRPDatePickerRangeProps) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  return (
    <div className='w-full max-w-sm'>
      <IGRPDatePickerRange
        {...args}
        date={date}
        onDateChange={setDate}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <DefaultTemplate
      name='test'
      label='Date Range'
      id='test-id'
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <DefaultTemplate
      label='Date Range'
      disabled
      id='test-id'
    />
  ),
};

export const WithoutLabel: Story = {
  render: () => <DefaultTemplate id='test-id' />,
};
