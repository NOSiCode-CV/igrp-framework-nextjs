import { useQuery } from '@tanstack/react-query';

import { fetchContribuintes } from '../actions/contribuinte';
import { PaginatedResponse } from '../types';
import { Contribuinte, ContribuinteFilter } from '../types/contribuinte';

export const useContribuinte = (filters: ContribuinteFilter) => {
  return useQuery<PaginatedResponse<Contribuinte>>({
    queryKey: ['contribuinte', filters],
    queryFn: () => fetchContribuintes(filters),
  });
};