import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import {
  createDeclaracao,
  fetchDeclaracoes, fetchEntregas,
  getDeclaracaoByID,
  updateDeclaracao,
} from '../actions/declaracao';
import { PaginatedResponse } from '../types';
import { Declaracao, DeclaracaoFilter, DeclaracaoStatus } from '../types/declaracao';
import { useMemo } from 'react';

export const useDeclaracao = (filters: DeclaracaoFilter) => {
  const queryResult = useQuery<PaginatedResponse<Declaracao>>({
    queryKey: ['declaracao', filters],
    queryFn: () => fetchDeclaracoes(filters),
  });

  const stats = useMemo(() => {
    if (!queryResult.data) return null;

    const content = queryResult.data.content;
    return {
      total: queryResult.data.totalElements,
      submetidos: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.SUBMETIDA).length,
      verificados: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.VERIFICADA).length,
      processados: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.PROCESSADA).length,
      validados: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.VALIDADA).length,
      totalComparticipacao: `F CFA ${content.reduce((sum, c) => sum + (c.totalComparticipacao || 0), 0)}`
    };
  }, [queryResult.data]);

  return {
    ...queryResult,
    stats,
  };
};

export const useEntregas = (filters: DeclaracaoFilter) => {

  const queryResult = useQuery<PaginatedResponse<Declaracao>>({
    queryKey: ['declaracao', filters],
    queryFn: () => fetchEntregas(filters),
  });

  const stats = useMemo(() => {
    if (!queryResult.data) return null;

    const content = queryResult.data.content;
    return {
      entregues: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.SUBMETIDA).length,
      porEntregar: content.filter((u) => u.estadoDeclaracao === DeclaracaoStatus.POR_ENTREGAR).length,
      totalContribuicoes: `F CFA ${content.reduce((sum, c) => sum + (c.totalComparticipacao || 0), 0)}`,
      totalRemuneracoes: `F CFA ${content.reduce((sum, c) => sum + (c.totalComparticipacao || 0), 0)}` // TODO: change to remuneracao
    };
  }, [queryResult.data]);

  return {
    ...queryResult,
    stats,
  };
};

export const useDetalheDeclaracao = () => {
  const params = useParams();
  const declaracaoId = params.id as string;

  return useQuery<Declaracao>({
    queryKey: ['declaracao', declaracaoId],
    queryFn: () => getDeclaracaoByID(declaracaoId),
  });
};

export const createOrUpdateDeclaracao = async (data: Declaracao) => {
  try {
    console.log(data);
    if (data.declaracaoId) {
      // Update existing declaracao
      await updateDeclaracao(data.declaracaoId, data);
    } else {
      // Create new declaracao
      await createDeclaracao(data);
    }
  } catch (error) {
    throw error;
  }
};