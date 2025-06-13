import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { IGRPHeadline, type IGRPHeadlineProps } from '.';
import { IGRPIconObject } from '@/components/igrp/icon';
import { IGRPColorObjectRole, IGRPColorObjectVariants } from '@/lib/colors';

const meta: Meta<typeof IGRPHeadline> = {
  title: 'Components/TextBlocks/Headline',
  component: IGRPHeadline,
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    roleColor: {
      control: 'select',
      options: IGRPColorObjectRole,
      description: 'The visual style',
    },
    color: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'The visual style',
    },
    className: {
      control: 'text',
    },
    showIcon: {
      control: 'boolean',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
    },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
    },
    iconSize: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPHeadline>;

const Template: StoryFn<IGRPHeadlineProps> = (args: IGRPHeadlineProps) => (
  <div className='container mx-auto m-12'>
    <IGRPHeadline {...args} />
  </div>
);

export const WithoutDescription: Story = {
  render: Template,
  args: {
    variant: 'h1',
    title: 'Default Headline',
    description: 'This is a description text.',
  },
};

export const H2Variant: Story = {
  render: Template,
  args: {
    variant: 'h2',
    title: 'H2 Headline',
    description: 'This is a description text.',
  },
};

export const CustomClass: Story = {
  render: Template,
  args: {
    title: 'Styled Headline',
    description: 'This is a description text.',
    roleColor: 'solid',
    color: 'destructive',
  },
};
