import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { IGRPImageCropper } from '@igrp/igrp-framework-react-design-system';

const SAMPLE_IMAGE = 'https://picsum.photos/id/237/600/400';

const meta = {
  title: 'Components/ImageCropper',
  component: IGRPImageCropper,
  argTypes: {
    variant: {
      control: 'select',
      options: ['basic', 'circular', 'zoom', 'preview'],
    },
    src: { control: 'text' },
    cropLabel: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    src: SAMPLE_IMAGE,
    onCrop: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <div className='p-6 max-w-xl'>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IGRPImageCropper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic rectangular crop area. */
export const Basic: Story = {
  args: { variant: 'basic' },
};

/** Circular crop mask — useful for avatars. */
export const Circular: Story = {
  args: { variant: 'circular' },
};

/** Adds a zoom slider below the crop area. */
export const WithZoom: Story = {
  args: { variant: 'zoom' },
};

/** Zoom plus a live preview of the cropped result. */
export const WithPreview: Story = {
  args: { variant: 'preview', cropLabel: 'Apply crop' },
};
