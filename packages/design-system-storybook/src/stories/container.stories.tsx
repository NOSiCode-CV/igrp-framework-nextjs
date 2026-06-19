import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPContainer } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Container',
  component: IGRPContainer,
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof IGRPContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default layout container — a div with built-in padding. Accepts any standard div props. */
export const Default: Story = {
  render: (args) => (
    <div className='p-6'>
      <IGRPContainer {...args} className='rounded-lg border bg-muted'>
        <p className='text-sm text-foreground'>
          IGRPContainer wraps content with default padding. The dashed area is the container; the muted background
          shows its bounds.
        </p>
      </IGRPContainer>
    </div>
  ),
};

/** Extra padding and a max width applied via className. */
export const CustomSpacing: Story = {
  render: (args) => (
    <div className='p-6'>
      <IGRPContainer {...args} className='mx-auto max-w-md rounded-lg border bg-card p-8'>
        <h3 className='text-lg font-semibold text-foreground'>Section title</h3>
        <p className='mt-2 text-sm text-muted-foreground'>
          Override the default padding and constrain the width by passing Tailwind utilities through className.
        </p>
      </IGRPContainer>
    </div>
  ),
};
