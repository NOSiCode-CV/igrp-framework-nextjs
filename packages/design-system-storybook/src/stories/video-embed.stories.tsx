import { IGRPVideoEmbed, type IGRPVideoEmbedProps } from '@igrp/igrp-framework-react-design-system';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
  title: 'Components/VideoEmbed',
  component: IGRPVideoEmbed,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    aspectRatio: {
      control: 'select',
      options: ['1/1', '3/2', '4/3', '16/9', '21/9', 'auto'],
      description: 'Image ratio',
      default: '16/9',
    },
    src: {
      control: 'text',
      description: 'Video Source',
    },
    title: {
      control: 'text',
      description: 'Video title',
    },
    loading: {
      control: 'select',
      description: 'Video title',
      options: ['lazy', 'eager', 'auto'],
      defaultValue: 'auto',
    },
    allow: {
      control: 'check',
      description: 'Video title',
      options: [
        'autoplay',
        'clipboard-write',
        'encrypted-media',
        'gyroscope',
        'picture-in-picture',
        'web-share',
      ],
      defaultValue: 'autoplay',
    },
    allowFullScreen: {
      control: 'boolean',
      description: 'Video title',
    },
    autoplay: {
      control: 'boolean',
      description: 'Video title',
    },
    muted: {
      control: 'boolean',
      description: 'Video title',
    },
    controls: {
     control: 'boolean',
      description: 'Video title',
    },
    loop: {
      control: 'boolean',
      description: 'Video title',
    },
  },
} satisfies Meta<IGRPVideoEmbedProps>;

export default meta;
type Story = StoryObj<typeof IGRPVideoEmbed>;

const Template = (args: IGRPVideoEmbedProps) => {
  return (
    <div className='p-3'>
      <IGRPVideoEmbed {...args}>Open Alert Dialog</IGRPVideoEmbed>
    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    aspectRatio: '16/9',
    src: 'https://www.youtube.com/embed/tqJN0u9T98g?si=WrK-u8rgK5MhWYHo',
    title: 'Embed Video',
    loading: 'eager',
    allow: ['autoplay', 'encrypted-media'],
    allowFullScreen: true,
    autoplay: true,
    muted: true,
    loop: true,
    controls: true,
  },
};

export const NoAutoPlay: Story = {
  render: Template,
  args: {
    aspectRatio: '1/1',
    src: 'https://www.youtube.com/embed/tqJN0u9T98g?si=WrK-u8rgK5MhWYHo',
    title: 'Embed Video',
    loading: 'lazy',
    allow: ['autoplay', 'encrypted-media'],
    allowFullScreen: false,
    autoplay: false,
    muted: true,
    loop: true,
    controls: true,
  },
};
export const Muted: Story = {
  render: Template,
  args: {
    aspectRatio: '1/1',
    src: 'https://www.youtube.com/embed/tqJN0u9T98g?si=WrK-u8rgK5MhWYHo',
    title: 'Embed Video',
    loading: 'lazy',
    allow: ['autoplay', 'encrypted-media'],
    allowFullScreen: false,
    autoplay: false,
    muted: true,
    loop: true,
    controls: true,
  },
};
export const AllowFullScreen: Story = {
  render: Template,
  args: {
    aspectRatio: '1/1',
    src: 'https://www.youtube.com/embed/tqJN0u9T98g?si=WrK-u8rgK5MhWYHo',
    title: 'Embed Video',
    loading: 'lazy',
    allow: ['autoplay'],
    allowFullScreen: true,
    autoplay: true,
    muted: true,
    loop: true,
    controls: true,
  },
};
export const NoControls: Story = {
  render: Template,
  args: {
    aspectRatio: '1/1',
    src: 'https://www.youtube.com/embed/tqJN0u9T98g?si=MGLy73pVgebnmCJg',
    title: 'Embed Video',
    loading: 'lazy',
    allow: ['autoplay', 'encrypted-media'],
    allowFullScreen: false,
    autoplay: false,
    muted: true,
    loop: true,
    controls: false,
  },
};
export const InvalidUrl: Story = {
  render: Template,
  args: {
    aspectRatio: '1/1',
    src: 'https://youtu.be/tqJN0u9T98g?si=Zv71XxNwn8_L0VzZ',
    title: 'Embed Video',
    loading: 'lazy',
    allow: ['autoplay', 'encrypted-media'],
    allowFullScreen: false,
    autoplay: false,
    muted: true,
    loop: true,
    controls: false,
  },
};
