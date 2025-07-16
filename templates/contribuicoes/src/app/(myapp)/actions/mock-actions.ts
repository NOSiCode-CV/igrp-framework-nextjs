'use server';

import {
  mockDeclarations,
  mockPeriodOptions,
  mockStatusOptions,
  mockCurrentAccountResponse,
  mockContribuintes,
  mockDeclarationsAttachments,
  mockInfoDesconto,
} from '@/app/(myapp)/data/mockData';

import {
  Attachment,
  CurrentAccountResponse,
  Declaration,
  InfoDesconto,
  NewDeclarationRequest,
  NewLaunchRequest,
} from '@/app/(myapp)/data/types';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';

export async function getDeclarations() {
  //await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDeclarations;
}

export async function getTaxPayerDeclarations(nrContribuinte: string): Promise<Declaration[]> {
  //await new Promise((resolve) => setTimeout(resolve, 500));
  return mockDeclarations.filter((it) => it.numero_contribuinte === nrContribuinte);
}

export async function getStatusOptions() {
  // await new Promise((resolve) => setTimeout(resolve, 500));
  return mockStatusOptions;
}

export async function getPeriodoOptions() {
  // await new Promise((resolve) => setTimeout(resolve, 500));
  return mockPeriodOptions;
}

export async function getCurrentAccountList(): Promise<CurrentAccountResponse> {
  // In a real application, this would make an API call to fetch the data
  // For this mock, we'll just return the mock data
  return mockCurrentAccountResponse;
}

export async function getContribuintes(): Promise<IGRPOptionsProps[]> {
  return mockContribuintes.map((contr) => {
    return { value: contr.id, label: `${contr.numeroContribuinte} - ${contr.nomeContribuinte}` };
  });
}

/**
 * Returns a list of month-year options from January 2000 to the current month.
 */
export async function getMesesReferencia(): Promise<IGRPOptionsProps[]> {
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const options: IGRPOptionsProps[] = [];
  const start = new Date(2000, 0); // January 2000
  const now = new Date();

  for (let date = new Date(start); date <= now; date.setMonth(date.getMonth() + 1)) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const value = `${year}${String(month + 1).padStart(2, '0')}`;
    const label = `${meses[month]} ${year}`;
    options.push({ value, label });
  }

  return options;
}

export async function onSubmitForm(values: NewDeclarationRequest) {
  console.log(`Submitted values: ${JSON.stringify(values)}`);
}

export async function onSubmitLaunchForm(values: NewLaunchRequest) {
  console.log(`Submitted values: ${JSON.stringify(values)}`);
}

export async function getDeclarationById(id: string): Promise<Declaration | undefined> {
  return mockDeclarations.find((it) => it.id === id);
}

export async function getDeclarationAttachmentById(id: string): Promise<Attachment[]> {
  return mockDeclarationsAttachments.filter((it) => it.idDeclaracao === id);
}

export async function getLatestDeclarationByContribuinte(
  id: string | undefined,
): Promise<Declaration | undefined> {
  if (!id) return undefined;
  return mockDeclarations
    .filter((it) => it.idContribuinte === id)
    .sort((a, b) => new Date(b.data_entrega).getTime() - new Date(a.data_entrega).getTime())[1];
}

export async function getInfoDesconto(): Promise<InfoDesconto> {
  return mockInfoDesconto;
}
