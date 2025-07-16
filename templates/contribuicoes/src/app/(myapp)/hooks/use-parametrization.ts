import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchParameterization } from '../actions/common';
import { PARAMETERIZATION_ENDPOINTS } from '../constants';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

// Generic memorized hook
export const useParameterization = (endpoint: string) => {
  const queryResult = useQuery<IGRPOptionsProps[]>({
    queryKey: ['parameterization', endpoint],
    queryFn: () => fetchParameterization(endpoint),
  });

  return useMemo(() => queryResult, [queryResult]);
};

// Factory function to create memorized hooks dynamically
export const createParameterizationHook = (endpoint: string) => {
  return () => {
    const queryResult = useQuery<IGRPOptionsProps[]>({
      queryKey: ['parameterization', endpoint],
      queryFn: () => fetchParameterization(endpoint),
    });

    return useMemo(() => queryResult, [queryResult]);
  };
};

export const useNewDeclaracaoParameterizations = () => {
  const declaracaoStatus = useParameterization(PARAMETERIZATION_ENDPOINTS.ESTADO_DECLARACAO);

  const isLoading = declaracaoStatus.isLoading;

  return {
    declaracaoStatus: declaracaoStatus.data,
    isLoading,
  };
};

export const useDeclaracaoParameterizations = () => {
  const declaracaoStatus = useParameterization(PARAMETERIZATION_ENDPOINTS.ESTADO_DECLARACAO);
  const isLoading = declaracaoStatus.isLoading;

  return {
    declaracaoStatus: declaracaoStatus.data,
    isLoading,
  };
};
