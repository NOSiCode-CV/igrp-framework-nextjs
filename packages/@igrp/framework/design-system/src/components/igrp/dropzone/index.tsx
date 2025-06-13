'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { AlertCircle, UploadCloud, X } from 'lucide-react';
import { Card } from '@/components/horizon/card';
import { Button } from '@/components/horizon/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/primitives/alert';
import { Progress } from '@/components/primitives/progress';

export type FileWithProgress = {
  file: File;
  progress: number;
  uploaded: boolean;
  error?: string;
};

export interface IGRPDropzoneProps {
  onFilesChange: (files: FileWithProgress[]) => void;
  files: FileWithProgress[];
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  multiple?: boolean;
  isUploading?: boolean;
}

export function IGRPDropzone({
  onFilesChange,
  files,
  accept,
  maxSize = 10 * 1024 * 1024,
  maxFiles,
  className,
  multiple = true,
  isUploading = false,
}: IGRPDropzoneProps) {
  const [rejectedFiles, setRejectedFiles] = useState<
    {
      file: File;
      errors: Array<{ code: string; message: string }>;
    }[]
  >([]);

  const onDrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (accepted: File[], rejected: any[]) => {
      if (rejected.length > 0) {
        setRejectedFiles(rejected);
      } else {
        setRejectedFiles([]);
      }

      const newFileItems = accepted.map((file) => ({
        file,
        progress: 0,
        uploaded: false,
      }));

      if (multiple) {
        onFilesChange([...files, ...newFileItems]);
      } else {
        onFilesChange(newFileItems);
      }
    },
    [multiple, files, onFilesChange],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple: multiple && maxFiles !== 1,
    disabled: isUploading,
  });

  const removeFile = (fileToRemove: File) => {
    const updatedItems = files.filter((item) => item.file !== fileToRemove);
    onFilesChange(updatedItems);
  };

  const removeAllFiles = () => {
    onFilesChange([]);
  };

  const removeRejectedFile = (index: number) => {
    setRejectedFiles((files) => files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatAcceptedTypes = () => {
    if (!accept) return null;
    return Object.entries(accept)
      .map(([type, extensions]) => {
        if (type.startsWith('.')) return type;
        return extensions.join(', ');
      })
      .join(', ');
  };

  return (
    <div className='space-y-4'>
      <Card
        {...getRootProps()}
        className={cn(
          'border-dashed cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-primary',
          'p-6 text-center flex flex-col items-center gap-2',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          isUploading && 'opacity-50 pointer-events-none',
          className,
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className={cn(
            'w-10 h-10',
            isDragActive && !isDragReject ? 'text-primary' : 'text-muted-foreground',
            isDragReject && 'text-destructive',
          )}
        />
        <div className='space-y-1'>
          <p className='text-sm font-medium'>
            {isDragActive
              ? isDragReject
                ? 'Alguns arquivos serão rejeitados'
                : 'Solte os arquivos aqui'
              : multiple
                ? 'Arraste arquivos aqui ou clique para enviar vários'
                : 'Arraste um arquivo aqui ou clique para enviar'}
          </p>
          <p className='text-xs text-muted-foreground'>
            {accept && <span>Tipos aceitos: {formatAcceptedTypes()}</span>}
            {maxSize && accept && <span> · </span>}
            {maxSize && <span>Tamanho máx: {formatFileSize(maxSize)}</span>}
            {maxFiles && (maxSize || accept) && <span> · </span>}
            {maxFiles && <span>Máx de arquivos: {maxFiles}</span>}
          </p>
        </div>
      </Card>

      {rejectedFiles.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Erro no upload</AlertTitle>
          <AlertDescription>
            <ul className='mt-2 text-sm list-disc pl-5 space-y-1'>
              {rejectedFiles.map((item, index) => (
                <li
                  key={index}
                  className='flex items-center justify-between'
                >
                  <span>
                    {item.file.name} - {item.errors.map((e) => e.message).join(', ')}
                  </span>
                  <Button
                    size='icon'
                    variant='ghost'
                    onClick={() => removeRejectedFile(index)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {files.length > 0 && (
        <div className='space-y-2'>
          {files.map((item, index) => (
            <div
              key={index}
              className='flex items-center justify-between border rounded-md p-2'
            >
              <div className='flex-1'>
                <p className='text-sm font-medium'>{item.file.name}</p>
                <Progress
                  value={item.progress}
                  className='h-1 mt-1'
                />
              </div>
              <Button
                size='icon'
                variant='ghost'
                onClick={() => removeFile(item.file)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ))}
          <Button
            variant='outline'
            size='sm'
            onClick={removeAllFiles}
            className='w-full'
          >
            Remover todos os arquivos
          </Button>
        </div>
      )}
    </div>
  );
}
