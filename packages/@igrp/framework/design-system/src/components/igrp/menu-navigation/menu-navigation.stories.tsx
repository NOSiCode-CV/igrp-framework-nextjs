/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { IGRPNavigationExample } from './example';
import {
  IGRPMenuNavigation,
  type IGRPMenuNavigationProps,
  IGRPMenuNavigationProvider,
  useIGRPMenuNavigation,
  type IGRPMenuNavigationItem,
} from '.';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/horizon/card';

const meta: Meta<typeof IGRPMenuNavigation> = {
  title: 'Components/MenuNavigation',
  component: IGRPMenuNavigation,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <IGRPMenuNavigationProvider>
        <div style={{ height: '100vh', overflow: 'auto' }}>
          <Story />
        </div>
      </IGRPMenuNavigationProvider>
    ),
  ],
  argTypes: {
    sections: {
      control: { type: 'object' },
      description: 'Array of navigation items to render',
    },
    activeSection: {
      control: { type: 'text' },
      description: 'ID of the currently active section',
    },
    onSectionChange: {
      action: 'onSectionChange',
      description: 'Callback when a section is selected',
    },
    title: {
      control: { type: 'text' },
      description: 'Optional title for the menu navigation',
    },
    badgeContent: {
      control: { type: 'text' },
      description: 'Content of the badge displayed near the title',
    },
    badgeVariant: {
      control: { type: 'radio' },
      options: ['outline', 'solid', 'soft'],
      description: 'Visual style of the badge',
    },
    badgeColor: {
      control: { type: 'select' },
      options: ['primary', 'success', 'destructive', 'warning', 'info', 'secondary', 'indigo'],
      description: 'Color of the badge',
    },
    badgeClassName: {
      control: { type: 'text' },
      description: 'CSS class to customize the badge appearance',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes for the component',
    },
    isStickyTop: {
      control: { type: 'boolean' },
      description: 'Fix the menu at the top of the container',
    },
    showChevron: {
      control: { type: 'boolean' },
      description: 'Show a chevron icon for dropdowns or expandable items',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPMenuNavigation>;

const sampleSections: IGRPMenuNavigationItem[] = [
  { id: 'section1', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'section2', label: 'Settings', icon: 'Settings' },
  { id: 'section3', label: 'Billing', icon: 'CreditCard' },
  { id: 'section4', label: 'Reports', icon: 'FileText' },
];

const StoryContent = (args: IGRPMenuNavigationProps) => {
  const [activeSection, setActiveSection] = useState('section1');
  const { getSectionRef } = useIGRPMenuNavigation();

  return (
    <div className='relative container mx-auto px-6 py-10'>
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
        <div className='lg:col-span-1'>
          <IGRPMenuNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            {...args}
          />
        </div>

        <div className='lg:col-span-3 space-y-6'>
          {sampleSections.map((section) => (
            <div
              key={section.id}
              ref={getSectionRef(section.id)}
              data-section-id={section.id}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{section.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    This is the content for {section.label}. Lorem ipsum dolor sit amet consectetur
                    adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In
                    id cursus mi pretium tellus duis convallis.
                  </p>
                  <br />
                  <p>
                    Additional content to make this section longer for better scroll demonstration.
                    Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec
                    metus bibendum egestas.
                  </p>
                  <br />
                  <p>
                    Even more content to ensure proper scrolling behavior in Storybook environment.
                    Iaculis massa nisl malesuada lacinia integer nunc posuere.
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: StoryContent,
  args: {
    sections: sampleSections,
    title: 'Main Menu',
    badgeContent: '4',
    badgeVariant: 'soft',
    badgeColor: 'info',
  },
};

export const FullExample: Story = {
  render: () => <IGRPNavigationExample />,
};

export const CompactVariant: Story = {
  render: () => {
    const [activeSection, setActiveSection] = useState('section1');

    return (
      <div className='p-4'>
        <IGRPMenuNavigation
          sections={sampleSections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          title='Compact Menu'
          showChevron={false}
          className='max-w-xs'
        />
      </div>
    );
  },
};
