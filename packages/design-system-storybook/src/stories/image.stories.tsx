import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPImage } from '@igrp/igrp-framework-react-design-system';

export default {
  title: 'Components/Image',
  component: IGRPImage,
  argTypes: {
    alt: { control: 'text' },
    width: { control: 'number' },
    height: { control: 'number' },
    className: { control: 'text' },
    ratio: { control: 'select',
      options: ['1/1', '4/3', '16/9', '21/9',undefined],
      description: 'Image ratio',
      default: '16/9',
     },
     rounded: {
      control: 'select',
      description: 'Radius',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', 'full'],
      defaultValue: 'none',
    },
  },
} as Meta;

const Template: StoryFn<typeof IGRPImage> = (args) => (
  <div className='container my-10 mx-auto p-4'>
    <IGRPImage       
      {...args} 
    />
  </div>
);

export const Default: StoryObj<typeof IGRPImage> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
  },
};
export const LabelClassName: StoryObj<typeof IGRPImage> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    width:200,
    height:200,
  },
};
export const Ratio: StoryObj<typeof IGRPImage> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    ratio: '4/3',
  },
};
export const BorderRadius: StoryObj<typeof IGRPImage> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    ratio: '21/9',
  },
};
