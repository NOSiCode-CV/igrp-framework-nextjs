import { DateRange } from '@igrp/igrp-framework-react-design-system';

export interface Contribuinte {
  contribuinteId: string;
  nomeContribuinte: string;
  numeroContribuinte: string;
}

export interface ContribuinteFilter {
  search?: string;
  regime?: string;
  estatutoJuridico?: string;
  estado?: string;
  data?: DateRange | undefined;
}