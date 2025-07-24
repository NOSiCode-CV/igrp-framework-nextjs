import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPTextarea, type IGRPTextareaProps } from '.';

export default {
  title: 'Components/Input/Textarea',
  component: IGRPTextarea,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    placeholder: { control: 'text' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: 'number' },
    error: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
  },
} as Meta;

const Template: StoryFn<IGRPTextareaProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPTextarea {...args} />
  </div>
);

export const Default: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'comments',
    label: 'Comments',
    placeholder: 'Enter your comments here',
    rows: 4,
  },
};

export const WithHelperText: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'feedback',
    label: 'Feedback',
    helperText: 'Please provide detailed feedback for our team',
    placeholder: 'Enter your feedback here',
    rows: 5,
  },
};

export const Required: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'required-feedback',
    label: 'Required Feedback',
    required: true,
    placeholder: 'This field is required',
    rows: 4,
  },
};

export const WithError: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'description',
    label: 'Description',
    error: 'The description is too short',
    placeholder: 'Enter a description',
    rows: 4,
  },
};

export const Disabled: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'disabled-textarea',
    label: 'Disabled Textarea',
    placeholder: 'This field is disabled',
    disabled: true,
    rows: 3,
  },
};

export const HalfWidth: StoryObj<IGRPTextareaProps> = {
  render: Template,
  args: {
    name: 'half-width',
    label: 'Half Width Textarea',
    placeholder: 'This textarea takes half of the available width',
    gridSize: '1/2',
    rows: 4,
  },
};
