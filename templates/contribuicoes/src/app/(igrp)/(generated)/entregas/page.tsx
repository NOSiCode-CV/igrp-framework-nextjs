'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableDateRangeFilterFn,
} from '@igrp/igrp-framework-react-design-system';
import {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
} from '@igrp/igrp-framework-react-design-system';
import Deliverymodalform from '@/app/(igrp)/(generated)/entregas/components/deliverymodalform';
import {
  IGRPPageHeader,
  IGRPButton,
  IGRPStatsCard,
  IGRPBadge,
  IGRPCard,
  IGRPCardContent,
  IGRPInputSearch,
  IGRPSelect,
  IGRPDataTable,
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableRowAction,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuCustom,
} from '@igrp/igrp-framework-react-design-system';
import { DeclaracaoStatus } from '@/app/(myapp)/types/declaracao';
import { Anexo } from '@/app/(myapp)/types/declaracao';
import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { removeAccents } from '@/app/(myapp)/utils/utils';
import { getDeclarations } from '@/app/(myapp)/actions/mock-actions';
import { getTaxPayerDeclarations } from '@/app/(myapp)/actions/mock-actions';
import { getStatusOptions } from '@/app/(myapp)/actions/mock-actions';
import { getPeriodoOptions } from '@/app/(myapp)/actions/mock-actions';
import { IGRPDatePickerRange } from '@igrp/igrp-framework-react-design-system';
import { useEntregas } from '@/app/(myapp)/hooks/use-declaracao';
import { useDeclaracaoParameterizations } from '@/app/(myapp)/hooks/use-parametrization';

