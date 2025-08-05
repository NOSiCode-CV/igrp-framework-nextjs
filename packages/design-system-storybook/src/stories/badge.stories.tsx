import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPBadge,
  IGRPIconObject,
  IGRPColorObjectVariants,
  IGRPColorObjectRole,
} from '@igrp/igrp-framework-react-design-system';

export default {
  title: 'Components/Badge',
  component: IGRPBadge,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: IGRPColorObjectRole,
      description: 'The visual style of the IGRPBadge',
    },
    color: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'The color of the IGRPBadge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the IGRPBadge',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show an icon',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon',
    },
    dot: {
      control: 'boolean',
      description: 'Whether to show a colored dot before the text',
    },
    children: {
      control: 'text',
      description: 'The content of the IGRPBadge',
    },
  },
} as Meta;

type Story = StoryObj<typeof IGRPBadge>;

export const Default: Story = {
  args: {
    children: 'IGRPBadge',
    variant: 'solid',
    color: 'primary',
    size: 'md',
    showIcon: false,
    dot: false,
  },
};

// Variants showcase
export const Variants: Story = {
  render: (args) => (
    <div className='flex flex-wrap gap-4'>
      <IGRPBadge
        variant='solid'
        color={args.color}
        size={args.size}
        showIcon={args.showIcon}
        dot={args.dot}
      >
        Solid
      </IGRPBadge>
      <IGRPBadge
        variant='outline'
        color={args.color}
        size={args.size}
        showIcon={args.showIcon}
        dot={args.dot}
      >
        Outline
      </IGRPBadge>
      <IGRPBadge
        variant='soft'
        color={args.color}
        size={args.size}
        showIcon={args.showIcon}
        dot={args.dot}
      >
        Soft
      </IGRPBadge>
    </div>
  ),
};

// Colors showcase
export const Colors: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge color='primary'>Primary</IGRPBadge>
        <IGRPBadge color='secondary'>Secondary</IGRPBadge>
        <IGRPBadge color='success'>Success</IGRPBadge>
        <IGRPBadge color='destructive'>Error</IGRPBadge>
        <IGRPBadge color='warning'>Warning</IGRPBadge>
        <IGRPBadge color='info'>Info</IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='outline'
          color='primary'
        >
          Default
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='primary'
        >
          Primary
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='secondary'
        >
          Secondary
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='success'
        >
          Success
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='destructive'
        >
          Error
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='warning'
        >
          Warning
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          color='info'
        >
          Info
        </IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='soft'
          color='primary'
        >
          Primary
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          color='secondary'
        >
          Secondary
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          color='success'
        >
          Success
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          color='destructive'
        >
          Error
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          color='warning'
        >
          Warning
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          color='info'
        >
          Info
        </IGRPBadge>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <IGRPBadge size='sm'>Small</IGRPBadge>
      <IGRPBadge size='md'>Medium</IGRPBadge>
      <IGRPBadge size='lg'>Large</IGRPBadge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          showIcon
          color='success'
        >
          Success
        </IGRPBadge>
        <IGRPBadge
          showIcon
          color='destructive'
        >
          Error
        </IGRPBadge>
        <IGRPBadge
          showIcon
          color='primary'
        >
          Info
        </IGRPBadge>
        <IGRPBadge
          showIcon
          color='secondary'
        >
          Featured
        </IGRPBadge>
        <IGRPBadge
          showIcon
          color='warning'
        >
          Warning
        </IGRPBadge>
        <IGRPBadge
          showIcon
          color='info'
        >
          Information
        </IGRPBadge>
        <IGRPBadge showIcon>Notification</IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='outline'
          showIcon
          color='success'
        >
          Success
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          showIcon
          color='destructive'
        >
          Error
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          showIcon
          color='primary'
        >
          Info
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          showIcon
          color='warning'
        >
          Warning
        </IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='soft'
          showIcon
          color='success'
        >
          Success
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          showIcon
          color='destructive'
        >
          Error
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          showIcon
          color='primary'
        >
          Info
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          showIcon
          color='warning'
        >
          Warning
        </IGRPBadge>
      </div>
    </div>
  ),
};

