import type { Meta, StoryObj } from '@storybook/react';
import { StatsCardMini, type StatsCardMiniProps } from '.';

const meta: Meta<typeof StatsCardMini> = {
  title: 'Custom/StatsCardMini',
  component: StatsCardMini,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'destructive', 'warning', 'info', 'secondary', 'indigo'],
    },
    titleSize: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
    },
    valueSize: {
      control: 'select',
      options: ['sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    iconName: {
      control: 'text',
    },
    image: {
      control: 'text',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof StatsCardMini>;

const Template = (args: StatsCardMiniProps) => (
  <div className='container mx-auto px-4 py-12'>
    <StatsCardMini {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
  args: {
    title: 'Revenue',
    value: '$12,400',
    iconName: 'DollarSign',
    variant: 'success',
  },
};

export const WithImage: Story = {
  render: Template,
  args: {
    title: 'Profile Views',
    value: '8.1k',
    image: '/example-image.jpg',
    imageAlt: 'Profile image',
    variant: 'info',
  },
};

export const Destructive: Story = {
  render: Template,
  args: {
    title: 'Errors',
    value: '512',
    iconName: 'TriangleAlert',
    variant: 'destructive',
  },
};

export const Clickable: Story = {
  render: Template,
  args: {
    title: 'Users',
    value: '1.2k',
    iconName: 'User',
    variant: 'primary',
    onClick: () => alert('Card clicked!'),
  },
};
