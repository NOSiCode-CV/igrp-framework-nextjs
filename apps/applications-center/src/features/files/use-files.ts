import { getFileUrl } from '@/actions/file';
import { useQuery } from '@tanstack/react-query';


export const useFiles = (path: string) => {
  return useQuery({
    queryKey: ['files', path ?? ''],
    queryFn: ({ queryKey: [, p] }) => getFileUrl(p),
    enabled: !!path,
  });
};

