import { DateRange } from '@igrp/igrp-framework-react-design-system';

export enum DeclaracaoStatus {
  POR_ENTREGAR = 'POR_ENTREGAR',
  SUBMETIDA = 'SUBMETIDA',
  VERIFICADA = 'VERIFICADA',
  PROCESSADA = 'PROCESSADA',
  VALIDADA = 'VALIDADA',
}

export interface Anexo {
  nomeFicheiro: string;
  idTipoDocumento: number;
  url: string;
}

export interface Declaracao {
  declaracaoId: string;
  processoId: string;
  contribuinteId: string;
  nomeContribuinte: string;
  numeroContribuinte: string;
  data: string;
  mesReferencia: string;
  salario: number;
  diasTrabalho: number;
  outrasRemuneracoes: number;
  valorSoat: number;
  totalComparticipacao: number;
  compRegimeGeral: number;
  compSoat: number;
  estadoDeclaracao: DeclaracaoStatus;
  estadoDeclaracaoDesc: string;
  observacao?: string;
  anexos?: Anexo[];
}

export interface DeclaracaoFilter {
  search?: string;
  estadoDeclaracao?: string;
  nomeContribuinte?: string;
  numeroContribuinte?: string;
  numeroProcesso?: string;
  periodoReferencia?: string;
  periodoEntrega?: DateRange | undefined;
}
