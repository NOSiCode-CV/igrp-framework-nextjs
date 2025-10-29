import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { 
  IGRPCalendarSingleTime, 
  type IGRPCalendarSingleProps 
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarSingleTime> = {
  title: 'Components/Calendar/SingleTime',
  component: IGRPCalendarSingleTime,
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

type Story = StoryObj<typeof IGRPCalendarSingleTime>;

const SingleTemplate: StoryFn<IGRPCalendarSingleProps> = (args) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(args.date);
  const [startTime, setStartTime] = useState<string | undefined>("")
  const [endTime, setEndTime] = useState<string | undefined>("")

  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarSingleTime       
        {...args}
        date={selectedDate}
        onDateChange={setSelectedDate}
        onStartTime={setStartTime}
        onEndTime={setEndTime}       
      />

      <div className='text-xs text-center'>
        <p>Debug | Selected Date: {selectedDate?.toDateString()}</p>
        <p>Debug | Start Time: {startTime}</p>
        <p>Debug | End Time: {endTime}</p>
      </div>
  </div>
  );
};

export const Basic: Story = {
  render: SingleTemplate,
  args: {
    date: new Date(),        
  },
};