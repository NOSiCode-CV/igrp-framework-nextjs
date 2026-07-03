import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
  IGRPButton,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Card',
  component: IGRPCard,
  argTypes: {
    className: { control: 'text' },
  },
} satisfies Meta<typeof IGRPCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full composition: header, title, description, action, content and footer. */
export const Default: Story = {
  render: (args) => (
    <div className='p-6 max-w-sm'>
      <IGRPCard {...args}>
        <IGRPCardHeader>
          <IGRPCardTitle>Project Atlas</IGRPCardTitle>
          <IGRPCardDescription>Updated 3 hours ago</IGRPCardDescription>
          <IGRPCardAction>
            <IGRPButton variant='ghost' size='icon' iconName='EllipsisVertical' aria-label='More options' />
          </IGRPCardAction>
        </IGRPCardHeader>
        <IGRPCardContent>
          <p className='text-sm text-muted-foreground'>
            A card groups related content and actions. Compose it from the header, content and footer sub-components.
          </p>
        </IGRPCardContent>
        <IGRPCardFooter className='gap-2'>
          <IGRPButton variant='outline'>Cancel</IGRPButton>
          <IGRPButton>Save</IGRPButton>
        </IGRPCardFooter>
      </IGRPCard>
    </div>
  ),
};

/** Minimal card — just a title and body content. */
export const Simple: Story = {
  render: (args) => (
    <div className='p-6 max-w-sm'>
      <IGRPCard {...args}>
        <IGRPCardHeader>
          <IGRPCardTitle>Notifications</IGRPCardTitle>
        </IGRPCardHeader>
        <IGRPCardContent>
          <p className='text-sm text-muted-foreground'>You have 3 unread messages.</p>
        </IGRPCardContent>
      </IGRPCard>
    </div>
  ),
};

/** Card used as a stat tile with an action in the header. */
export const WithAction: Story = {
  render: (args) => (
    <div className='p-6 max-w-sm'>
      <IGRPCard {...args}>
        <IGRPCardHeader>
          <IGRPCardDescription>Total revenue</IGRPCardDescription>
          <IGRPCardTitle className='text-3xl'>€ 45,231</IGRPCardTitle>
          <IGRPCardAction>
            <IGRPButton variant='outline' size='sm'>
              View
            </IGRPButton>
          </IGRPCardAction>
        </IGRPCardHeader>
        <IGRPCardContent>
          <p className='text-sm text-muted-foreground'>+20.1% from last month</p>
        </IGRPCardContent>
      </IGRPCard>
    </div>
  ),
};
