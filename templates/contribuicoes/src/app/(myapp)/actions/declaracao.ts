import { callClientApi } from '../lib/use-api-client';
import { PaginatedResponse } from '../types';
import { Declaracao, DeclaracaoFilter } from '../types/declaracao';

export async function fetchDeclaracoes(filters: DeclaracaoFilter) {
  // Determine which column to search by: 'numero' if number, otherwise 'nome'
  const isNumber = filters.search ? /^\d+$/.test(filters.search) : false;
  const searchColumn = isNumber ? 'numeroContribuinte' : 'nomeContribuinte';

  // Build query string conditionally
  const params = new URLSearchParams();

  if (filters.search) {
    params.append(searchColumn, filters.search);
  }

  if (filters.estadoDeclaracao) {
    params.append('estadoDeclaracao', filters.estadoDeclaracao);
  }

  if (filters.nomeContribuinte) {
    params.append('nomeContribuinte', filters.nomeContribuinte);
  }

  if (filters.numeroContribuinte) {
    params.append('numeroContribuinte', filters.numeroContribuinte);
  }

  if (filters.numeroProcesso) {
    params.append('numeroProcesso', filters.numeroProcesso);
  }

  if (filters.periodoReferencia) {
    params.append('periodoReferencia', filters.periodoReferencia);
  }

  if (filters.periodoEntrega?.from) {
    params.append('periodoEntregaDe', filters.periodoEntrega.from.toISOString());
  }

  if (filters.periodoEntrega?.to) {
    params.append('periodoEntregaAte', filters.periodoEntrega.to.toISOString());
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  return await callClientApi<PaginatedResponse<Declaracao>>(`/api/declaracao?query=${query}`, {
    method: 'GET',
  });
}

export async function fetchEntregas(filters: DeclaracaoFilter) {
  // Build query string conditionally
  const params = new URLSearchParams();

  if (filters.estadoDeclaracao) {
    params.append('estadoDeclaracao', filters.estadoDeclaracao);
  }

  if (filters.numeroContribuinte) {
    params.append('numeroContribuinte', filters.numeroContribuinte);
  }

  if (filters.periodoReferencia) {
    params.append('periodoReferencia', filters.periodoReferencia);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  return await callClientApi<PaginatedResponse<Declaracao>>(`/api/entregas?query=${query}`, {
    method: 'GET',
  });
}

export async function getDeclaracaoByID(declaracaoId: string) {
  return await callClientApi<Declaracao>(`/api/declaracao?declaracaoId=${declaracaoId}`, {
    method: 'GET',
  });
}

export async function createDeclaracao(data: Declaracao) {
  return await callClientApi<Declaracao>(`/api/declaracao`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDeclaracao(declaracaoId: string, data: Declaracao) {
  return await callClientApi<Declaracao>(`/api/declaracao/${declaracaoId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}