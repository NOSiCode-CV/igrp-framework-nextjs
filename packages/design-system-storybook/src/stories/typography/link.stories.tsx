import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPColorObjectVariants,
  IGRPLink,
  IGRPIconObject,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPLink> = {
  title: 'Components/Typography/Link',
  component: IGRPLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'The visual style of the link',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
      description: 'The size of the link text',
    },
    underline: {
      control: 'select',
      options: ['none', 'hover', 'always'],
      description: 'The underline style of the link',
    },
    href: {
      control: 'text',
      description: 'The URL the link points to',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Icon to display with the link',
    },

    iconPlacement: {
      control: 'radio',
      options: ['start', 'end'],
      description: 'Position of the icon relative to the text',
    },
    iconSize: {
      control: 'number',
      description: 'Custom size for the icon (in pixels)',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show the icon',
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPLink>;

export const Default: Story = {
  args: {
    href: '/example',
    children: 'Internal Link',
    variant: 'solid',
    color: 'primary',
    size: 'default',
    underline: 'hover',
  },
};

export const External: Story = {
  args: {
    href: 'https://example.com',
    children: 'External Link',
    variant: 'solid',
    color: 'primary',
    size: 'default',
    underline: 'hover',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-col gap-6'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Icon Visibility</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/example'
            iconName='ArrowRight'
            showIcon={true}
          >
            With Icon (showIcon=true)
          </IGRPLink>
          <IGRPLink
            href='/example'
            iconName='ArrowRight'
            showIcon={false}
          >
            Without Icon (showIcon=false)
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Icon Positions</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/example'
            iconName='ArrowRight'
            iconPlacement='start'
            showIcon
          >
            Icon at Start
          </IGRPLink>
          <IGRPLink
            href='/example'
            iconName='ArrowRight'
            iconPlacement='end'
            showIcon
          >
            Icon at End
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Icon Types</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/example'
            iconName='House'
            showIcon
          >
            House
          </IGRPLink>
          <IGRPLink
            href='https://example.com'
            iconName='ExternalLink'
            showIcon
          >
            External
          </IGRPLink>
          <IGRPLink
            href='mailto:info@example.com'
            iconName='Mail'
            showIcon
          >
            Email
          </IGRPLink>
          <IGRPLink
            href='tel:+1234567890'
            iconName='Phone'
            showIcon
          >
            Call
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Icon Sizes</h3>
        <div className='flex gap-4 items-baseline'>
          <IGRPLink
            href='/example'
            iconName='FileText'
            size='sm'
            showIcon
          >
            Small
          </IGRPLink>
          <IGRPLink
            href='/example'
            iconName='FileText'
            size='default'
            showIcon
          >
            Default
          </IGRPLink>
          <IGRPLink
            href='/example'
            iconName='FileText'
            size='lg'
            showIcon
          >
            Large
          </IGRPLink>
          <IGRPLink
            href='/example'
            iconName='FileText'
            iconSize={24}
            showIcon
          >
            Custom Size
          </IGRPLink>
        </div>
      </div>
    </div>
  ),
};

export const LinkVariants: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Variant Styles</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/example'
            color='primary'
            variant='solid'
          >
            Default Link
          </IGRPLink>
          <IGRPLink
            href='/example'
            color='info'
            variant='solid'
          >
            Muted Link
          </IGRPLink>
          <IGRPLink
            href='/example'
            color='destructive'
            variant='solid'
          >
            Destructive Link
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Size Options</h3>
        <div className='flex gap-4 items-baseline'>
          <IGRPLink
            href='/example'
            size='sm'
          >
            Small Link
          </IGRPLink>
          <IGRPLink
            href='/example'
            size='default'
          >
            Default Size
          </IGRPLink>
          <IGRPLink
            href='/example'
            size='lg'
          >
            Large Link
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Underline Styles</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/example'
            underline='none'
          >
            No Underline
          </IGRPLink>
          <IGRPLink
            href='/example'
            underline='hover'
          >
            Hover Underline
          </IGRPLink>
          <IGRPLink
            href='/example'
            underline='always'
          >
            Always Underline (disappears on hover)
          </IGRPLink>
        </div>
      </div>
    </div>
  ),
};

export const ExternalLinks: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div>
        <h3 className='text-lg font-medium mb-2'>External Link Types</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='https://example.com'
            iconName='ExternalLink'
            iconPlacement='end'
            showIcon
          >
            Website Link
          </IGRPLink>
          <IGRPLink
            href='mailto:info@example.com'
            iconName='Mail'
            iconPlacement='start'
            showIcon
          >
            Email Link
          </IGRPLink>
          <IGRPLink
            href='tel:+1234567890'
            iconName='Phone'
            iconPlacement='start'
            showIcon
          >
            Phone Link
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Custom External Props</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='https://example.com'
            target='_self'
          >
            Open in Same Tab
          </IGRPLink>
          <IGRPLink
            href='https://example.com'
            rel='nofollow'
          >
            No Follow Link
          </IGRPLink>
          <IGRPLink
            href='/internal'
            iconName='ExternalLink'
            iconPlacement='end'
          >
            Force External
          </IGRPLink>
        </div>
      </div>
    </div>
  ),
};

export const ActiveStates: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <div>
        <h3 className='text-lg font-medium mb-2'>Active State Examples</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/dashboard'
            iconName='LayoutDashboard'
            showIcon
          >
            Dashboard
          </IGRPLink>
          <IGRPLink
            href='/settings'
            iconName='Settings'
            showIcon
          >
            Settings
          </IGRPLink>
          <IGRPLink
            href='/profile'
            iconName='User'
            showIcon
          >
            Profile
          </IGRPLink>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-medium mb-2'>Exact Match vs Partial Match</h3>
        <div className='flex gap-4'>
          <IGRPLink
            href='/products'
            iconName='ShoppingCart'
            showIcon
          >
            Products (Partial Match)
          </IGRPLink>
          <IGRPLink
            href='/products'
            iconName='ShoppingCart'
            showIcon
          >
            Products (Exact Match)
          </IGRPLink>
        </div>
      </div>
    </div>
  ),
};

export const DownloadLinks: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <h3 className='text-lg font-medium mb-2'>Download Links</h3>
      <div className='flex gap-4'>
        <IGRPLink
          href='/files/document.pdf'
          iconName='Download'
          iconPlacement='end'
          underline='always'
          showIcon
        >
          Download PDF
        </IGRPLink>
        <IGRPLink
          href='/files/presentation.pptx'
          iconName='Download'
          iconPlacement='end'
          color='secondary'
          variant='solid'
          underline='always'
          showIcon
        >
          Download Presentation
        </IGRPLink>
        <IGRPLink
          href='/files/data.xlsx'
          iconName='Download'
          iconPlacement='end'
          color='destructive'
          variant='solid'
          underline='always'
          showIcon
        >
          Download Spreadsheet
        </IGRPLink>
      </div>
    </div>
  ),
};

export const ScrollBehavior: Story = {
  render: () => (
    <div className='flex flex-col gap-4'>
      <h3 className='text-lg font-medium mb-2'>Scroll Behavior</h3>
      <p className='text-muted-foreground mb-4'>
        The <code>scroll</code> prop controls whether the page should scroll to the top when
        navigating to a new route.
      </p>
      <div className='flex gap-4'>
        <IGRPLink
          href='/example'          
          iconName='ArrowUp'
          showIcon
        >
          With Scroll (default)
        </IGRPLink>
        <IGRPLink
          href='/example'
          iconName='ArrowRight'
          showIcon
        >
          Without Scroll
        </IGRPLink>
      </div>
    </div>
  ),
};
