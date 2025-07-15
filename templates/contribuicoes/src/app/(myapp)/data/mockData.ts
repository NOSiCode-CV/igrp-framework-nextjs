import {
  Declaration,
  CurrentAccount,
  CurrentAccountResponse,
  CurrentAccountStats,
  Contribuinte, Attachment, InfoDesconto,
} from '@/app/(myapp)/data/types';
import { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";

export const mockStatusOptions: IGRPOptionsProps[] = [
  {
    value: 'SUBMETIDA',
    label: 'Submetida',
  },
  {
    value: 'VERIFICADA',
    label: 'Verificada',
  },
  {
    value: 'PROCESSADA',
    label: 'Processada',
  },
  {
    value: 'VALIDADA',
    label: 'Validada',
  },
];

export const mockPeriodOptions: IGRPOptionsProps[] = [
  { value: '2024-01', label: 'Janeiro 2024' },
  { value: '2024-02', label: 'Fevereiro 2024' },
  { value: '2024-03', label: 'Março 2024' },
  { value: '2024-04', label: 'Abril 2024' },
  { value: '2024-05', label: 'Maio 2024' },
  { value: '2024-06', label: 'Junho 2024' },
  { value: '2024-07', label: 'Julho 2024' },
  { value: '2024-08', label: 'Agosto 2024' },
  { value: '2024-09', label: 'Setembro 2024' },
  { value: '2024-10', label: 'Outubro 2024' },
  { value: '2024-11', label: 'Novembro 2024' },
  { value: '2024-12', label: 'Dezembro 2024' },
  { value: '2025-01', label: 'Janeiro 2025' },
  { value: '2025-02', label: 'Fevereiro 2025' },
  { value: '2025-03', label: 'Março 2025' },
  { value: '2025-04', label: 'Abril 2025' },
  { value: '2025-05', label: 'Maio 2025' },
  { value: '2025-06', label: 'Junho 2025' },
  { value: '2025-07', label: 'Julho 2025' },
  { value: '2025-08', label: 'Agosto 2025' },
  { value: '2025-09', label: 'Setembro 2025' },
  { value: '2025-10', label: 'Outubro 2025' },
  { value: '2025-11', label: 'Novembro 2025' },
  { value: '2025-12', label: 'Dezembro 2025' },
];

export const mockDeclarationsAttachments: Attachment[] = [
  {
    idDeclaracao: "1",
    tipo: "FOS",
    nome: "folha_pagamento_jan.pdf",
    data: new Date("2025-06-25"),
  },
  {
    idDeclaracao: "2",
    tipo: "CP",
    nome: "comparticipacao_fev.xlsx",
    data: new Date("2025-03-10"),
  },
  {
    idDeclaracao: "3",
    tipo: "FOS",
    nome: "salarios_mar.pdf",
    data: new Date("2025-04-12"),
  },
  {
    idDeclaracao: "4",
    tipo: "CP",
    nome: "comparticipacao_abr.pdf",
    data: new Date("2025-05-08"),
  },
  {
    idDeclaracao: "5",
    tipo: "FOS",
    nome: "pagamento_mai.xlsx",
    data: new Date("2025-06-02"),
  },
  {
    idDeclaracao: "6",
    tipo: "CP",
    nome: "cp_analise_jun.pdf",
    data: new Date("2025-06-18"),
  },
  {
    idDeclaracao: "7",
    tipo: "FOS",
    nome: "salarios_jul.pdf",
    data: new Date("2025-07-01"),
  },
  {
    idDeclaracao: "8",
    tipo: "CP",
    nome: "comparticipacao_ago.xlsx",
    data: new Date("2025-08-19"),
  },
  {
    idDeclaracao: "9",
    tipo: "FOS",
    nome: "folha_setembro.pdf",
    data: new Date("2025-09-05"),
  },
  {
    idDeclaracao: "10",
    tipo: "CP",
    nome: "cp_outubro.xlsx",
    data: new Date("2025-10-14"),
  },
];

export const mockDeclarations: Declaration[] = [
  {
    id: "1",
    idContribuinte: "1",
    numero_contribuinte: "GB-10001",
    nome_contribuinte: "Ministério da Saúde",
    numero_processo: "PRC-2024-001",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-15",
    total_remuneracao: 1500000,
    total_comparticipacao: 300000,
    estado: "SUBMETIDA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "2",
    idContribuinte: "2",
    numero_contribuinte: "GB-10002",
    nome_contribuinte: "Banco da África Ocidental",
    numero_processo: "PRC-2024-002",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-16",
    total_remuneracao: 3200000,
    total_comparticipacao: 640000,
    estado: "VERIFICADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "3",
    idContribuinte: "3",
    numero_contribuinte: "GB-10003",
    nome_contribuinte: "Telecomunicações da Guiné-Bissau",
    numero_processo: "PRC-2024-003",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-17",
    total_remuneracao: 2100000,
    total_comparticipacao: 420000,
    estado: "PROCESSADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "4",
    idContribuinte: "4",
    numero_contribuinte: "GB-10004",
    nome_contribuinte: "Alfa e Ómega Construções",
    numero_processo: "PRC-2024-004",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-18",
    total_remuneracao: 890000,
    total_comparticipacao: 178000,
    estado: "VALIDADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "5",
    idContribuinte: "5",
    numero_contribuinte: "GB-10005",
    nome_contribuinte: "ONG Terra Verde",
    numero_processo: "PRC-2024-005",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-18",
    total_remuneracao: 450000,
    total_comparticipacao: 90000,
    estado: "SUBMETIDA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "6",
    idContribuinte: "6",
    numero_contribuinte: "GB-10006",
    nome_contribuinte: "Supermercado Estrela",
    numero_processo: "PRC-2024-006",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-19",
    total_remuneracao: 1320000,
    total_comparticipacao: 264000,
    estado: "VERIFICADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "7",
    idContribuinte: "7",
    numero_contribuinte: "GB-10007",
    nome_contribuinte: "Clínica Vida Nova",
    numero_processo: "PRC-2024-007",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-20",
    total_remuneracao: 980000,
    total_comparticipacao: 196000,
    estado: "PROCESSADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "8",
    idContribuinte: "8",
    numero_contribuinte: "GB-10008",
    nome_contribuinte: "Técnico João Pereira",
    numero_processo: "PRC-2024-008",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-20",
    total_remuneracao: 350000,
    total_comparticipacao: 70000,
    estado: "VALIDADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "9",
    idContribuinte: "9",
    numero_contribuinte: "GB-10009",
    nome_contribuinte: "Associação Cultural Djumbai",
    numero_processo: "PRC-2024-009",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-21",
    total_remuneracao: 410000,
    total_comparticipacao: 82000,
    estado: "SUBMETIDA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "10",
    idContribuinte: "10",
    numero_contribuinte: "GB-10010",
    nome_contribuinte: "Artesanato Bissau",
    numero_processo: "PRC-2024-010",
    periodo_referencia: "2024-01",
    data_entrega: "2024-02-21",
    total_remuneracao: 260000,
    total_comparticipacao: 52000,
    estado: "VERIFICADA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
  {
    id: "11",
    idContribuinte: "1",
    numero_contribuinte: "GB-10001",
    nome_contribuinte: "Ministério da Saúde",
    numero_processo: "PRC-2024-011",
    periodo_referencia: "2024-02",
    data_entrega: "2024-03-15",
    total_remuneracao: 1500000,
    total_comparticipacao: 300000,
    estado: "SUBMETIDA",
    observacoes: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  },
];

export const mockCurrentAccountData: CurrentAccount[] = [
  {
    taxpayerNumber: '123456789',
    taxpayerName: 'Empresa A',
    referenceMonth: 'Janeiro',
    movement: 100000,
    declared: 90000,
    calculated: 85000,
    paid: 80000,
    difference: 5000,
    status: 'Pago',
  },
  {
    taxpayerNumber: '987654321',
    taxpayerName: 'Empresa B',
    referenceMonth: 'Fevereiro',
    movement: 200000,
    declared: 180000,
    calculated: 170000,
    paid: 160000,
    difference: 10000,
    status: 'Pendente',
  },
  {
    taxpayerNumber: '456789123',
    taxpayerName: 'Empresa C',
    referenceMonth: 'Março',
    movement: 300000,
    declared: 270000,
    calculated: 255000,
    paid: 240000,
    difference: 15000,
    status: 'Atrasado',
  },
  {
    taxpayerNumber: '789123456',
    taxpayerName: 'Empresa D',
    referenceMonth: 'Abril',
    movement: 400000,
    declared: 360000,
    calculated: 340000,
    paid: 320000,
    difference: 20000,
    status: 'Pago',
  },
  {
    taxpayerNumber: '321654987',
    taxpayerName: 'Empresa E',
    referenceMonth: 'Maio',
    movement: 500000,
    declared: 450000,
    calculated: 425000,
    paid: 400000,
    difference: 25000,
    status: 'Pendente',
  },
  {
    taxpayerNumber: '654987321',
    taxpayerName: 'Empresa F',
    referenceMonth: 'Junho',
    movement: 600000,
    declared: 540000,
    calculated: 510000,
    paid: 480000,
    difference: 30000,
    status: 'Atrasado',
  },
  {
    taxpayerNumber: '987321654',
    taxpayerName: 'Empresa G',
    referenceMonth: 'Julho',
    movement: 700000,
    declared: 630000,
    calculated: 595000,
    paid: 560000,
    difference: 35000,
    status: 'Pago',
  },
  {
    taxpayerNumber: '123789456',
    taxpayerName: 'Empresa H',
    referenceMonth: 'Agosto',
    movement: 800000,
    declared: 720000,
    calculated: 680000,
    paid: 640000,
    difference: 40000,
    status: 'Pendente',
  },
];

export const mockContribuintes: Contribuinte[] = [
  {
    id: '5c8d3c3e-1d0f-4a4a-810a-2b65ed5b2c5f',
    nomeContribuinte: 'Ministério da Saúde',
    numeroContribuinte: 'GB-10001'
  },
  {
    id: '7db0150a-55ec-4430-9f91-06f2ed7a4107',
    nomeContribuinte: 'Banco Nacional da Guiné-Bissau',
    numeroContribuinte: 'GB-10002'
  },
  {
    id: '1e8e2c09-ef2f-4e6e-bb2e-0cd3d1aeea2f',
    nomeContribuinte: 'Telecomunicações da Guiné',
    numeroContribuinte: 'GB-10003'
  },
  {
    id: '68782a6e-387f-4420-9ba7-2a50f83c2505',
    nomeContribuinte: 'Empresa Alfa',
    numeroContribuinte: '12345'
  },
  {
    id: '2d43c59f-c8cf-43a4-a5e3-12cb7ea478b2',
    nomeContribuinte: 'ONG Terra Verde',
    numeroContribuinte: 'GB-10005'
  },
  {
    id: 'e3f402e5-3697-4f90-bd3a-dbe20819efad',
    nomeContribuinte: 'Supermercado Estrela',
    numeroContribuinte: 'GB-10006'
  },
  {
    id: '25fd9604-1f69-4aef-82cb-b1e96cc51f68',
    nomeContribuinte: 'Clínica Vida Nova',
    numeroContribuinte: 'GB-10007'
  },
  {
    id: '4c6ffb90-fbe4-4c67-8a80-43a113457450',
    nomeContribuinte: 'João Pereira - Técnico',
    numeroContribuinte: 'GB-10008'
  },
  {
    id: '63116d85-7f21-4ec5-8a66-4e32a2b5f879',
    nomeContribuinte: 'Associação Cultural Djumbai',
    numeroContribuinte: 'GB-10009'
  },
  {
    id: 'b315bcd4-1cb8-47bb-a64e-6451cb94f68b',
    nomeContribuinte: 'Artesanato Bissau',
    numeroContribuinte: 'GB-10010'
  },
  {
    id: '30a6e9a8-c6c6-46cc-b51a-31fc8eb5f7f1',
    nomeContribuinte: 'PetroGuiné',
    numeroContribuinte: 'GB-10011'
  },
  {
    id: 'b7eb6c18-0dd5-45aa-8c0e-02f348cf7df5',
    nomeContribuinte: 'Guiné Seguros',
    numeroContribuinte: 'GB-10012'
  },
  {
    id: 'eb8f31aa-bb59-4f7d-a51a-cc733370fc11',
    nomeContribuinte: 'Universidade Amílcar Cabral',
    numeroContribuinte: 'GB-10013'
  },
  {
    id: 'feef78d1-2a3b-4912-9964-8c34f8602c83',
    nomeContribuinte: 'Farmácia Central',
    numeroContribuinte: 'GB-10014'
  },
  {
    id: '9a4a06de-d3ff-4ef3-9a0b-e4383d503ae4',
    nomeContribuinte: 'Serviços Rápidos Lda',
    numeroContribuinte: 'GB-10015'
  },
  {
    id: 'ecdbb356-2bc7-4a98-acc6-4d82fc36e9e8',
    nomeContribuinte: 'Confeitaria Doce Sabor',
    numeroContribuinte: 'GB-10016'
  },
  {
    id: '06fd3fc8-f9a6-4e87-a734-b2bfc304b697',
    nomeContribuinte: 'Agência de Turismo Sol e Mar',
    numeroContribuinte: 'GB-10017'
  },
  {
    id: 'f2a4db2e-2d70-4e3f-9e5e-e117e7ea5a44',
    nomeContribuinte: 'Editora Ponto Final',
    numeroContribuinte: 'GB-10018'
  },
  {
    id: '474509d4-63bb-4c35-a839-7be0e2091f66',
    nomeContribuinte: 'Transportes Unidos',
    numeroContribuinte: 'GB-10019'
  },
  {
    id: '7ad62233-dc5e-4860-b88c-c0b979d14d67',
    nomeContribuinte: 'Companhia Agrícola Nô Terra',
    numeroContribuinte: 'GB-10020'
  }
];

export const mockInfoDesconto: InfoDesconto = {
  soat: 8,
  regimeGeral: 12
}

export const mockCurrentAccountStats: CurrentAccountStats = {
  totalMovement: 3600000,
  totalDeclared: 3240000,
  totalCalculated: 3060000,
  totalPaid: 2880000,
};

export const mockCurrentAccountResponse: CurrentAccountResponse = {
  data: mockCurrentAccountData,
  stats: mockCurrentAccountStats,
};