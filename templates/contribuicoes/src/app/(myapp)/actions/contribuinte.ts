import { callClientApi } from '../lib/use-api-client';
import { PaginatedResponse } from '../types';
import { Contribuinte, ContribuinteFilter } from '../types/contribuinte';

export async function fetchContribuintes(filters: ContribuinteFilter) {
  const { search = '', estado } = filters;

  // Determine which column to search by: 'numero' if number, otherwise 'nome'
  const isNumber = /^\d+$/.test(search);
  const searchColumn = isNumber ? 'numero' : 'nome';

  // Build query string conditionally
  let query = '';
  const params = new URLSearchParams();

  if (search) {
    params.append(searchColumn, search);
  }

  if (estado) {
    params.append('estado', estado);
  }

  query = params.toString() ? `?${params.toString()}` : '';

  return await callClientApi<PaginatedResponse<Contribuinte>>(`/api/contribuinte?query=${query}`, {
    method: 'GET',
  });
}
