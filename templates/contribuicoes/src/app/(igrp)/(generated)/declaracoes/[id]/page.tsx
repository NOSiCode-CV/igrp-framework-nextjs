'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableDateRangeFilterFn,
} from '@igrp/igrp-framework-react-design-system';
import {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
} from '@igrp/igrp-framework-react-design-system';
import {
  IGRPPageHeader,
  IGRPButton,
  IGRPStatusBanner,
  IGRPInfoCard,
  IGRPInfoSection,
  IGRPInfoItem,
  IGRPTabs,
  IGRPTabItem,
  IGRPCard,
  IGRPCardHeader,
  IGRPHeadline,
  IGRPCardContent,
  IGRPDataTable,
  IGRPDataTableCellDate,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';
import { Anexo } from '@/app/(myapp)/types/declaracao';
import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { getDeclarationById } from '@/app/(myapp)/actions/mock-actions';
import { getDeclarationAttachmentById } from '@/app/(myapp)/actions/mock-actions';
import { getLatestDeclarationByContribuinte } from '@/app/(myapp)/actions/mock-actions';
import { notFound } from 'next/navigation';
import { useDetalheDeclaracao } from '@/app/(myapp)/hooks/use-declaracao';
import { useRouter } from 'next/navigation';

export default function PageDeclaracaoComponent() {
  const [contentTableattachments_table, setContentTableattachments_table] = useState<Anexo[]>([]);

  const [declaration, setDeclaration] = useState<Declaracao | undefined>(undefined);

  const [latestDeclaration, setLatestDeclaration] = useState<Declaracao | undefined>(undefined);

  const router = useRouter();

  async function loadLatestDeclaration(id: string | undefined): Promise<void> {
    /*const declaration = await getLatestDeclarationByContribuinte(id);
    if (declaration) {
      setLatestDeclaration(declaration);
    }*/
  }

  async function loadAttachments(id: string | string[]): Promise<void> {
    /*const attachments = await getDeclarationAttachmentById(id as string);
    if (attachments) {
      setContentTableattachments_table(attachments);
    }*/
  }

  const { igrpToast } = useIGRPToast();

  const { data, isLoading } = useDetalheDeclaracao();

  useEffect(() => {
    if (isLoading && !data) return;
    setDeclaration(data);
  }, [data]);

  function handleedit_buttonNavigation(row?: any): void {
    router.push(`/declaracoes/{declaration?.declaracaoId}/editar`);
  }

  function handledeclarations_buttonNavigation(row?: any): void {
    router.push(`/declaracoes/${latestDeclaration?.declaracaoId}`);
  }

  return (
    <div className={cn('page', ' flex flex-col h-full')}>
      <IGRPPageHeader
        title={`Visualizar Declaração`}
        isSticky={true}
        showBackButton={true}
        urlBackButton={`/declaracoes`}
        variant={`h4`}
        className={cn('', 'flex flex-row flex-nowrap items-center justify-between gap-2', 'mb-4')}
      >
        <div className="flex items-center gap-2">
          <IGRPButton
            name={`print_button`}
            variant={`outline`}
            size={`sm`}
            showIcon={true}
            iconName={`Printer`}
            iconPlacement={`start`}
          >
            Imprimir
          </IGRPButton>
          <IGRPButton
            name={`edit_button`}
            variant={`default`}
            size={`sm`}
            showIcon={true}
            iconName={`Pencil`}
            iconPlacement={`start`}
            onClick={() => handleedit_buttonNavigation()}
          >
            Editar
          </IGRPButton>
        </div>
      </IGRPPageHeader>

      <div className={cn(' flex-1 p-8')}>
        <div className={cn(' space-y-8')}>
          <IGRPStatusBanner
            name={`status_banner`}
            color={`secondary`}
            variant={`soft`}
            text={`${declaration?.estadoDeclaracao}`}
            badgeText={`Processo: ${declaration?.processoId}`}
            badgeVariant={`outline`}
          ></IGRPStatusBanner>
          <div className={cn('grid', 'grid-cols-1', ' gap-6')}>
            <IGRPInfoCard
              variantSection={`solid`}
              colorSection={`primary`}
              title={`Informações Básicas`}
              sections={[
                {
                  items: [
                    {
                      text: `${declaration?.numeroContribuinte}`,
                      label: `Nº de Contribuinte`,
                      icon: `Hash`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                    {
                      text: `${declaration?.nomeContribuinte}`,
                      label: `Nome do Contribuinte`,
                      icon: `IdCard`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                  ],
                },
                {
                  items: [
                    {
                      text: `${declaration?.mesReferencia}`,
                      label: `Período de Referência`,
                      icon: `CalendarRange`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                    {
                      text: `${declaration?.data}`,
                      label: `Data de Entrega`,
                      icon: `Calendar1`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                  ],
                },
                {
                  items: [
                    {
                      text: `F CFA ${declaration?.salario}`,
                      label: `Total Remunerações`,
                      icon: `CircleDollarSign`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                    {
                      text: `F CFA ${declaration?.totalComparticipacao}`,
                      label: `Total de Contribuições`,
                      icon: `BadgeDollarSign`,
                      showIcon: true,
                      variantItem: `solid`,
                      colorItem: `primary`,
                    },
                  ],
                },
              ]}
            />
            <IGRPTabs
              variant={`default`}
              showIcon={true}
              iconPlacement={`end`}
              items={[
                {
                  value: `attachments`,
                  label: `Anexos`,
                  icon: `Paperclip`,
                  content: (
                    <>
                      <IGRPCard name={`attachments_card`}>
                        <IGRPCardHeader>
                          <IGRPHeadline
                            name={`attachments_headline`}
                            variant={`h4`}
                            title={`Documentos Anexados`}
                            className={cn(
                              '',
                              'flex flex-row flex-nowrap items-center justify-between gap-2',
                              'mt-4',
                            )}
                          ></IGRPHeadline>
                        </IGRPCardHeader>
                        <IGRPCardContent>
                          <IGRPDataTable<any, any>
                            className={cn('w-full')}
                            columns={[
                              {
                                header: 'Tipo',
                                accessorKey: 'tipo',
                                cell: ({ row }) => {
                                  return row.getValue('tipo');
                                },
                                filterFn: IGRPDataTableFacetedFilterFn,
                              },
                              {
                                header: 'Nome',
                                accessorKey: 'nome',
                                cell: ({ row }) => {
                                  return row.getValue('nome');
                                },
                                filterFn: IGRPDataTableFacetedFilterFn,
                              },
                              {
                                header: 'Data',
                                accessorKey: 'data',
                                cell: ({ row }) => {
                                  return (
                                    <IGRPDataTableCellDate
                                      date={row.getValue('data')}
                                    ></IGRPDataTableCellDate>
                                  );
                                },
                                filterFn: IGRPDataTableDateRangeFilterFn,
                              },
                            ]}
                            clientFilters={[]}
                            data={contentTableattachments_table}
                          />
                        </IGRPCardContent>
                      </IGRPCard>
                    </>
                  ),
                },
                {
                  value: `observations`,
                  label: `Outras Informações`,
                  icon: `MessageSquare`,
                  content: (
                    <>
                      <IGRPCard name={`obs_card`}>
                        <IGRPCardHeader
                          className={cn(
                            '',
                            'flex flex-row flex-nowrap items-center justify-between gap-2',
                            'mt-4',
                          )}
                        >
                          <IGRPHeadline
                            name={`obs_headline`}
                            variant={`h4`}
                            title={`Outras Informações`}
                          ></IGRPHeadline>
                        </IGRPCardHeader>
                        <IGRPCardContent>
                          <div className={cn()}>
                            <p className={cn(' text-sm font-medium text-muted-foreground')}>
                              Observações
                            </p>
                            <p className={cn(' font-semibold')}>
                              {declaration?.observacao ?? '(Nenhum comentário)'}
                            </p>
                          </div>
                        </IGRPCardContent>
                      </IGRPCard>
                    </>
                  ),
                },
              ]}
            />
          </div>
          <div className={cn('grid', 'grid-cols-2', ' gap-6')}>
            <IGRPCard name={`employees_card`}>
              <IGRPCardHeader>
                <IGRPHeadline
                  name={`funcionarios_headline`}
                  variant={`h4`}
                  title={`Lançamento`}
                  className={cn(
                    '',
                    'flex flex-row flex-nowrap items-center justify-between gap-2',
                    'mt-4',
                  )}
                ></IGRPHeadline>
              </IGRPCardHeader>
              <IGRPCardContent>
                <div
                  className={cn('flex', 'items-center', ' p-4 border rounded-lg justify-between')}
                >
                  <div className={cn('flex', ' gap-4')}>
                    <div
                      className={cn(
                        ' h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center',
                      )}
                    >
                      <IGRPIcon
                        name={`users_icon`}
                        iconName={`Users`}
                        className={cn('h-6 w-6 text-blue-500')}
                      ></IGRPIcon>
                    </div>
                    <div className={cn()}>
                      <p className={cn(' font-medium')}>Total de Funcionários</p>
                      <p className={cn(' text-2xl font-bold')}>25</p>
                    </div>
                  </div>
                  <IGRPButton name={`employees_button`} variant={`outline`} size={`sm`}>
                    Ver Detalhes
                  </IGRPButton>
                </div>
              </IGRPCardContent>
            </IGRPCard>
            <IGRPCard name={`declarations_card`}>
              <IGRPCardHeader>
                <IGRPHeadline
                  name={`pagamentos_headline`}
                  variant={`h4`}
                  title={`Declarações`}
                  className={cn(
                    '',
                    'flex flex-row flex-nowrap items-center justify-between gap-2',
                    'mt-4',
                  )}
                ></IGRPHeadline>
              </IGRPCardHeader>
              <IGRPCardContent>
                <div
                  className={cn('flex', 'items-center', ' p-4 border rounded-lg justify-between')}
                >
                  <div className={cn('flex', 'items-center', ' gap-4')}>
                    <div
                      className={cn(
                        ' h-12 w-12 rounded-full bg-green-100 flex items-center justify-center',
                      )}
                    >
                      <IGRPIcon
                        name={`file_icon`}
                        iconName={`FileText`}
                        className={cn('h-6 w-6 text-green-500')}
                      ></IGRPIcon>
                    </div>
                    <div className={cn()}>
                      <p className={cn(' font-medium')}>Última Declaração Entregue</p>
                      <p className={cn(' text-muted-foreground')}>
                        {latestDeclaration?.data ?? 'Nenhuma'} -{' '}
                        {latestDeclaration?.totalComparticipacao ?? '0'} F CFA
                      </p>
                    </div>
                  </div>
                  <IGRPButton
                    name={`declarations_button`}
                    variant={`outline`}
                    size={`sm`}
                    onClick={() => handledeclarations_buttonNavigation()}
                    disabled={!latestDeclaration}
                  >
                    Ver Declaração
                  </IGRPButton>
                </div>
              </IGRPCardContent>
            </IGRPCard>
          </div>
        </div>
      </div>
    </div>
  );
}
