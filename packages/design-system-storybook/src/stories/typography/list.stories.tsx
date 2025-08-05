import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { action } from 'storybook/actions';
import {
  IGRPTextList,
  igrpListItems,
  igrpCreateListItem,
  IGRPColorObjectVariants,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPTextList> = {
  title: 'Components/Typography/List',
  component: IGRPTextList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible and customizable text list component that supports various list types, styling options, animations, and interactive features.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['unordered', 'ordered', 'checklist', 'steps', 'features', 'custom'],
      description: 'The type of list to render',
    },
    variant: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'Color variant for the list',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl'],
      description: 'Size of the list text',
    },
    spacing: {
      control: 'select',
      options: ['tight', 'normal', 'loose'],
      description: 'Spacing between list items',
    },
    animate: {
      control: 'boolean',
      description: 'Enable staggered animation for list items',
    },
    interactive: {
      control: 'boolean',
      description: 'Make list items interactive with hover effects',
    },
    collapsible: {
      control: 'boolean',
      description: 'Allow collapsing/expanding items with sub-items',
    },
    maxDepth: {
      control: 'number',
      min: 1,
      max: 5,
      description: 'Maximum nesting depth for sub-items',
    },
    onItemClick: {
      action: 'item-clicked',
      description: 'Callback fired when a list item is clicked',
    },
  },
  args: {
    onItemClick: action('item-clicked'),
  },
};

export default meta;
type Story = StoryObj<typeof IGRPTextList>;

// Basic Stories
export const Default: Story = {
  args: {
    items: [
      igrpCreateListItem('First item in the list'),
      igrpCreateListItem('Second item with more content'),
      igrpCreateListItem('Third item to complete the set'),
      igrpCreateListItem('Fourth item for good measure'),
    ],
    type: 'unordered',
  },
};

export const OrderedList: Story = {
  args: {
    items: [
      igrpCreateListItem('Step one: Initialize the project'),
      igrpCreateListItem('Step two: Configure the settings'),
      igrpCreateListItem('Step three: Install dependencies'),
      igrpCreateListItem('Step four: Start development'),
    ],
    type: 'ordered',
  },
};

export const Checklist: Story = {
  args: {
    items: [
      igrpCreateListItem('Set up development environment', { completed: true }),
      igrpCreateListItem('Install required dependencies', { completed: true }),
      igrpCreateListItem('Write component logic', { completed: false }),
      igrpCreateListItem('Add styling and animations', { completed: false }),
      igrpCreateListItem('Write tests and documentation', { completed: false }),
    ],
    type: 'checklist',
    interactive: false,
  },
};

export const StepsList: Story = {
  args: {
    items: [
      igrpCreateListItem('Choose your project template', { badgeText: 'Required' }),
      igrpCreateListItem('Configure your settings'),
      igrpCreateListItem('Install dependencies'),
      igrpCreateListItem('Start building your application'),
      igrpCreateListItem('Deploy to production', { badgeText: 'Final' }),
    ],
    type: 'steps',
    spacing: 'loose',
    iconGlobalColor: 'success',
  },
};

export const FeaturesList: Story = {
  args: {
    items: [
      igrpCreateListItem('Lightning fast performance', { badgeText: 'New', variant: 'success' }),
      igrpCreateListItem('Flexible customization options', { variant: 'info' }),
      igrpListItems.withIcon('Built-in accessibility', 'Shield'),
      igrpListItems.withIcon('TypeScript support', 'Code'),
    ],
    type: 'features',
  },
};

// Variant Stories
export const VariantShowcase: Story = {
  args: {
    items: [
      igrpCreateListItem('Success: Operation completed successfully', { variant: 'success' }),
      igrpCreateListItem('Error: Something went wrong', { variant: 'destructive' }),
      igrpCreateListItem('Warning: Please review your settings', { variant: 'warning' }),
      igrpCreateListItem('Info: New feature available', { variant: 'info' }),
      igrpCreateListItem('Default: Regular list item'),
      igrpCreateListItem('Muted: Less prominent item', { variant: 'secondary' }),
    ],
    interactive: true,
  },
};

