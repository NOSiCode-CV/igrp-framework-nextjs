import type { Meta, StoryObj } from '@storybook/react';
import { IGRPStatsCardTopBorderColored } from '.';
import { IGRPIconObject } from '@/components/igrp/icon';

const meta: Meta<typeof IGRPStatsCardTopBorderColored> = {
  title: 'Custom/StatsCardTopBorderColored',
  component: IGRPStatsCardTopBorderColored,
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text',
    },
    value: {
      control: 'text',
      description: 'The value to display',
    },
    cardVariant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'destructive', 'warning', 'info', 'indigo'],
      description: 'Color variant for borders',
    },
    className: {
      control: 'text',
      description: 'The className value for the card',
    },
    iconClassName: {
      control: 'text',
      description: 'The className value for the icon',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPStatsCardTopBorderColored>;

const Template = (args: React.ComponentProps<typeof IGRPStatsCardTopBorderColored>) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPStatsCardTopBorderColored {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
  args: {
    title: 'Revenue',
    value: '$12,400',
    iconName: 'DollarSign',
  },
};
