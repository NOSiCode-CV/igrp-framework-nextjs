import type { Meta, StoryObj } from '@storybook/react';
import { ProgressIGRP } from '.';

const meta: Meta<typeof ProgressIGRP> = {
  title: 'Components/Progress',
  component: ProgressIGRP,
  argTypes: {
    className: {
      control: 'text',
      description: 'Custom class name for the progress bar',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProgressIGRP>;

export const Default: Story = {
  args: {
    className: 'w-[60%]',
  },
};

export const CustomWidth: Story = {
  args: {
    className: 'w-[80%]',
  },
};