// Size Stories
export const SizeVariations: Story = {
  render: () => (
    <div className='space-y-8'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Small Size</h3>
        <IGRPTextList
          items={[igrpCreateListItem('Small text item'), igrpCreateListItem('Another small item')]}
          size='sm'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Default Size</h3>
        <IGRPTextList
          items={[
            igrpCreateListItem('Default text item'),
            igrpCreateListItem('Another default item'),
          ]}
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Large Size</h3>
        <IGRPTextList
          items={[igrpCreateListItem('Large text item'), igrpCreateListItem('Another large item')]}
          size='lg'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Extra Large Size</h3>
        <IGRPTextList
          items={[
            igrpCreateListItem('Extra large text item'),
            igrpCreateListItem('Another extra large item'),
          ]}
          size='xl'
        />
      </div>
    </div>
  ),
};

// Interactive Stories
export const InteractiveList: Story = {
  args: {
    items: [
      igrpCreateListItem('Click me to see interaction'),
      igrpCreateListItem('Hover over me for effects'),
      igrpCreateListItem('I am disabled', { disabled: true }),
      igrpCreateListItem('I am completed', { completed: true }),
    ],
    interactive: true,
    animate: true,
  },
};

export const AnimatedList: Story = {
  args: {
    items: [
      igrpCreateListItem('First item appears'),
      igrpCreateListItem('Second item follows'),
      igrpCreateListItem('Third item comes next'),
      igrpCreateListItem('Fourth item completes the animation'),
      igrpCreateListItem('Fifth item finishes the sequence'),
    ],
    animate: true,
    spacing: 'loose',
  },
};

// Nested Lists
export const NestedList: Story = {
  args: {
    items: [
      igrpCreateListItem('Frontend Development', {
        id: 'frontend',
        subItems: [
          igrpListItems.withIcon('React Components', 'Code'),
          igrpListItems.withIcon('Styling & CSS', 'Zap'),
          igrpCreateListItem('State Management'),
        ],
      }),
      igrpCreateListItem('Backend Development', {
        id: 'backend',
        badgeText: 'API',
        subItems: [
          igrpListItems.withIcon('Database Design', 'Database'),
          igrpListItems.withIcon('Server Configuration', 'Settings'),
          igrpListItems.withIcon('API Endpoints', 'Globe'),
        ],
      }),
      igrpCreateListItem('DevOps & Deployment', {
        id: 'devops',
        subItems: [
          igrpCreateListItem('CI/CD Pipeline', { variant: 'success' }),
          igrpCreateListItem('Security Audit', { variant: 'warning' }),
          igrpCreateListItem('Performance Issues', { variant: 'destructive' }),
        ],
      }),
    ],
    collapsible: true,
    interactive: true,
    spacing: 'loose',
  },
};

export const CollapsibleList: Story = {
  args: {
    items: [
      igrpCreateListItem('Project Planning', {
        id: 'planning',
        badgeText: 'Phase 1',
        subItems: [
          igrpCreateListItem('Requirements gathering'),
          igrpCreateListItem('Technical specifications'),
          igrpCreateListItem('Timeline estimation'),
        ],
      }),
      igrpCreateListItem('Development', {
        id: 'development',
        badgeText: 'Phase 2',
        subItems: [
          igrpCreateListItem('Setup development environment', { completed: true }),
          igrpCreateListItem('Create project structure', { completed: true }),
          igrpCreateListItem('Implement core features', { completed: false }),
          igrpCreateListItem('Add tests', { completed: false }),
        ],
      }),
      igrpCreateListItem('Testing & Deployment', {
        id: 'testing',
        badgeText: 'Phase 3',
        subItems: [
          igrpCreateListItem('Unit testing'),
          igrpCreateListItem('Integration testing'),
          igrpCreateListItem('Production deployment'),
        ],
      }),
    ],
    type: 'steps',
    collapsible: true,
    interactive: true,
    maxDepth: 2,
  },
};

// Custom Icons
export const CustomIconsList: Story = {
  args: {
    items: [
      igrpListItems.withIcon('Community Driven', 'Users', 'info'),
      igrpListItems.withIcon('Open Source', 'Heart', 'destructive'),
      igrpListItems.withIcon('High Performance', 'Zap', 'warning'),
      igrpListItems.withIcon('Production Ready', 'Rocket', 'success'),
      igrpListItems.withIcon('Secure by Default', 'Shield', 'indigo'),
    ],
    size: 'lg',
    spacing: 'loose',
    interactive: true,
  },
};

