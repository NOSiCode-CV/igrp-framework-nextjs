'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { IGRPStatsCard, type IGRPStatsCardProps } from '@igrp/igrp-framework-react-design-system';
import { action } from 'storybook/actions';

const handleClick = action('onClick');

const meta: Meta<typeof IGRPStatsCard> = {
  title: 'Components/StatsCard',
  component: IGRPStatsCard,
  parameters: {
    docs: {
      description: {
        component: 'A primitive stats card component with full customization through CVA variants.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text',
    },
    titleSize: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
      description: 'Title text size',
    },
    value: {
      control: 'text',
      description: 'The value to display',
    },
    valueSize: {
      control: 'select',
      options: ['sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
      description: 'Value text size',
    },
    iconName: {
      control: 'text',
      description: 'Icon name from MyIcon component',
    },
    iconSize: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Icon container size',
    },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Position of the icon',
    },
    showIconBorder: {
      control: 'boolean',
      description: 'Whether to show icon background border',
    },
    showIconBackground: {
      control: 'boolean',
      description: 'Whether to show icon background',
    },
    iconBackground: {
      control: 'select',
      options: ['none', 'rounded', 'square'],
      description: 'Icon background shape',
    },
    iconVariant: {
      control: 'select',
      options: [
        'none',
        'primary',
        'secondary',
        'success',
        'destructive',
        'warning',
        'info',
        'indigo',
      ],
      description: 'Icon color variant',
    },

    cardBorder: {
      control: 'select',
      options: [
        'none',
        'rounded-sm',
        'rounded-md',
        'rounded-lg',
        'rounded-xl',
        'rounded-2xl',
        'rounded-3xl',
        'rounded-full',
        'square',
      ],
      description: 'Card border style',
    },
    cardBorderPosition: {
      control: 'select',
      options: ['none', 'top', 'bottom', 'left', 'right'],
      description: 'Position of thick border',
    },
    cardVariant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'destructive', 'warning', 'info', 'indigo'],
      description: 'Color variant for borders',
    },
    itemPlacement: {
      control: 'select',
      options: ['start', 'end'],
      description: 'Alignment of the content block (title + value + icon)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPStatsCard>;

const Template = (args: IGRPStatsCardProps) => (
  <div className='container mx-auto px-4 py-12'>
    <IGRPStatsCard {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
  args: {
    title: 'Total Users',
    value: '1,234',
    iconName: 'Users',
    iconPlacement: 'end',
    itemPlacement: 'start',
    cardBorder: 'rounded-xl',
    cardBorderPosition: 'none',
    cardVariant: 'primary',
    titleSize: 'sm',
    valueSize: '2xl',
    iconSize: 'md',
    showIconBackground: false,
    iconBackground: 'none',
    showIconBorder: false,
    iconVariant: 'primary',
  },
};

export const WithBackground: Story = {
  render: Template,
  args: {
    title: 'Revenue',
    value: '$12,345',
    iconName: 'DollarSign',
    iconPlacement: 'end',
    cardBorder: 'rounded-xl',
    cardBorderPosition: 'none',
    cardVariant: 'success',
    titleSize: 'sm',
    valueSize: '2xl',
    iconSize: 'md',
    showIconBackground: true,
    iconBackground: 'rounded',
    showIconBorder: false,
    iconVariant: 'success',
  },
};

export const WithBorder: Story = {
  render: Template,
  args: {
    title: 'Active Projects',
    value: '42',
    iconName: 'FolderOpen',
    iconPlacement: 'start',
    cardBorder: 'rounded-lg',
    cardBorderPosition: 'left',
    cardVariant: 'info',
    titleSize: 'sm',
    valueSize: '3xl',
    iconSize: 'lg',
    showIconBackground: false,
    iconBackground: 'square',
    showIconBorder: true,
    iconVariant: 'info',
  },
};

export const MinimalStyle: Story = {
  render: Template,
  args: {
    title: 'Downloads',
    value: '2.4K',
    iconName: 'Download',
    iconPlacement: 'start',
    cardBorder: 'square',
    cardBorderPosition: 'none',
    cardVariant: 'primary',
    titleSize: 'sm',
    valueSize: '2xl',
    iconSize: 'md',
    showIconBackground: false,
    iconBackground: 'square',
    showIconBorder: true,
    iconVariant: 'primary',
  },
};

export const ItemPlacementVariants: Story = {
  render: () => (
    <div className='space-y-6 px-4 py-12'>
      <IGRPStatsCard
        title='Start / Start'
        value='1,234'
        iconName='Users'
        iconPlacement='start'
        itemPlacement='start'
        cardBorder='rounded-xl'
      />
      <IGRPStatsCard
        title='End / Start'
        value='1,234'
        iconName='Users'
        iconPlacement='end'
        itemPlacement='start'
        cardBorder='rounded-xl'
      />
      <IGRPStatsCard
        title='Start / End'
        value='1,234'
        iconName='Users'
        iconPlacement='start'
        itemPlacement='end'
        cardBorder='rounded-xl'
      />
      <IGRPStatsCard
        title='End / End'
        value='1,234'
        iconName='Users'
        iconPlacement='end'
        itemPlacement='end'
        cardBorder='rounded-xl'
      />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-12'>
      <IGRPStatsCard
        title='Primary'
        value='123'
        iconName='Star'
        cardVariant='primary'
        iconVariant='primary'
        showIconBackground
        iconBackground='rounded'
      />
      <IGRPStatsCard
        title='Success'
        value='456'
        iconName='CircleCheck'
        cardVariant='success'
        iconVariant='success'
        showIconBackground
        iconBackground='rounded'
      />
      <IGRPStatsCard
        title='Warning'
        value='789'
        iconName='TriangleAlert'
        cardVariant='warning'
        iconVariant='warning'
        showIconBackground
        iconBackground='rounded'
      />
      <IGRPStatsCard
        title='Destructive'
        value='012'
        iconName='CircleX'
        cardVariant='destructive'
        iconVariant='destructive'
        showIconBackground
        iconBackground='rounded'
      />
      <IGRPStatsCard
        title='Info'
        value='345'
        iconName='Info'
        cardVariant='info'
        iconVariant='info'
        showIconBackground
        iconBackground='rounded'
      />
      <IGRPStatsCard
        title='Indigo'
        value='678'
        iconName='Sparkles'
        cardVariant='indigo'
        iconVariant='indigo'
        showIconBackground
        iconBackground='rounded'
      />
    </div>
  ),
};

export const Interactive: Story = {
  render: Template,
  args: {
    title: 'Click Me',
    value: '999',
    iconName: 'MousePointer',
    onClick: handleClick,
    cardBorder: 'rounded-xl',
    cardBorderPosition: 'left',
    cardVariant: 'primary',
    iconVariant: 'primary',
    showIconBackground: true,
    iconBackground: 'rounded',
    iconPlacement: 'start',
  },
};
