import { useState } from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPCalendarMultiple,
  type IGRPCalendarMultipleProps
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendarMultiple> = {
  title: 'Components/Calendar/Multitple',
  component: IGRPCalendarMultiple,
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

type Story = StoryObj<typeof IGRPCalendarMultiple>;

const MultipleTemplate: StoryFn<IGRPCalendarMultipleProps> = (args) => {
  const [dates, setDates] = useState<Date[] | undefined>(args.date)
  return (
    <div className='flex flex-col gap-4'>
      <IGRPCalendarMultiple
        {...args}
        date={dates}
        onDateChange={setDates}
      />
      <p className='text-xs text-center'>
        Debug | Selected Date: {dates?.map((date) => date.toDateString()).join(' - ')}
      </p>
    </div>
  );
};

export const Basic: Story = {
  render: MultipleTemplate,
  args: {
    date: [
      new Date(2025, 10, 1),
      new Date(2025, 10, 12),
    ],
  },
};