// Complex Example
export const ComplexExample: Story = {
  args: {
    items: [
      igrpCreateListItem('User Authentication', {
        id: 'auth',
        variant: 'info',
        badgeText: 'Critical',
        subItems: [
          igrpCreateListItem('Login functionality', { completed: true }),
          igrpCreateListItem('Registration system', { completed: true }),
          igrpCreateListItem('Password reset', { badgeText: 'In Progress', variant: 'warning' }),
          igrpCreateListItem('Two-factor authentication', { badgeText: 'Planned' }),
        ],
      }),
      igrpCreateListItem('Data Management', {
        id: 'data',
        variant: 'success',
        badgeText: 'Complete',
        subItems: [
          igrpCreateListItem('Database schema', { variant: 'success' }),
          igrpCreateListItem('CRUD operations', { variant: 'success' }),
          igrpCreateListItem('Data validation', { variant: 'success' }),
          igrpCreateListItem('Backup system', { badgeText: 'Automated', variant: 'info' }),
        ],
      }),
      igrpCreateListItem('User Interface', {
        id: 'ui',
        variant: 'warning',
        badgeText: 'In Review',
        subItems: [
          igrpCreateListItem('Component library', { completed: true }),
          igrpCreateListItem('Responsive design', { completed: true }),
          igrpCreateListItem('Accessibility audit', {
            badgeText: 'Failed',
            variant: 'destructive',
          }),
          igrpCreateListItem('Dark mode support', { badgeText: 'New' }),
        ],
      }),
      igrpCreateListItem('Performance Optimization', {
        id: 'performance',
        disabled: true,
        badgeText: 'Blocked',
        subItems: [
          igrpCreateListItem('Code splitting'),
          igrpCreateListItem('Image optimization'),
          igrpCreateListItem('Caching strategy'),
        ],
      }),
    ],
    collapsible: true,
    interactive: true,
    animate: true,
    spacing: 'loose',
    size: 'default',
  },
};

// Spacing Variations
export const SpacingVariations: Story = {
  render: () => (
    <div className='space-y-8'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Tight Spacing</h3>
        <IGRPTextList
          items={[
            igrpCreateListItem('Tight spacing item 1'),
            igrpCreateListItem('Tight spacing item 2'),
            igrpCreateListItem('Tight spacing item 3'),
          ]}
          spacing='tight'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Normal Spacing</h3>
        <IGRPTextList
          items={[
            igrpCreateListItem('Normal spacing item 1'),
            igrpCreateListItem('Normal spacing item 2'),
            igrpCreateListItem('Normal spacing item 3'),
          ]}
          spacing='normal'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Loose Spacing</h3>
        <IGRPTextList
          items={[
            igrpCreateListItem('Loose spacing item 1'),
            igrpCreateListItem('Loose spacing item 2'),
            igrpCreateListItem('Loose spacing item 3'),
          ]}
          spacing='loose'
        />
      </div>
    </div>
  ),
};

// Playground Story
export const Playground: Story = {
  args: {
    items: [
      igrpCreateListItem('Customizable list item', { badgeText: 'Demo' }),
      igrpCreateListItem('Success variant item', { variant: 'success' }),
      igrpCreateListItem('Warning variant item', { variant: 'warning' }),
      igrpCreateListItem('Interactive item with sub-items', {
        id: 'interactive',
        subItems: [
          igrpCreateListItem('Sub-item 1'),
          igrpCreateListItem('Sub-item 2'),
          igrpCreateListItem('Info sub-item', { variant: 'info' }),
        ],
      }),
      igrpListItems.withIcon('Custom icon item', 'Rocket'),
      igrpCreateListItem('Disabled item', { disabled: true }),
    ],
    type: 'unordered',
    variant: 'primary',
    size: 'default',
    spacing: 'normal',
    animate: false,
    interactive: false,
    collapsible: false,
    maxDepth: 3,
  },
};
