import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { IGRPSwitch, type IGRPSwitchProps } from '.';
import { Button } from '@/components/horizon/button';
import type { IGRPGridSize } from '@/types/globals';

const meta: Meta<typeof IGRPSwitch> = {
  title: 'Components/Switch',
  component: IGRPSwitch,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    name: { control: 'text' },
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    error: { control: 'text' },
    gridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'] satisfies IGRPGridSize[],
    },
    checked: {
      control: 'boolean',
    },
    onCheckedChange: { action: 'onCheckedChange' },
  },
  args: {
    label: 'Enable Notifications',
    helperText: 'Toggle to enable email alerts',
    required: false,
    gridSize: 'full',
  },
};
export default meta;

type Story = StoryObj<typeof IGRPSwitch>;

function StoryContainer({ children }: { children: React.ReactNode }) {
  return <div className='p-6 space-y-4 border rounded-lg px-12'>{children}</div>;
}

function StandaloneComponent(args: IGRPSwitchProps) {
  const [checked, setChecked] = useState(false);

  return (
    <StoryContainer>
      <IGRPSwitch
        {...args}
        checked={checked}
        onCheckedChange={setChecked}
      />
      <p className='text-sm'>
        Checked state: <strong>{checked ? 'true' : 'false'}</strong>
      </p>
    </StoryContainer>
  );
}

export const Standalone: Story = {
  name: 'Standalone (Controlled)',
  render: (args) => <StandaloneComponent {...args} />,
};

function InsideFormComponent(args: IGRPSwitchProps) {
  const form = useForm({
    defaultValues: {
      [args.name || 'notifications']: true,
    },
  });

  const onSubmit = (data: unknown) => {
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <StoryContainer>
          <IGRPSwitch {...args} />
          <Button type='submit'>Submit</Button>
        </StoryContainer>
      </form>
    </FormProvider>
  );
}

export const InsideForm: Story = {
  name: 'Inside React Hook Form',
  render: (args) => <InsideFormComponent {...args} />,
  args: {
    name: 'notifications',
    label: 'Receive Email Alerts',
    required: true,
    helperText: 'Allow us to send you updates.',
  },
};

function WithErrorComponent(args: IGRPSwitchProps) {
  return (
    <StoryContainer>
      <IGRPSwitch {...args} />
    </StoryContainer>
  );
}

export const WithError: Story = {
  name: 'With Error Message',
  render: (args) => <WithErrorComponent {...args} />,
  args: {
    name: 'terms',
    label: 'Accept Terms & Conditions',
    error: 'You must agree before proceeding.',
    checked: false,
    helperText: '',
  },
};
