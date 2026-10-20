import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPLoadingSpinner } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/LoadingSpinner',
  component: IGRPLoadingSpinner,
  argTypes: {
    label: { control: 'text' },
    className: { control: 'text' },
    parentClassName: { control: 'text' },
  },
} satisfies Meta<typeof IGRPLoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default centered spinner. Announces its busy state via role="status". */
export const Default: Story = {};

/** Larger spinner with a custom accessible label. */
export const CustomSize: Story = {
  args: {
    className: 'size-20',
    label: 'Loading dashboard…',
  },
};

/** Constrained container height via parentClassName. */
export const CompactContainer: Story = {
  args: {
    parentClassName: 'h-32 rounded-lg border bg-muted',
  },
};
