import type { Meta, StoryObj } from '@storybook/react';
import { IGRPStatusBanner, type IGRPStatusBannerProps } from '.';
import { IGRPColorObjectRole, IGRPColorObjectVariants } from '@/lib/colors';

const meta: Meta<typeof IGRPStatusBanner> = {
  title: 'Custom/StatusBanner',
  component: IGRPStatusBanner,
  argTypes: {
    variant: {
      control: 'select',
      options: IGRPColorObjectRole,
    },
    color: {
      control: 'select',
      options: IGRPColorObjectVariants,
    },
    text: { control: 'text' },
    badgeVariant: {
      control: 'select',
      options: IGRPColorObjectRole,
    },
    badgeColor: {
      control: 'select',
      options: IGRPColorObjectVariants,
    },
    badgeText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPStatusBanner>;

const Template = (args: IGRPStatusBannerProps) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPStatusBanner {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
};
