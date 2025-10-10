import { UploadFileOptions } from '@igrp/platform-access-management-client-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getFileUrl, uploadPrivateFile, uploadPublicFile } from '@/actions/file';

export const useFiles = (path: string) => {
  return useQuery({
    queryKey: ['files', path ?? ''],
    queryFn: ({ queryKey: [, p] }) => getFileUrl(p),
    enabled: !!path,
  });
};

export const useUploadPublicFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, options }: { file: File | Blob; options: UploadFileOptions }) =>
      uploadPublicFile(file, options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public-files-public'] });
      await queryClient.refetchQueries({ queryKey: ['public-files-public'] });
    },
  });
};

export const useUploadPrivateFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, options, filename }: { file: File | Blob; options: UploadFileOptions, filename?: string }) => {
      const fd = new FormData()
      fd.append('file', file)                           
      fd.append('folder', options.folder ?? '')   
      fd.append('filename', filename ?? '')   

      return await uploadPrivateFile(fd)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['public-files-private'] })
      await queryClient.refetchQueries({ queryKey: ['public-files-private'] })
    },
  })
};
