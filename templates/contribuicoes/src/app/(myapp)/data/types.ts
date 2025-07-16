export interface Declaration {
  id: string;
  idContribuinte: string;
  numero_contribuinte: string;
  nome_contribuinte: string;
  numero_processo: string;
  periodo_referencia: string;
  data_entrega: string;
  total_remuneracao: number;
  total_comparticipacao: number;
  estado: string;
  observacoes?: string;
}

export interface Launch {
  numeroBeneficiario: string;
  nomeBeneficiario: string;
  dataNascimento: string;
  diasTrabalho: number;
  salarioDiario: number;
  outrasRemuneracoes: number;
  totalMensal: number;
  compSoat: number;
  compRegimeGeral: number;
  observacao?: string;
}

export interface Attachment {
  idDeclaracao: string;
  tipo: string;
  nome: string;
  data: Date;
}

export interface NewLaunchRequest {
  lancamento: Launch[];
}

export interface InfoDesconto {
  soat: number;
  regimeGeral: number;
}

export interface NewDeclarationRequest {
  declaracaoId: string;
  contribuinteId: string;
  mesReferencia: string;
  diasTrabalho: number;
  salario: number;
  outrasRemuneracoes: number;
  compRegimeGeral: number;
  observacoes?: string;
}

export interface CurrentAccount {
  taxpayerNumber: string;
  taxpayerName: string;
  referenceMonth: string;
  movement: number;
  declared: number;
  calculated: number;
  paid: number;
  difference: number;
  status: 'Pendente' | 'Pago' | 'Atrasado';
}

export interface CurrentAccountStats {
  totalMovement: number;
  totalDeclared: number;
  totalCalculated: number;
  totalPaid: number;
}

export interface CurrentAccountResponse {
  data: CurrentAccount[];
  stats: CurrentAccountStats;
}

export interface Contribuinte {
  id: string;
  numeroContribuinte: string;
  nomeContribuinte: string;
}
