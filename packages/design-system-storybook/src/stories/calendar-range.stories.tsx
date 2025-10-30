import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPCalendarRange,
  type DateRange,
  type IGRPCalendarRangeProps
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarRange> = {
  title: 'Components/Calendar/Range',
  component: IGRPCalendarRange,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    className: { control: false },
    date: { control: false },
    onDateChange: { action: 'dateChanged' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPCalendarRange>;

const RangeTemplate: StoryFn<IGRPCalendarRangeProps> = (args) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: args.date?.from,
    to: args.date?.to,
  })
  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarRange
        {...args}
        date={dateRange}
        onDateChange={setDateRange}
      />
      <p className='text-xs text-center'>
        Debug | Selected Date: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}
      </p>
    </div>
  );
};

export const Basic: Story = {
  render: RangeTemplate,
  args: {
    date: {
      from: new Date(2025, 5, 12),
      to: new Date(2025, 5, 26),
    },
    numberOfMonths: 2,   
  },
};