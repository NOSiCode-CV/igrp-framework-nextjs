import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { IGRPAlert } from '@/components/igrp/alert';
import { IGRPIconObject } from '@/components/igrp/icon';
import { IGRPColorObjectVariants, IGRPColorObjectRole } from '@/lib/colors';

const meta: Meta<typeof IGRPAlert> = {
  title: 'Components/Alert',
  component: IGRPAlert,
  tags: ['autodocs'],
  argTypes: {
    iconName: {
      control: 'select',
      options: IGRPIconObject,
    },
    iconClassName: { control: 'text' },
    variant: {
      control: 'select',
      options: IGRPColorObjectRole,
    },
    color: {
      control: 'select',
      options: IGRPColorObjectVariants,
    },
    linkLabel: { control: 'text' },
    linkUrl: { control: 'text' },
    linkIcon: { control: 'text' },
    showLink: { control: 'boolean' },
    textColored: { control: 'boolean' },
    borderColored: { control: 'boolean' },
    bgColored: { control: 'boolean' },
    className: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPAlert>;

const AlertDemo: StoryFn<typeof IGRPAlert> = (args) => (
  <div className='container mx-auto px-4 py-10'>
    <IGRPAlert {...args}>{args.children}</IGRPAlert>
  </div>
);

export const Default: Story = {
  render: AlertDemo,
  args: {
    variant: 'soft',
    color: 'info',
    children: (
      <>
        <p className='text-sm font-medium'>Password does not meet requirements:</p>
        <ul className='list-inside list-disc text-sm opacity-80'>
          <li>Minimum 8 characters</li>
          <li>Inlcude a special character</li>
        </ul>
      </>
    ),
  },
};

export const WithLink: Story = {
  render: AlertDemo,
  args: {
    variant: 'solid',
    color: 'info',
    children: <p>There is more information available on this topic.</p>,
    showLink: true,
    linkLabel: 'Learn More',
    linkUrl: '#',
    linkIcon: 'ArrowRight',
  },
};

export const SubtleWarning: Story = {
  render: AlertDemo,
  args: {
    iconName: 'AlertTriangle',
    variant: 'outline',
    color: 'warning',
    children: (
      <p>
        This is a <strong>subtle</strong> warning message.
      </p>
    ),
  },
};

export const NoColors: Story = {
  render: AlertDemo,
  args: {
    variant: 'soft',
    color: 'destructive',
    children: <p>This alert has no colored text, background, or border.</p>,
    textColored: false,
    bgColored: false,
    borderColored: false,
  },
};