export const WithDots: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          dot
          color='success'
        >
          Active
        </IGRPBadge>
        <IGRPBadge
          dot
          color='destructive'
        >
          Failed
        </IGRPBadge>
        <IGRPBadge
          dot
          color='primary'
        >
          Processing
        </IGRPBadge>
        <IGRPBadge
          dot
          color='secondary'
        >
          Pending
        </IGRPBadge>
        <IGRPBadge
          dot
          color='warning'
        >
          Attention
        </IGRPBadge>
        <IGRPBadge
          dot
          color='indigo'
        >
          Attention
        </IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='outline'
          dot
          color='success'
        >
          Active
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          dot
          color='destructive'
        >
          Failed
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          dot
          color='primary'
        >
          Processing
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          dot
          color='warning'
        >
          Attention
        </IGRPBadge>
        <IGRPBadge
          variant='outline'
          dot
          color='indigo'
        >
          Alert
        </IGRPBadge>
      </div>
      <div className='flex flex-wrap gap-4'>
        <IGRPBadge
          variant='soft'
          dot
          color='success'
        >
          Active
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          dot
          color='destructive'
        >
          Failed
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          dot
          color='primary'
        >
          Processing
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          dot
          color='warning'
        >
          Attention
        </IGRPBadge>
        <IGRPBadge
          variant='soft'
          dot
          color='indigo'
        >
          Attention
        </IGRPBadge>
      </div>
    </div>
  ),
};

export const DotsAndIcons: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <IGRPBadge
        dot
        showIcon
        color='success'
      >
        Active
      </IGRPBadge>
      <IGRPBadge
        dot
        showIcon
        color='destructive'
      >
        Failed
      </IGRPBadge>
      <IGRPBadge
        dot
        showIcon
        color='primary'
      >
        Processing
      </IGRPBadge>
      <IGRPBadge
        dot
        iconName='Star'
        color='secondary'
      >
        Featured
      </IGRPBadge>
      <IGRPBadge
        dot
        showIcon
        color='warning'
      >
        Attention
      </IGRPBadge>
    </div>
  ),
};

export const IconSizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <IGRPBadge
        size='sm'
        showIcon
        color='primary'
      >
        Small
      </IGRPBadge>
      <IGRPBadge
        size='md'
        showIcon
        color='primary'
      >
        Medium
      </IGRPBadge>
      <IGRPBadge
        size='lg'
        showIcon
        color='primary'
      >
        Large
      </IGRPBadge>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <IGRPBadge
        showIcon
        color='primary'
      />
      <IGRPBadge
        showIcon
        color='success'
      />
      <IGRPBadge
        showIcon
        color='destructive'
      />
      <IGRPBadge
        showIcon
        color='warning'
      />
      <IGRPBadge
        iconName='Info'
        color='primary'
        variant='outline'
      />
      <IGRPBadge
        iconName='Star'
        color='secondary'
        variant='soft'
      />
    </div>
  ),
};

export const UsageExamples: Story = {
  render: () => (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-medium'>Status indicators</h3>
        <div className='flex flex-wrap gap-3'>
          <IGRPBadge
            variant='soft'
            color='success'
            dot
          >
            Active
          </IGRPBadge>
          <IGRPBadge
            variant='soft'
            color='destructive'
            dot
          >
            Failed
          </IGRPBadge>
          <IGRPBadge
            variant='soft'
            color='primary'
            dot
          >
            Pending
          </IGRPBadge>
          <IGRPBadge
            variant='outline'
            color='primary'
            dot
          >
            Processing
          </IGRPBadge>
          <IGRPBadge
            variant='soft'
            color='warning'
            dot
          >
            Attention Required
          </IGRPBadge>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-medium'>Categories</h3>
        <div className='flex flex-wrap gap-3'>
          <IGRPBadge
            variant='solid'
            color='primary'
          >
            Technology
          </IGRPBadge>
          <IGRPBadge
            variant='solid'
            color='secondary'
          >
            Design
          </IGRPBadge>
          <IGRPBadge
            variant='solid'
            color='success'
          >
            Marketing
          </IGRPBadge>
          <IGRPBadge
            variant='solid'
            color='primary'
          >
            Business
          </IGRPBadge>
          <IGRPBadge
            variant='solid'
            color='info'
          >
            Education
          </IGRPBadge>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-medium'>Notifications</h3>
        <div className='flex flex-wrap gap-3'>
          <IGRPBadge
            variant='solid'
            color='destructive'
            size='sm'
          >
            3
          </IGRPBadge>
          <IGRPBadge
            variant='outline'
            color='primary'
            iconName='Bell'
          >
            New messages
          </IGRPBadge>
          <IGRPBadge
            variant='soft'
            color='success'
            dot
          >
            Updated
          </IGRPBadge>
          <IGRPBadge
            variant='soft'
            color='warning'
            showIcon
          >
            Expiring soon
          </IGRPBadge>
        </div>
      </div>
    </div>
  ),
};
