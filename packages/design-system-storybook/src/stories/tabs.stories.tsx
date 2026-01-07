'use client';

import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import type { JSX } from 'react/jsx-runtime';
import {
  IGRPTabs,
  type IGRPTabsProps,
  type IGRPTabItem,
  IGRPFormList,
  IGRPCombobox,
  cn,
  IGRPInputFile,
  IGRPInputHidden,
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
    fullWidth: {
      control: 'boolean',
      description: 'Whether tab list spans full width',
    },
    contentBorder: {
      control: 'boolean',
      description: 'Apply border to tab content panel',
    },
    showBadge: {
      control: 'boolean',
      description: 'Whether to show badges in tabs',
    },
    badgePlacement: {
      control: { type: 'select' },
      options: ['start', 'end'],
      description: 'Position of the badge relative to the tab label',
    },
    showScrollIndicators: {
      control: 'boolean',
      description: 'Whether to show scroll indicators when tabs overflow',
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
    scrollButtonClassName: {
      control: 'text',
      description: 'Custom className for scroll indicator buttons',
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

const manyItems = () => (
  <IGRPFormList
    id='formList1'
    label='Documentos'
    description='Documentos do contribuinte'
    color='primary'
    variant='solid'
    addButtonLabel='Add'
    iconName='FileText'
    addButtonIconName='Plus'
    renderItem={(_: any, index: number) => (
      <div className='grid sm:grid-cols-1 md:grid-cols-2 gap-4'>
        <IGRPCombobox
          id={`formList1.${index}.idTipoDocumento`}
          label='Tipo de Documento'
          variant='single'
          placeholder='Select an option...'
          selectLabel='No option found'
          showSearch={true}
          showIcon={false}
          iconName='CornerDownRight'
          className={cn('col-span-1',)}
          onChange={() => { }}
          value={''}
          options={[]}
        />
        <IGRPInputFile
          id='formList1.${index}.inputFile1'
          label='Input File'
          accept='application/pdf'
        />
        <IGRPInputHidden
          id='formList1.${index}.url'
          label='url'
        />
        <IGRPInputHidden
          id='formList1.${index}.inputHidden5'
          label='Doc Id'
        />
      </div>
    )}

    defaultItem={[]}
  />
)


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
    content: manyItems(),
    icon: 'Bell',
  },
];

const tabsWithBadges: IGRPTabItem[] = [
  {
    value: 'inbox',
    label: 'Inbox',
    content: createTabContent('Inbox'),
    icon: 'Inbox',
    badgeContent: 5,
    badgeVariant: 'solid',
    badgeColor: 'primary',
    badgeClassName: 'px-1.5 rounded-full',
  },
  {
    value: 'sent',
    label: 'Sent',
    content: createTabContent('Sent'),
    icon: 'Send',
    badgeContent: 12,
    badgeVariant: 'soft',
    badgeColor: 'success',
  },
  {
    value: 'drafts',
    label: 'Drafts',
    content: createTabContent('Drafts'),
    icon: 'FileText',
    badgeContent: 3,
    badgeVariant: 'solid',
    badgeColor: 'warning',
  },
  {
    value: 'spam',
    label: 'Spam',
    content: createTabContent('Spam'),
    icon: 'Bell',
    badgeContent: '99+',
    badgeVariant: 'solid',
    badgeColor: 'destructive',
  },
];

const tabsWithDisabled: IGRPTabItem[] = [
  {
    value: 'active',
    label: 'Active',
    content: createTabContent('Active'),
    icon: 'Check',
  },
  {
    value: 'pending',
    label: 'Pending',
    content: createTabContent('Pending'),
    icon: 'Clock',
    disabled: true,
  },
  {
    value: 'completed',
    label: 'Completed',
    content: createTabContent('Completed'),
    icon: 'Check',
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
    content: manyItems(),
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

export const WithBadges: Story = {
  render: Template,
  args: {
    items: tabsWithBadges,
    showIcon: true,
    showBadge: true,
    badgePlacement: 'end',
  },
};

export const WithBadgesStart: Story = {
  render: Template,
  args: {
    items: tabsWithBadges,
    showIcon: false,
    showBadge: true,
    badgePlacement: 'start',   
  },
};

export const WithDisabled: Story = {
  render: Template,
  args: {
    items: tabsWithDisabled,
    showIcon: true,
  },
};

export const AllVariants: Story = {
  render: Template,
  args: {
    items: tabsWithIcons,
    showIcon: true,
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'pills', 'underline', 'cards'],
    },
  },
};

export const WithScrollIndicators: Story = {
  render: Template,
  args: {
    items: manyTabs,
    showIcon: true,
    showScrollIndicators: true,
  },
};

export const WithoutScrollIndicators: Story = {
  render: Template,
  args: {
    items: manyTabs,
    showIcon: true,
    showScrollIndicators: false,
  },
};
