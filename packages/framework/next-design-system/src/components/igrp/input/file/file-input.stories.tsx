import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { IGRPInputFile, type IGRPInputFileProps } from '.';

export default {
  title: 'Components/Input/FileInput',
  component: IGRPInputFile,
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    accept: { control: 'text' },
    multiple: { control: 'boolean' },
    placeholder: { control: 'text' },
    className: { control: 'text' },
    error: { control: 'text' },
    IGRPGridSize: {
      control: 'select',
      options: ['full', '1/2', '1/3', '2/3', '1/4', '3/4'],
    },
  },
} as Meta;

const Template: StoryFn<IGRPInputFileProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPInputFile {...args} />
  </div>
);

export const Default: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Upload Document',
    placeholder: 'Select a file to upload',
  },
};

export const WithHelperText: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Profile Picture',
    helperText: 'Upload a JPG or PNG image (max 2MB)',
    accept: '.jpg,.jpeg,.png',
  },
};

export const Required: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Required Document',
    helperText: 'You must upload a document to proceed',
    required: true,
    accept: '.pdf,.doc,.docx',
  },
};

export const WithError: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Document Upload',
    error: 'The file exceeds the maximum size limit',
    accept: '.pdf',
  },
};

export const Disabled: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Disabled File Input',
    helperText: 'This upload option is currently unavailable',
    disabled: true,
  },
};

export const MultipleFiles: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Upload Multiple Files',
    helperText: 'Select multiple files to upload at once',
    multiple: true,
    accept: '.jpg,.jpeg,.png,.pdf',
  },
};

export const PDFOnly: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'PDF Document Upload',
    helperText: 'Please upload a PDF document only',
    accept: '.pdf',
  },
};

export const HalfWidth: StoryObj<IGRPInputFileProps> = {
  render: Template,
  args: {
    label: 'Half Width File Input',
    helperText: 'This file input takes half of the available width',
    gridSize: '1/2',
    accept: '.pdf,.doc,.docx',
  },
};
