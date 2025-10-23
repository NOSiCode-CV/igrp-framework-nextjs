import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPImage, type IGRPImageProps } from '@igrp/igrp-framework-react-design-system';


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
     borderRadius: {
      control: 'select',
      description: 'Radius',
      options: ['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'],
      defaultValue: 'rounded-none',
    },

  },
} as Meta;

const Template: StoryFn<IGRPImageProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPImage {...args} />
  </div>
);

export const Default: StoryObj<IGRPImageProps> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
  },
};
export const LabelClassName: StoryObj<IGRPImageProps> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    width:200,
    height:200,
    labelClassName: 'mask-t-from-50%'
  },
};
export const Ratio: StoryObj<IGRPImageProps> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    ratio:4/3,
  },
};
export const BorderRadius: StoryObj<IGRPImageProps> = {
  render: Template,
  args: {
    src: 'src/stories/assets/gradient.png',
    ratio:21/9,
    borderRadius:'rounded-3xl'
  },
};
