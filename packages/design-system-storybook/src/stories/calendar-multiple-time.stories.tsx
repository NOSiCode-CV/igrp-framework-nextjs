import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPCalendarMultipleTime,
  type IGRPCalendarMultipleProps
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarMultipleTime> = {
  title: 'Components/Calendar/MultipleTime',
  component: IGRPCalendarMultipleTime,
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

type Story = StoryObj<typeof IGRPCalendarMultipleTime>;

const MultipleTemplate: StoryFn<IGRPCalendarMultipleProps> = (args) => {
  const [dates, setDates] = useState<Date[] | undefined>(args.date)
  const [startTime, setStartTime] = useState<string | undefined>("")
  const [endTime, setEndTime] = useState<string | undefined>("")

  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarMultipleTime
        {...args}
        date={dates}
        onDateChange={setDates}
        onStartTime={setStartTime}
        onEndTime={setEndTime}
      />

      <div className='text-xs text-center'>
        Debug | Selected Date: {dates?.map((date) => date.toDateString()).join(' - ')}
        <p>Debug | Start Time: {startTime}</p>
        <p>Debug | End Time: {endTime}</p>
      </div>
    </div>
  );
};

export const Basic: Story = {
  render: MultipleTemplate,
  args: {
    date: [
      new Date(),
      new Date(2025, 10, 1),
    ],
    numberOfMonths: 2,
  },
};