'use client';

import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from 'lucide-react';
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { forwardRef } from 'react';

interface FileUploadFieldProps {
  value?: FileWithPreview[];
  onChange?: (files: FileWithPreview[]) => void;
  maxSizeMB?: number;
  accept?: string;
  multiple?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const FileUploadField = forwardRef<HTMLInputElement, FileUploadFieldProps>(
  (
    {
      value = [],
      onChange,
      maxSizeMB = 2,
      accept = 'image/svg+xml,image/png,image/jpeg,image/jpg,image/gif',
      multiple = false,
      label,
      description,
      placeholder = 'Drop your image here',
      disabled = false,
    },
    ref,
  ) => {
    const maxSize = maxSizeMB * 1024 * 1024;

    const [
      { files, isDragging, errors },
      {
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop,
        openFileDialog,
        removeFile,
        getInputProps,
      },
    ] = useFileUpload({
      accept,
      maxSize,
      multiple,
      initialFiles: value.map((f) => ({
        name: f.file.name,
        size: f.file.size,
        type: f.file.type,
        url: f.preview || '',
        id: f.id,
      })),
      onFilesChange: onChange,
    });

    const previewUrl = files[0]?.preview || null;
    const fileName = files[0]?.file.name || null;

    return (
      <FormItem>
        {label && <FormLabel>{label}</FormLabel>}
        <FormControl>
          <div className='flex flex-col gap-2'>
            <div className='relative'>
              {/* Drop area */}
              <div
                onDragEnter={disabled ? undefined : handleDragEnter}
                onDragLeave={disabled ? undefined : handleDragLeave}
                onDragOver={disabled ? undefined : handleDragOver}
                onDrop={disabled ? undefined : handleDrop}
                data-dragging={isDragging || undefined}
                data-disabled={disabled || undefined}
                className='border-input data-[dragging=true]:bg-accent/50 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]'
              >
                <input
                  {...getInputProps()}
                  ref={ref}
                  disabled={disabled}
                  className='sr-only'
                  aria-label='Upload file'
                />
                {previewUrl ? (
                  <div className='absolute inset-0 flex items-center justify-center p-4'>
                    <img
                      src={previewUrl || '/placeholder.svg'}
                      alt={files[0]?.file?.name || 'Uploaded image'}
                      className='mx-auto max-h-full rounded object-contain'
                    />
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center px-4 py-3 text-center'>
                    <div
                      className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
                      aria-hidden='true'
                    >
                      <ImageIcon className='size-4 opacity-60' />
                    </div>
                    <p className='mb-1.5 text-sm font-medium'>{placeholder}</p>
                    <p className='text-muted-foreground text-xs'>
                      {accept.includes('image') ? 'SVG, PNG, JPG or GIF' : 'Select files'} (max.{' '}
                      {maxSizeMB}MB)
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      className='mt-4 bg-transparent'
                      onClick={disabled ? undefined : openFileDialog}
                      disabled={disabled}
                    >
                      <UploadIcon
                        className='-ms-1 size-4 opacity-60'
                        aria-hidden='true'
                      />
                      Select {multiple ? 'files' : 'file'}
                    </Button>
                  </div>
                )}
              </div>

              {previewUrl && !disabled && (
                <div className='absolute top-4 right-4'>
                  <button
                    type='button'
                    className='focus-visible:border-ring focus-visible:ring-ring/50 z-50 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:ring-[3px]'
                    onClick={() => removeFile(files[0]?.id)}
                    aria-label='Remove file'
                  >
                    <XIcon
                      className='size-4'
                      aria-hidden='true'
                    />
                  </button>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div
                className='text-destructive flex items-center gap-1 text-xs'
                role='alert'
              >
                <AlertCircleIcon className='size-3 shrink-0' />
                <span>{errors[0]}</span>
              </div>
            )}
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  },
);

FileUploadField.displayName = 'FileUploadField';
