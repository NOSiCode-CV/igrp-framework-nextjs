import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { IGRPText, type IGRPTextProps } from '.';
import { IGRPColorObjectVariants } from '@/lib/colors';

const meta: Meta<typeof IGRPText> = {
  title: 'Components/TextBlocks/DynamicText',
  component: IGRPText,
  tags: ['autodocs'],
  args: {
    children:
      'This is a dynamic text component with support for style variants, animation, truncation, and highlighting.',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: IGRPColorObjectVariants,
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold'],
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
    spacing: {
      control: 'select',
      options: ['tight', 'normal', 'loose', 'none'],
    },
    as: {
      control: 'select',
      options: ['p', 'span', 'div'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPText>;

const Template: StoryFn<IGRPTextProps> = (args: IGRPTextProps) => (
  <div className='container my-12 mx-auto'>
    <IGRPText {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
};

export const Highlighted: Story = {
  render: Template,
  args: {
    highlight: ['dynamic', 'highlighting'],
    size: 'xl',
    weight: 'medium',
  },
};

export const Animated: Story = {
  render: Template,
  args: {
    animate: true,
    as: 'p',
    children:
      "This is a dynamic paragraph component that supports various styling options, animations, text highlighting, and responsive design. It's built with flexibility in mind to handle different use cases in your application.",
  },
};

export const Truncated: Story = {
  render: Template,
  args: {
    truncate: true,
    maxLines: 2,
    variant: 'warning',
    size: 'sm',
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at viverra nulla. Proin eleifend libero nec malesuada volutpat. Donec feugiat, lorem nec laoreet elementum, metus urna tempor est, a iaculis turpis sem et sapien.',
  },
};

export const CustomTag: Story = {
  render: Template,
  args: {
    as: 'p',
    size: 'lg',
    weight: 'semibold',
    children: 'This text is rendered as a <div> instead of a <p>.',
  },
};
