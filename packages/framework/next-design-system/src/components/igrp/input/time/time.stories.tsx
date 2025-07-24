import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPInputTime, type IGRPInputTimeProps } from '.';

export default {
  title: 'Components/Input/Time',
  component: IGRPInputTime,
  argTypes: {
    label: { control: 'text' },
    floatingLabel: { control: 'boolean' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultValue: { control: 'text' },
    error: { control: 'text' },
  },
} as Meta;

const Template: StoryFn<IGRPInputTimeProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputTime {...args} />
  </div>
);

export const Default: StoryObj<IGRPInputTimeProps> = {
  render: Template,
  args: {
    label: 'Meeting Time',
    defaultValue: '14:30',
  },
};

export const WithHelperText: StoryObj<IGRPInputTimeProps> = {
  render: Template,
  args: {
    label: 'Appointment Time',
    helperText: 'Please select a time between 9:00 and 17:00',
    defaultValue: '10:00',
  },
};

export const Required: StoryObj<IGRPInputTimeProps> = {
  render: Template,
  args: {
    label: 'Required Meeting Time',
    required: true,
  },
};

export const WithError: StoryObj<IGRPInputTimeProps> = {
  render: Template,

  args: {
    label: 'Appointment Time',
    error: 'Please select a valid time',
  },
};

export const Disabled: StoryObj<IGRPInputTimeProps> = {
  render: Template,
  args: {
    label: 'Fixed Schedule',
    disabled: true,
    defaultValue: '08:00',
  },
};
