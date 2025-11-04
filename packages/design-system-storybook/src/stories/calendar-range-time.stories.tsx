import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { 
  IGRPCalendarRangeTime, 
  type DateRange, 
  type IGRPCalendarRangeProps 
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarRangeTime> = {
  title: 'Components/Calendar/RangeTime',
  component: IGRPCalendarRangeTime,
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

type Story = StoryObj<typeof IGRPCalendarRangeTime>;

const RangeTemplate: StoryFn<IGRPCalendarRangeProps> = (args) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: args.date?.from,
      to: args.date?.to,
    })
  const [startTime, setStartTime] = useState<string | undefined>("")
  const [endTime, setEndTime] = useState<string | undefined>("")

  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarRangeTime       
        {...args}
        date={dateRange}
        onDateChange={setDateRange}
        onStartTime={setStartTime}
        onEndTime={setEndTime}       
      />

      <div className='text-xs text-center'>
        Debug | Selected Date: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString()}
        <p>Debug | Start Time: {startTime}</p>
        <p>Debug | End Time: {endTime}</p>
      </div>
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