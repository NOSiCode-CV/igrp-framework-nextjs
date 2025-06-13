import type { Meta, StoryObj } from '@storybook/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';
import { IGRPIcon, IGRPIconObject } from '@/components/igrp/icon';
import {
  IGRPBreadcrumb,
  IGRPBreadcrumbItem,
  IGRPBreadcrumbLink,
  IGRPBreadcrumbList,
  IGRPBreadcrumbPage,
  IGRPBreadcrumbSeparator,
} from '.';

const meta: Meta<typeof IGRPBreadcrumb> = {
  title: 'Components/Breadcrumb',
  component: IGRPBreadcrumb,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'card'],
      description: 'The visual style of the IGRPBreadcrumb',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the IGRPBreadcrumb',
    },
    homeIcon: {
      control: 'boolean',
      description: 'Whether to show a home icon at the beginning',
    },
    homeHref: {
      control: 'text',
      description: 'The href for the home icon link',
    },
    homeLabel: {
      control: 'text',
      description: 'The aria-label for the home icon link',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon for the home link',
    },
    collapsed: {
      control: 'boolean',
      description: 'Whether to collapse the IGRPBreadcrumb when there are many items',
    },
    maxItems: {
      control: 'number',
      description: 'Maximum number of items to show when collapsed',
    },
    separator: {
      control: 'select',
      options: ['arrow', 'chevron', 'slash'],
      description: 'The separator between IGRPBreadcrumb items',
      mapping: {
        arrow: <IGRPIcon iconName='ArrowRight' />,
        chevron: <IGRPIcon iconName='ChevronRight' />,
        slash: <IGRPIcon iconName='Slash' />,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPBreadcrumb>;

// Base story with controls
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    homeIcon: false,
    homeHref: '/',
    homeLabel: 'House',
    collapsed: false,
    maxItems: 5,
    separator: 'chevron',
    children: (
      <IGRPBreadcrumbList>
        <IGRPBreadcrumbItem>
          <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
        </IGRPBreadcrumbItem>
        <IGRPBreadcrumbSeparator />
        <IGRPBreadcrumbItem>
          <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
        </IGRPBreadcrumbItem>
        <IGRPBreadcrumbSeparator />
        <IGRPBreadcrumbItem>
          <IGRPBreadcrumbPage color='primary'>Category</IGRPBreadcrumbPage>
        </IGRPBreadcrumbItem>
      </IGRPBreadcrumbList>
    ),
  },
};

export const Sizes: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Small Size</h3>
        <IGRPBreadcrumb size='sm'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Small Size</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Medium Size (Default)</h3>
        <IGRPBreadcrumb size='md'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Medium Size</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Large Size</h3>
        <IGRPBreadcrumb size='lg'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Large Size</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Default Variant</h3>
        <IGRPBreadcrumb variant='default'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Default Variant</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Outline Variant</h3>
        <IGRPBreadcrumb variant='outline'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Outline Variant</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Card Variant</h3>
        <IGRPBreadcrumb variant='card'>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='primary'>Card Variant</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>
    </div>
  ),
};

// Separator options
export const Separators: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Arrow Separator (Default)</h3>
        <IGRPBreadcrumb
          separator={
            <IGRPIcon
              iconName='ArrowRight'
              className='h-4 w-4'
            />
          }
        >
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage>Category</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Chevron Separator</h3>
        <IGRPBreadcrumb
          separator={
            <IGRPIcon
              iconName='ChevronRight'
              className='h-4 w-4'
            />
          }
        >
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage>Category</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Slash Separator</h3>
        <IGRPBreadcrumb
          separator={
            <IGRPIcon
              iconName='Slash'
              className='h-4 w-4'
            />
          }
        >
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage>Category</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Icons on Items</h3>
        <IGRPBreadcrumb>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='#'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='Package'
            >
              <IGRPBreadcrumbPage>Electronics</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Icons on Links</h3>
        <IGRPBreadcrumb>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink
                href='#'
                showIcon
                iconName='LayoutDashboard'
              >
                Dashboard
              </IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink
                href='#'
                showIcon
                iconName='Settings'
              >
                Settings
              </IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage
                showIcon
                iconName='User'
              >
                Profile
              </IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Home Icon</h3>
        <IGRPBreadcrumb
          homeIcon
          homeHref='/'
          homeLabel='House'
        >
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage>Category</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>
    </div>
  ),
};

