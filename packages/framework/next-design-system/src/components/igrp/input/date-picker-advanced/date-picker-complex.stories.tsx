import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Component } from '.';

const meta: Meta<typeof Component> = {
  title: 'Components/CalendarComplex',
  component: Component,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {},
};
