import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPFieldDescription, IGRPLabel, Input } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/FieldDescription',
  component: IGRPFieldDescription,
  argTypes: {
    helperText: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof IGRPFieldDescription>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Helper text shown below a field (rendered as a polite note). */
export const HelperText: Story = {
  args: {
    helperText: 'We will never share your email with anyone.',
  },
  render: (args) => (
    <div className='p-6 max-w-sm grid gap-1.5'>
      <IGRPLabel htmlFor='email'>Email</IGRPLabel>
      <Input id='email' type='email' placeholder='you@example.com' />
      <IGRPFieldDescription {...args} />
    </div>
  ),
};

/** Error state — rendered with role="alert" and destructive styling. */
export const Error: Story = {
  args: {
    error: 'Please enter a valid email address.',
  },
  render: (args) => (
    <div className='p-6 max-w-sm grid gap-1.5'>
      <IGRPLabel htmlFor='email-error'>Email</IGRPLabel>
      <Input id='email-error' type='email' defaultValue='not-an-email' aria-invalid />
      <IGRPFieldDescription {...args} />
    </div>
  ),
};

/** When both are supplied, the error takes precedence and the helper text is hidden. */
export const ErrorOverridesHelper: Story = {
  args: {
    helperText: 'Minimum 8 characters.',
    error: 'Password is too short.',
  },
  render: (args) => (
    <div className='p-6 max-w-sm grid gap-1.5'>
      <IGRPLabel htmlFor='password'>Password</IGRPLabel>
      <Input id='password' type='password' defaultValue='123' aria-invalid />
      <IGRPFieldDescription {...args} />
    </div>
  ),
};