export const BasicCollapsed: Story = {
  args: {
    collapsed: true,
    maxItems: 3,
    items: [
      { label: 'Home', href: '/', iconName: 'House', showIcon: true },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Computers', href: '/products/electronics/computers' },
      { label: 'Laptops', href: '/products/electronics/computers/laptops' },
      { label: 'MacBook Pro', current: true, color: 'primary' },
    ],
  },
};

export const WithEllipsis: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Manual Ellipsis with Dropdown</h3>
        <IGRPBreadcrumb>
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='House'
            >
              <IGRPBreadcrumbLink href='/'>Home</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className='flex items-center gap-1'>
                  <IGRPBreadcrumbList />
                  <span className='sr-only'>Toggle menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start'>
                  <DropdownMenuItem>Documentation</DropdownMenuItem>
                  <DropdownMenuItem>Themes</DropdownMenuItem>
                  <DropdownMenuItem>GitHub</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='FileText'
            >
              <IGRPBreadcrumbLink href='/docs/components'>Components</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage>IGRPBreadcrumb</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Automatic Ellipsis with Items Prop</h3>
        <IGRPBreadcrumb
          collapsed
          maxItems={3}
          items={[
            { label: 'House', href: '/', iconName: 'House', showIcon: true },
            { label: 'Documentation', href: '/docs' },
            { label: 'Components', href: '/docs/components' },
            { label: 'Navigation', href: '/docs/components/navigation' },
            { label: 'IGRPBreadcrumb', current: true, color: 'primary' },
          ]}
        />
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Long Path with Ellipsis</h3>
        <IGRPBreadcrumb
          collapsed
          maxItems={3}
          items={[
            { label: 'House', href: '/', iconName: 'House', showIcon: true },
            { label: 'Products', href: '/products', iconName: 'ShoppingCart', showIcon: true },
            { label: 'Electronics', href: '/products/electronics' },
            { label: 'Computers', href: '/products/electronics/computers' },
            { label: 'Laptops', href: '/products/electronics/computers/laptops' },
            { label: 'MacBook Pro', current: true, color: 'secondary' },
          ]}
        />
      </div>
    </div>
  ),
};

export const AllFeaturesCombined: Story = {
  render: () => (
    <div className='flex flex-col gap-8'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Complete Example</h3>
        <IGRPBreadcrumb
          variant='card'
          size='md'
          collapsed
          maxItems={3}
          items={[
            { label: 'House', href: '/', iconName: 'House', showIcon: true },
            { label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard', showIcon: true },
            { label: 'Projects', href: '/dashboard/projects', iconName: 'Folder', showIcon: true },
            { label: 'Web Development', href: '/dashboard/projects/web' },
            { label: 'Client Portal', href: '/dashboard/projects/web/client-portal' },
            {
              label: 'Settings',
              current: true,
              iconName: 'Settings',
              showIcon: true,
              color: 'primary',
            },
          ]}
        />
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Small Size with Icons and Custom Color</h3>
        <IGRPBreadcrumb
          size='sm'
          variant='outline'
          separator={
            <IGRPIcon
              iconName='ChevronRight'
              className='h-3 w-3'
            />
          }
          items={[
            { label: 'House', href: '/', iconName: 'House', showIcon: true },
            { label: 'Account', href: '/account', iconName: 'User', showIcon: true },
            {
              label: 'Security',
              current: true,
              iconName: 'ShieldCheck',
              showIcon: true,
              color: 'destructive',
            },
          ]}
        />
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Large Size with Home Icon</h3>
        <IGRPBreadcrumb
          size='lg'
          homeIcon
          homeHref='/'
          homeLabel='House'
          iconName='House'
        >
          <IGRPBreadcrumbList>
            <IGRPBreadcrumbItem
              showIcon
              iconName='ShoppingCart'
            >
              <IGRPBreadcrumbLink href='#'>Products</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem
              showIcon
              iconName='Package'
            >
              <IGRPBreadcrumbLink href='#'>Electronics</IGRPBreadcrumbLink>
            </IGRPBreadcrumbItem>
            <IGRPBreadcrumbSeparator />
            <IGRPBreadcrumbItem>
              <IGRPBreadcrumbPage color='success'>Smartphones</IGRPBreadcrumbPage>
            </IGRPBreadcrumbItem>
          </IGRPBreadcrumbList>
        </IGRPBreadcrumb>
      </div>
    </div>
  ),
};
