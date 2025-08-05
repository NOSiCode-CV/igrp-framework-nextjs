'use client';

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPAlertDialog,
  type IGRPAlertDialogProps,
  IGRPIconObject,
  IGRPButton,
  IGRPColorObjectVariants,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPAlertDialog> = {
  title: 'Components/AlertDialog',
  component: IGRPAlertDialog,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'The visual style of the alert dialog',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show the icon',
      defaultValue: true,
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Custom icon to display (if showIcon is true)',
    },
    iconPlacement: {
      control: 'radio',
      options: ['start', 'center'],
      description: 'Position of the icon',
      defaultValue: 'start',
    },
    title: {
      control: 'text',
      description: 'The title of the alert dialog',
    },
    titleClassName: {
      control: 'text',
      description: 'Custom class name for the title',
    },
    description: {
      control: 'text',
      description: 'The description text of the alert dialog',
    },
    descriptionClassName: {
      control: 'text',
      description: 'Custom class name for the description',
    },
    actionLabel: {
      control: 'text',
      description: 'Text for the action button',
    },
    cancelLabel: {
      control: 'text',
      description: 'Text for the cancel button',
    },
    showCancel: {
      control: 'boolean',
      description: 'Whether to show the cancel button',
    },
    className: {
      control: 'text',
      description: 'Custom class name for the dialog content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPAlertDialog>;

const AlertDialogDemo = (args: IGRPAlertDialogProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IGRPButton onClick={() => setOpen(true)}>Open Alert Dialog</IGRPButton>
      <IGRPAlertDialog
        {...args}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};

export const Default: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'primary',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Are you absolutely sure?',
    description:
      'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
    actionLabel: 'Continue',
    cancelLabel: 'Cancel',
    showCancel: true,
  },
};

export const Primary: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'primary',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Confirm action',
    description: 'Are you sure you want to proceed with this action?',
    actionLabel: 'Confirm',
    cancelLabel: 'Cancel',
    showCancel: true,
  },
};

export const Success: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'success',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Operation successful',
    description: 'Your changes have been saved successfully.',
    actionLabel: 'Great!',
    showCancel: false,
  },
};

export const Error: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'destructive',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Error occurred',
    description: 'We could not complete your request. Please try again later.',
    actionLabel: 'Try Again',
    cancelLabel: 'Cancel',
  },
};

export const Warning: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'warning',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Warning',
    description: 'This action might have consequences. Are you sure you want to proceed?',
    actionLabel: 'Proceed',
    cancelLabel: 'Go Back',
  },
};

export const Info: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'info',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Information',
    description:
      'This feature is currently in beta. Some functionality might not work as expected.',
    actionLabel: 'Got it',
    showCancel: false,
  },
};

export const Indigo: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'indigo',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Premium Feature',
    description: 'This is a premium feature available to subscribers.',
    actionLabel: 'Upgrade',
    cancelLabel: 'Maybe Later',
  },
};

export const WithoutIcon: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'primary',
    showIcon: false,
    title: 'No Icon Example',
    description: 'This alert dialog does not display an icon.',
    actionLabel: 'Okay',
    cancelLabel: 'Cancel',
  },
};

export const CenteredIcon: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'success',
    showIcon: true,
    iconPlacement: 'center',
    title: 'Centered Icon Example',
    description: 'This alert dialog displays the icon centered at the top.',
    actionLabel: 'Okay',
    showCancel: false,
  },
};

export const CustomIcon: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'primary',
    showIcon: true,
    iconName: 'Bell',
    iconPlacement: 'start',
    title: 'Notification',
    description: 'You have new notifications waiting for you.',
    actionLabel: 'View',
    cancelLabel: 'Later',
  },
};

export const CustomIconCentered: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'info',
    showIcon: true,
    iconName: 'Bell',
    iconPlacement: 'center',
    title: 'Notification',
    description: 'You have new notifications waiting for you.',
    actionLabel: 'View',
    cancelLabel: 'Later',
  },
};

export const WithContent: Story = {
  render: (args) => (
    <AlertDialogDemo {...args}>
      <div className='border rounded-md p-4 bg-gray-50'>
        <p className='text-sm'>Additional content can be placed here:</p>
        <ul className='list-disc list-inside text-sm mt-2 space-y-1'>
          <li>Item one will be affected</li>
          <li>Item two will be removed</li>
          <li>Item three will be archived</li>
        </ul>
      </div>
    </AlertDialogDemo>
  ),
  args: {
    variant: 'warning',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Review changes',
    description: 'Please review the following changes before proceeding:',
    actionLabel: 'Confirm Changes',
    cancelLabel: 'Cancel',
  },
};

export const CustomStyles: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'primary',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Custom Styled Dialog',
    titleClassName: 'text-xl font-bold text-blue-700',
    description: 'This dialog has custom styling for the title and description.',
    descriptionClassName: 'italic text-gray-600',
    actionLabel: 'Confirm',
    cancelLabel: 'Cancel',
    className: 'border-2 border-blue-200',
  },
};

export const CustomButtons: Story = {
  render: AlertDialogDemo,
  args: {
    variant: 'indigo',
    showIcon: true,
    iconPlacement: 'start',
    title: 'Subscription required',
    description: 'This feature requires a premium subscription.',
    actionLabel: 'Upgrade Now',
    cancelLabel: 'Maybe Later',
    actionProps: {
      className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    cancelProps: {
      variant: 'ghost',
      className: 'text-gray-500',
    },
  },
};
