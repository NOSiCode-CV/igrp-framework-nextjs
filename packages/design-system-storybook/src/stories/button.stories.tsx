import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  IGRPButton,
  type IGRPButtonProps,
  IGRPIconObject,
} from '@igrp/igrp-framework-react-design-system';

import { fn } from 'storybook/test';

import { expect, userEvent, within } from 'storybook/test';



const meta = {
  title: 'Components/Button',
  component: IGRPButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    showIcon: {
      control: 'boolean',
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
    },
    iconPlacement: {
      control: 'select',
      options: ['start', 'end'],
    },
    iconSize: { control: 'number' },
    iconSpacing: { control: 'number' },
    loading: { control: 'boolean' },
    loadingText: { control: 'text' },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
  },

  args: { onClick: fn() },
  //  args: {
  //   onLogin: fn(),
  //   onLogout: fn(),
  //   onCreateAccount: fn(),
  // },
} satisfies Meta<typeof IGRPButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on component testing: https://storybook.js.org/docs/writing-tests/interaction-testing
export const LoggedIn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByRole('button', { name: /Log in/i });
    await expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    await expect(loginButton).not.toBeInTheDocument();

    const logoutButton = canvas.getByRole('button', { name: /Log out/i });
    await expect(logoutButton).toBeInTheDocument();
  },
};


const Template: StoryFn<IGRPButtonProps> = (args) => (
  <div className='p-4 flex flex-wrap gap-2'>
    <IGRPButton {...args} />
  </div>
);

export const LoadingButtonDemo: StoryFn<IGRPButtonProps> = (args) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className='p-4'>
      <IGRPButton
        {...args}
        loading={isLoading}
        onClick={handleClick}
      >
        {args.children}
      </IGRPButton>
    </div>
  );
};

export const AllVariants: StoryFn<IGRPButtonProps> = (args) => (
  <div className='p-4 flex flex-wrap gap-2'>
    <IGRPButton
      {...args}
      variant='default'
    >
      Default
    </IGRPButton>
    <IGRPButton
      {...args}
      variant='destructive'
    >
      Destructive
    </IGRPButton>
    <IGRPButton
      {...args}
      variant='outline'
    >
      Outline
    </IGRPButton>
    <IGRPButton
      {...args}
      variant='secondary'
    >
      Secondary
    </IGRPButton>
    <IGRPButton
      {...args}
      variant='ghost'
    >
      Ghost
    </IGRPButton>
    <IGRPButton
      {...args}
      variant='link'
    >
      Link
    </IGRPButton>
  </div>
);

export const AllSizes: StoryFn<IGRPButtonProps> = (args) => (
  <div className='p-4 flex flex-wrap items-center gap-2'>
    <IGRPButton
      {...args}
      size='sm'
    >
      Small
    </IGRPButton>
    <IGRPButton {...args}>Default</IGRPButton>
    <IGRPButton
      {...args}
      size='lg'
    >
      Large
    </IGRPButton>
    <IGRPButton
      {...args}
      size='icon'
      aria-label='Icon Button'
    >
      <span className='sr-only'>Icon</span>
    </IGRPButton>
  </div>
);

export const Default: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Default Button',
  },
};

export const WithIcon: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Button with Icon',
    showIcon: true,
    iconName: 'ArrowRight',
    iconPlacement: 'start',
  },
};

export const IconAtEnd: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Icon at End',
    showIcon: true,
    iconName: 'ArrowRight',
    iconPlacement: 'end',
  },
};

export const IconButton: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    size: 'icon',
    iconName: 'Plus',
    'aria-label': 'Add item',
  },
};

export const Loading: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Loading State',
    loading: true,
  },
};

export const LoadingWithText: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Submit',
    loading: true,
    loadingText: 'Processing...',
  },
};

export const LoadingIconButton: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    size: 'icon',
    iconName: 'Check',
    loading: true,
    'aria-label': 'Loading',
  },
};

export const DisabledButton: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const LoadingDemo: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {
    children: 'Click to Load',
    loadingText: 'Loading...',
    showIcon: true,
    iconName: 'RefreshCw',
  },
};

export const Variants: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {},
};

export const Sizes: StoryObj<IGRPButtonProps> = {
  render: Template,
  args: {},
};
