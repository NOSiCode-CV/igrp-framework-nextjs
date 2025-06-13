/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IGRPDropzone, type FileWithProgress } from './index';

const meta: Meta<typeof IGRPDropzone> = {
  title: 'Components/Dropzone',
  component: IGRPDropzone,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente de dropzone customizado para upload de arquivos.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof IGRPDropzone>;

const Template = (args: any) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);

  return (
    <IGRPDropzone
      {...args}
      files={files}
      onFilesChange={setFiles}
    />
  );
};

export const Default: Story = {
  render: (args) => <Template {...args} />,
  args: {
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 3,
    multiple: false,
    isUploading: true,
  },
};
