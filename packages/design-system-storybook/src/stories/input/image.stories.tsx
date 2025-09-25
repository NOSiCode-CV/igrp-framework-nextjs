import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPImage, type IGRPImageProps } from '@igrp/igrp-framework-react-design-system';


export default {
  title: 'Components/Image',
  component: IGRPImage,
  argTypes: {
    alt: { control: 'text' },
    width: { control: 'number' },
    height: { control: 'number' },
    labelClassName: { control: 'text' },
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
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf_HNkqoUPKhNV0qukwpQFXeBap9onZrkNRA&s',
    width:500,
    height:500
  },
};
