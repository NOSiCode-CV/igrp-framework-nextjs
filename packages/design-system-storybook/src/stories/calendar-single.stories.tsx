import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { 
  IGRPCalendarSingle, 
  type IGRPCalendarSingleProps 
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarSingle> = {
  title: 'Components/Calendar/Single',
  component: IGRPCalendarSingle,
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

type Story = StoryObj<typeof IGRPCalendarSingle>;

const SingleTemplate: StoryFn<IGRPCalendarSingleProps> = (args) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(args.date);
  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarSingle       
        {...args}
        date={selectedDate}
        onDateChange={setSelectedDate}        
      />
      <p className='text-xs text-center'>Debug | Selected Date: {selectedDate?.toDateString()}</p>
  </div>
  );
};

export const Basic: Story = {
  render: SingleTemplate,
  args: {
    date: new Date(),
    disableBefore: new Date(2025, 8, 12),
    disableAfter: new Date(2025, 11, 12),
    disableDayOfWeek: [0, 6],
  }
};