export default function PageEntregasComponent() {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [totalRemuneracoes, setTotalRemuneracoes] = useState<string>(`F CFA 0`);
  const [totalContribuicoes, setTotalContribuicoes] = useState<string>(`F CFA 0`);
  const [totalEntregue, setTotalEntregue] = useState<number>(0);
  const [totalPorEntregar, setTotalPorEntregar] = useState<number>(0);
  const [filterValue, setFilterValue] = useState<string>(``);
  const [selectPeriodo_ref_fltOptions, setSelectPeriodo_ref_fltOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [periodoReferenciaFilter, setPeriodoReferenciaFilter] = useState<string>(``);
  const [selectStatus_fltOptions, setSelectStatus_fltOptions] = useState<IGRPOptionsProps[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(``);
  const [contentTabledelivery, setContentTabledelivery] = useState<Declaracao[]>([]);

  const [resetFilters, setResetFilters] = useState<boolean>(false);

  const [hasActiveFilters, setHasActiveFilters] = useState<boolean>(false);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const [openDeliveryForm, setOpenDeliveryForm] = useState<boolean>(false);

  function getStatusBadge(value: Declaracao): {
    iconName?: string;
    bgClass?: string;
    textClass?: string;
    label?: string;
    className?: string;
  } {
    if (!value) return {};

    const estado = value.estadoDeclaracao;
    let bgClass: string;

    switch (estado) {
      case DeclaracaoStatus.SUBMETIDA:
        bgClass = 'bg-green-200';
        break;
      case DeclaracaoStatus.POR_ENTREGAR:
        bgClass = 'bg-amber-200';
        break;
      default:
        bgClass = 'bg-gray-200';
        break;
    }

    const label = selectStatus_fltOptions.find((it) => it.value === estado)?.label ?? 'N/E';

    return { label, bgClass };
  }

  function handleDownloadClick(): void {
    console.log('Handling Download');
  }

  function handleRefreshClick(): void {}

  const { data, stats, isLoading, error } = useEntregas({
    //estadoDeclaracao: statusFilter,
    numeroContribuinte: filterValue,
    periodoReferencia: periodoReferenciaFilter,
  });

  const { declaracaoStatus, isLoading: isLoadingParams } = useDeclaracaoParameterizations();

  useEffect(() => {
    loadStatusFltCombobox();
  }, [declaracaoStatus]);

  useEffect(() => {
    if (!isLoading && data && data.content) {
      setContentTabledelivery(
        (data.content || []).map((item: any) => ({
          ...item,
        })),
      );

      setTotalRemuneracoes(stats?.totalRemuneracoes || 'F CFA -');
      setTotalContribuicoes(stats?.totalContribuicoes || 'F CFA -');
      setTotalEntregue(stats?.entregues || 0);
      setTotalPorEntregar(stats?.porEntregar || 0);
    }
  }, [isLoading, data, stats]);

  const loadStatusFltCombobox = async () => {
    setSelectStatus_fltOptions(declaracaoStatus || []);
  };

  return (
    <div className={cn('page')}>
      <div className={cn('flex', 'flex-col', ' h-full w-full')}>
        <IGRPPageHeader
          name={`page_title`}
          title={`Lista de Entrega de Declarações`}
          description={`Acompanhe o status de entrega das declarações`}
          variant={`h3`}
          className={cn('', 'flex flex-row flex-nowrap items-center justify-between gap-2', 'mb-4')}
        >
          <div className="flex items-center gap-2">
            <IGRPButton
              name={`button_new`}
              size={`sm`}
              variant={`outline`}
              showIcon={true}
              iconName={`Plus`}
              onClick={() => setOpenDeliveryForm(!openDeliveryForm)}
            >
              Nova Entrega
            </IGRPButton>
          </div>
        </IGRPPageHeader>

        <div className={cn('grid', 'grid-cols-4 ', 'lg:grid-cols-4 ', ' gap-3 mb-4 px-6 w-full')}>
          <IGRPStatsCard
            name={`total_remuneracoes_stat`}
            title={`Total Remunerações`}
            iconName={`DollarSign`}
            showIcon={true}
            iconVariant={`primary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`primary`}
            value={totalRemuneracoes}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`total_contribuicoes_stat`}
            title={`Total Contribuições`}
            iconName={`CreditCard`}
            showIcon={true}
            iconVariant={`secondary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`secondary`}
            value={totalContribuicoes}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`total_entregue_stat`}
            title={`Total Entregue`}
            iconName={`CircleCheck`}
            showIcon={true}
            iconVariant={`success`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`success`}
            value={totalEntregue}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`total_por_entregar_stat`}
            title={`Total Por Entregar`}
            iconName={`CircleAlert`}
            showIcon={true}
            iconVariant={`warning`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`warning`}
            value={totalPorEntregar}
          ></IGRPStatsCard>
        </div>
        <div className={cn('flex', 'items-center', ' justify-between px-6 pt-6 pb-4 w-full')}>
          <IGRPBadge name={`info_badge`} iconName={`Info`} showIcon={true} variant={`soft`}>
            Indique o número de contribuinte e clique no botão &quot;Pesquisar&quot;.
          </IGRPBadge>
        </div>
        <div className={cn('flex', 'flex-1', ' px-6 pb-6 w-full')}>
          <IGRPCard name={`main_content_card`} className={cn('shadow-sm w-full')}>
            <IGRPCardContent className={cn('p4 border-b bg-white')}>
              <div className={cn('flex', 'flex-wrap', ' items-center gap-3  px-4')}>
                <div className={cn(' relative flex-1 min-w-[240px]')}>
                  <IGRPInputSearch
                    name={`search_input_text`}
                    showSubmitButton={true}
                    submitButtonLabel={`Pesquisar`}
                    showStartIcon={true}
                    placeholder={`Pesquisar contribuintes...`}
                    required={false}
                    onSearch={(value) => {
                      setFilterValue(value);
                    }}
                    value={filterValue}
                  ></IGRPInputSearch>
                </div>
                <IGRPButton
                  name={`filter_table_button`}
                  size={`sm`}
                  variant={`ghost`}
                  showIcon={true}
                  iconName={`SlidersHorizontal`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <p className={cn()}>Filtros</p>
                  {hasActiveFilters && (
                    <div
                      className={cn(
                        ' ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground',
                      )}
                    >
                      {(statusFilter !== '' ? 1 : 0) + (periodoReferenciaFilter !== '' ? 1 : 0)}
                    </div>
                  )}
                </IGRPButton>
                <div className={cn('flex', 'items-center', ' gap-2')}>
                  <IGRPButton
                    name={`button_download`}
                    size={`icon`}
                    variant={`outline`}
                    iconName={`Download`}
                    className={cn('h-10 w-10')}
                    onClick={handleDownloadClick}
                  >
                    Exportar entregas
                  </IGRPButton>
                  <IGRPButton
                    name={`button_refresh`}
                    size={`icon`}
                    variant={`outline`}
                    iconName={`RefreshCw`}
                    className={cn('h-10 w-10')}
                    onClick={handleRefreshClick}
                  >
                    Atualizar lista
                  </IGRPButton>
                </div>
              </div>
              {showFilters && (
                <div className={cn(' mt-3 pt-3 border-t px-4')}>
                  <div className={cn('flex', 'flex-wrap', ' items-end gap-4')}>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPSelect
                        name={`periodo_ref_flt`}
                        label={`Mês de Referência`}
                        placeholder={`Todos Períodos`}
                        showSearch={true}
                        onValueChange={setPeriodoReferenciaFilter}
                        options={selectPeriodo_ref_fltOptions}
                        value={periodoReferenciaFilter}
                      ></IGRPSelect>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPSelect
                        name={`status_flt`}
                        label={`Estado da Declaração`}
                        placeholder={`Todos Estados`}
                        onValueChange={setStatusFilter}
                        options={selectStatus_fltOptions}
                        value={statusFilter}
                      ></IGRPSelect>
                    </div>
                    <div className={cn(' ml-auto')}>
                      <IGRPButton
                        name={`button_clear_filter`}
                        size={`sm`}
                        variant={`outline`}
                        iconName={`X`}
                        showIcon={true}
                        className={cn('h-9')}
                        onClick={() => {
                          setResetFilters(true);
                          setStatusFilter('');
                          setPeriodoReferenciaFilter('');
                        }}
                        disabled={!hasActiveFilters}
                      >
                        Limpar Filtros
                      </IGRPButton>
                    </div>
                  </div>
                </div>
              )}
              {hasActiveFilters && !showFilters && (
                <div className={cn(' mt-3 pt-3 border-t flex flex-wrap items-center gap-2 px-4')}>
                  <p className={cn(' text-xs text-muted-foreground')}>Filtros ativos:</p>
                  {statusFilter !== '' && (
                    <IGRPBadge
                      name={`status_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>
                        Estado:{' '}
                        {statusFilter === 'SUBMETIDA'
                          ? 'Submetida'
                          : statusFilter === 'VERIFICADA'
                            ? 'Verificada'
                            : statusFilter === 'PROCESSADA'
                              ? 'Processada'
                              : statusFilter === 'VALIDADA'
                                ? 'Validada'
                                : 'ENTREGUE'}
                      </span>
                      <IGRPButton
                        name={`status_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setStatusFilter('')}
                      ></IGRPButton>
                    </IGRPBadge>
                  )}
                  {periodoReferenciaFilter !== '' && (
                    <IGRPBadge
                      name={`periodo_ref_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>Mês de Referência: {periodoReferenciaFilter}</span>
                      <IGRPButton
                        name={`periodo_ref_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setPeriodoReferenciaFilter('')}
                      ></IGRPButton>
                    </IGRPBadge>
                  )}
                  <IGRPButton
                    name={`clear_active_filters_button`}
                    variant={`ghost`}
                    size={`sm`}
                    className={cn('h-6 px-2 text-xs text-muted-foreground hover:text-foreground')}
                    onClick={() => {
                      setResetFilters(true);
                      setStatusFilter('');
                      setPeriodoReferenciaFilter('');
                    }}
                  >
                    Limpar Todos
                  </IGRPButton>
                </div>
              )}
              <IGRPDataTable<Declaracao, Declaracao>
                showPagination={false}
                columns={[
                  {
                    header: ({ table }) => (
                      <IGRPDataTableHeaderRowsSelect table={table} title={``} />
                    ),
                    id: 'check',
                    cell: ({ row }) => {
                      return <IGRPDataTableCellCheckbox row={row}></IGRPDataTableCellCheckbox>;
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Mês de Referência`} />
                    ),
                    accessorKey: 'mesReferencia',
                    cell: ({ row }) => {
                      return row.getValue('mesReferencia');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle
                        column={column}
                        title={`Total de Remunerações`}
                      />
                    ),
                    accessorKey: 'totalRenumeracoes',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('totalRenumeracoes')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle
                        column={column}
                        title={`Total de Contribuições`}
                      />
                    ),
                    accessorKey: 'totalComparticipacao',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('totalComparticipacao')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Estado`} />
                    ),
                    accessorKey: 'estadoDeclaracao',
                    cell: ({ row }) => {
                      const rowData = row.original;

                      const { iconName, bgClass, textClass, label, className } =
                        getStatusBadge(rowData);

                      return (
                        <IGRPDataTableCellBadge
                          label={label ?? row.original.estadoDeclaracao}
                          variant={`soft`}
                          badgeClassName={`${bgClass} ${textClass} ${className}`}
                        ></IGRPDataTableCellBadge>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: 'Ações',
                    accessorKey: 'tbl_actions',
                    enableHiding: false,
                    cell: ({ row }) => {
                      const rowData = row.original;

                      return (
                        <IGRPDataTableRowAction>
                          <IGRPDataTableDropdownMenu
                            items={[
                              {
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Declarar`,
                                  icon: `FilePlus`,
                                  iconClassName: `text-blue-500`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Substituir FOS`,
                                  icon: `Replace`,
                                  iconClassName: `text-amber-500`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Corrigir FOS`,
                                  icon: `FileCog`,
                                  iconClassName: `text-red-500`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Gerar Cobrança`,
                                  icon: `CircleDollarSign`,
                                  iconClassName: `text-green-500`,
                                  showIcon: true,
                                },
                              },
                            ]}
                          ></IGRPDataTableDropdownMenu>
                        </IGRPDataTableRowAction>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                ]}
                clientFilters={[]}
                data={contentTabledelivery}
              />
            </IGRPCardContent>
          </IGRPCard>
        </div>
      </div>
      <Deliverymodalform
        isOpen={openDeliveryForm}
        setIsOpen={() => setOpenDeliveryForm(!openDeliveryForm)}
      ></Deliverymodalform>
    </div>
  );
}
