import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IGRPCalendar } from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPCalendar> = {
  title: 'Components/Calendar/DropdownSingleCalendar',
  component: IGRPCalendar,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    className: { control: false },
    date: { control: false },
    onDateChange: { action: 'dateChanged' },
    startDate: { control: 'date' },
    endDate: { control: 'date' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPCalendar>;

export const Basic: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(args.date);

    return (
      <IGRPCalendar
        {...args}
        date={selectedDate}
        onDateChange={setSelectedDate}
      />
    );
  },
  args: {
    date: new Date(),
    startDate: new Date(),
  },
};
