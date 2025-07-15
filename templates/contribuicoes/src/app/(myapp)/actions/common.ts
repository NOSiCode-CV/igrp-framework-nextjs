import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import { callClientApi } from '../lib/use-api-client';

// Base fetch function (unchanged)
export async function fetchParameterization(endpoint: string) {
  return await callClientApi<IGRPOptionsProps[]>(`/api/parameterization?name=${endpoint}`, {
    method: 'GET',
  });
}

export async function fetchAny(endpoint: string) {
  return await callClientApi(`/api/parameterization?name=${endpoint}`, {
    method: 'GET',
  });
}