'use client';

import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import type { JSX } from 'react/jsx-runtime';
import {
  IGRPTabs,
  type IGRPTabsProps,
  type IGRPTabItem,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPTabs> = {
  title: 'Components/Tabs',
  component: IGRPTabs,
  tags: ['autodocs'],
  argTypes: {
    showIcon: {
      control: 'boolean',
      description: 'Whether to show icons in tabs',
    },
    iconPlacement: {
      control: { type: 'select' },
      options: ['start', 'end', 'top'],
      description: 'Position of the icon relative to the tab label',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the tabs',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'pills', 'underline', 'cards'],
      description: 'Visual style variant of the tabs',
    },
    // tabSize: {
    //   control: { type: 'select' },
    //   options: ['default', 'sm', 'lg'],
    //   description: 'Size of the tab buttons',
    // },
    fullWidth: {
      control: 'boolean',
      description: 'Whether tab list spans full width',
    },
    contentBorder: {
      control: 'boolean',
      description: 'Apply border to tab content panel',
    },
    tabTriggerClassName: {
      control: 'text',
      description: 'Custom className for each tab trigger',
    },
    tabContentClassName: {
      control: 'text',
      description: 'Custom className for tab panel content',
    },
    tabListClassName: {
      control: 'text',
      description: 'Custom className for the tab list',
    },
  },
};
export default meta;

type Story = StoryObj<typeof IGRPTabs>;

const createTabContent = (label: string) => (
  <div className='space-y-4'>
    <h3 className='text-lg font-medium'>{label} Content</h3>
    <p>This is the content for the {label.toLowerCase()} tab.</p>
  </div>
);

// Data
const defaultTabs: IGRPTabItem[] = [
  { value: 'account', label: 'Account', content: createTabContent('Account') },
  { value: 'password', label: 'Password', content: createTabContent('Password') },
  { value: 'notifications', label: 'Notifications', content: createTabContent('Notifications') },
];

const tabsWithIcons: IGRPTabItem[] = [
  {
    value: 'account',
    label: 'Account',
    content: createTabContent('Account'),
    icon: 'User',
  },
  {
    value: 'password',
    label: 'Password',
    content: createTabContent('Password'),
    icon: 'Lock',
  },
  {
    value: 'notifications',
    label: 'Notifications',
    content: createTabContent('Notifications'),
    icon: 'Bell',
  },
];

const iconOnlyTabs: IGRPTabItem[] = [
  { value: 'user', label: '', content: createTabContent('User'), icon: 'User' },
  { value: 'settings', label: '', content: createTabContent('Settings'), icon: 'Settings' },
  { value: 'bell', label: '', content: createTabContent('Notifications'), icon: 'Bell' },
];

const manyTabs: IGRPTabItem[] = [
  ...tabsWithIcons,
  {
    value: 'settings',
    label: 'Settings',
    content: createTabContent('Settings'),
    icon: 'Settings',
  },
  {
    value: 'security',
    label: 'Security',
    content: createTabContent('Security'),
    icon: 'Shield',
  },
  {
    value: 'billing',
    label: 'Billing',
    content: createTabContent('Billing'),
    icon: 'CreditCard',
  },
  { value: 'api', label: 'API', content: createTabContent('API'), icon: 'Code' },
  { value: 'logs', label: 'Logs', content: createTabContent('Logs'), icon: 'FileText' },
];

// Template
const Template: StoryFn<IGRPTabsProps> = (args: JSX.IntrinsicAttributes & IGRPTabsProps) => (
  <div className='container my-10 mx-auto'>
    <IGRPTabs {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
  args: {
    items: defaultTabs,
  },
};

export const WithIcons: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
  },
};

export const WithIconPlacement: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    iconPlacement: 'top',
  },
};

export const IconsOnly: Story = {
  render: Template,
  args: {
    items: iconOnlyTabs,
    showIcon: true,
    variant: 'pills',
  },
};

export const ManyTabs: Story = {
  render: Template,
  args: {
    items: manyTabs,
    showIcon: true,
  },
};

export const WithVariant: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    variant: 'cards',
  },
};

export const WithFullWidth: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    fullWidth: true,
  },
};

export const WithBorderedContent: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    contentBorder: true,
  },
};

export const WithCustomClassNames: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    tabTriggerClassName: 'text-blue-600 data-[state=active]:text-blue-900',
    tabContentClassName: 'bg-muted p-4 rounded-lg shadow',
  },
};

export const WithOrientation: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    orientation: 'vertical',
  },
};

export const WithSizes: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    // tabSize: 'sm',
  },
};
