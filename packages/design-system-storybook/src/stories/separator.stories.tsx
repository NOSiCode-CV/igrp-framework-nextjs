import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Separator',
  component: IGRPSeparator,
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof IGRPSeparator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal separator dividing stacked content. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <div className='p-6 max-w-sm'>
      <div>
        <h4 className='text-sm font-medium text-foreground'>IGRP Design System</h4>
        <p className='text-sm text-muted-foreground'>An open-source component library.</p>
      </div>
      <IGRPSeparator {...args} className='my-4' />
      <p className='text-sm text-muted-foreground'>Content below the divider.</p>
    </div>
  ),
};

/** Vertical separator between inline items. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className='p-6'>
      <div className='flex h-5 items-center gap-4 text-sm'>
        <span>Blog</span>
        <IGRPSeparator {...args} />
        <span>Docs</span>
        <IGRPSeparator {...args} />
        <span>Source</span>
      </div>
    </div>
  ),
};
