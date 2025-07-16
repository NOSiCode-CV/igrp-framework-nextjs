'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPOptionsProps } from '@igrp/igrp-framework-react-design-system';
import { DateRange } from '@igrp/igrp-framework-react-design-system';
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
  IGRPStatsCard,
  IGRPCard,
  IGRPCardContent,
  IGRPInputSearch,
  IGRPSelect,
  IGRPInputText,
  IGRPDatePickerRange,
  IGRPBadge,
  IGRPDataTable,
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellDate,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableRowAction,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuAlert,
} from '@igrp/igrp-framework-react-design-system';
import { Anexo } from '@/app/(myapp)/types/declaracao';
import { Declaracao } from '@/app/(myapp)/types/declaracao';
import { DeclaracaoFilter } from '@/app/(myapp)/types/declaracao';
import { PaginatedResponse } from '@/app/(myapp)/types/index';
import { UploadingState } from '@/app/(myapp)/types/index';
import { UploadingFiles } from '@/app/(myapp)/types/index';
import { ParameterizationOption } from '@/app/(myapp)/types/index';
import { router } from 'next/client';
import { DeclaracaoStatus } from '@/app/(myapp)/types/declaracao';
import { removeAccents } from '@/app/(myapp)/utils/utils';
import { fetchParameterization } from '@/app/(myapp)/actions/common';
import { fetchAny } from '@/app/(myapp)/actions/common';
import { fetchDeclaracoes } from '@/app/(myapp)/actions/declaracao';
import { getDeclaracaoByID } from '@/app/(myapp)/actions/declaracao';
import { getPeriodoOptions } from '@/app/(myapp)/actions/mock-actions';
import { useDeclaracao } from '@/app/(myapp)/hooks/use-declaracao';
import { useDeclaracaoParameterizations } from '@/app/(myapp)/hooks/use-parametrization';
import { IGRPLoadingSpinner } from '@igrp/igrp-framework-react-design-system';
import { useRouter } from 'next/navigation';

export default function PageDeclaracoesComponent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [totalContribuintes, setTotalContribuintes] = useState<number>(0);
  const [submetidaCount, setSubmetidaCount] = useState<number>(0);
  const [verificadaCount, setVerificadaCount] = useState<number>(0);
  const [processadaCount, setProcessadaCount] = useState<number>(0);
  const [validadaCount, setValidadaCount] = useState<number>(0);
  const [totalComparticipacao, setTotalComparticipacao] = useState<string>(`0 XOF`);
  const [filterValue, setFilterValue] = useState<string>(``);
  const [selectStatus_fltOptions, setSelectStatus_fltOptions] = useState<IGRPOptionsProps[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(``);
  const [nomeContribuinteFilter, setNomeContribuinteFilter] = useState<string>(``);
  const [selectPeriodo_ref_fltOptions, setSelectPeriodo_ref_fltOptions] = useState<
    IGRPOptionsProps[]
  >([]);
  const [periodoReferenciaFilter, setPeriodoReferenciaFilter] = useState<string>(``);
  const [nrContribuinteFilter, setNrContribuinteFilter] = useState<string>(``);
  const [nrProcessoFilter, setNrProcessoFilter] = useState<string>(``);
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [contentTabletable_declarations, setContentTabletable_declarations] = useState<
    Declaracao[]
  >([]);

  const [resetFilters, setResetFilters] = useState<boolean>(false);

  const [hasActiveFilters, setHasActiveFilters] = useState<boolean>(false);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const router = useRouter();

  function handleNovoClick(): void {
    router.push('/entregas');
  }

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
        bgClass = 'bg-blue-200';
        break;
      case DeclaracaoStatus.VERIFICADA:
        bgClass = 'bg-amber-200';
        break;
      case DeclaracaoStatus.PROCESSADA:
        bgClass = 'bg-gray-300';
        break;
      case DeclaracaoStatus.VALIDADA:
        bgClass = 'bg-green-200';
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

  function handleImportClick(): void {
    console.log('Handling Import');
  }

  function handleRefreshClick(): void {}

  const { data, stats, isLoading, error } = useDeclaracao({
    search: filterValue,
    estadoDeclaracao: statusFilter,
    nomeContribuinte: nomeContribuinteFilter,
    numeroContribuinte: nrContribuinteFilter,
    numeroProcesso: nrProcessoFilter,
    periodoReferencia: periodoReferenciaFilter,
    periodoEntrega: dateFilter,
  });

  const { declaracaoStatus, isLoading: isLoadingParams } = useDeclaracaoParameterizations();

  const loadStatusFltCombobox = async () => {
    setSelectStatus_fltOptions(declaracaoStatus || []);
  };

  useEffect(() => {
    if (isLoadingParams) return;
    loadStatusFltCombobox();
  }, [isLoadingParams]);

  useEffect(() => {
    if (!isLoading && data && data.content) {
      setContentTabletable_declarations(
        (data.content || []).map((item: any) => ({
          ...item,
        })),
      );
      setTotalContribuintes(stats?.total || 0);
      setSubmetidaCount(stats?.submetidos || 0);
      setVerificadaCount(stats?.verificados || 0);
      setProcessadaCount(stats?.processados || 0);
      setTotalComparticipacao(stats?.totalComparticipacao || 'F CFA -');
    }
  }, [isLoading, data, stats]);

  if (isLoading && !error) {
    return (
      <div className="flex items-center gap2 flex-col">
        <IGRPLoadingSpinner />
        <span> A carregar declarações...</span>
      </div>
    );
  }

  function handleVisualizarNavigation(row?: any): void {
    router.push(`/[locale]/declaracoes/${row.original.id}`);
  }

  return (
    <div className={cn('page')}>
      <div className={cn('flex', 'flex-col', ' h-full w-full')}>
        <IGRPPageHeader
          title={`Lista de FOS`}
          description={`Gerencie as declarações de FOS no sistema de segurança social`}
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
              onClick={handleNovoClick}
            >
              Novo
            </IGRPButton>
            <IGRPButton
              name={`button_quick_action`}
              size={`sm`}
              showIcon={true}
              iconName={`Plus`}
              onClick={() => setIsAddDialogOpen(true)}
            >
              Ação Rápida
            </IGRPButton>
          </div>
        </IGRPPageHeader>

        <div className={cn('grid', 'grid-cols-3 ', 'lg:grid-cols-3 ', ' gap-3 mb-4 px-6 w-full')}>
          <IGRPStatsCard
            name={`total_stat_box`}
            title={`Total Geral`}
            iconName={`Building`}
            showIcon={true}
            iconVariant={`secondary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`secondary`}
            value={totalContribuintes}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`submetida_stat_box`}
            title={`Total Submetidos`}
            iconName={`CloudUpload`}
            showIcon={true}
            iconVariant={`info`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`info`}
            value={submetidaCount}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`verificada_stat_box`}
            title={`Total Verificados`}
            iconName={`SearchCheck`}
            showIcon={true}
            iconVariant={`warning`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`warning`}
            value={verificadaCount}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`processada_stat_box`}
            title={`Total Processados`}
            iconName={`Loader`}
            showIcon={true}
            iconVariant={`primary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`primary`}
            value={processadaCount}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`validada_stat_box`}
            title={`Total Validados`}
            iconName={`CircleCheck`}
            showIcon={true}
            iconVariant={`success`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`success`}
            value={validadaCount}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`total_compart_stat_box`}
            title={`Total Comparticipação`}
            iconName={`Users`}
            showIcon={true}
            iconVariant={`indigo`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`indigo`}
            value={totalComparticipacao}
          ></IGRPStatsCard>
        </div>
        <div className={cn('flex', 'flex-1', ' px-6 pb-6 w-full')}>
          <IGRPCard name={`main_content_card`} className={cn('shadow-sm w-full')}>
            <IGRPCardContent className={cn('p4 border-b bg-white')}>
              <div className={cn('flex', 'flex-wrap', ' items-center gap-3  px-4')}>
                <div className={cn(' relative flex-1 min-w-[240px]')}>
                  <IGRPInputSearch
                    name={`search_input_text`}
                    showSubmitButton={false}
                    showStartIcon={true}
                    placeholder={`Pesquisar contribuintes...`}
                    required={false}
                    setValueChange={(value) => setFilterValue(value)}
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
                      {(statusFilter !== '' ? 1 : 0) +
                        (nrProcessoFilter !== '' ? 1 : 0) +
                        (dateFilter !== undefined ? 1 : 0) +
                        (nrContribuinteFilter !== '' ? 1 : 0) +
                        (nomeContribuinteFilter !== '' ? 1 : 0) +
                        (periodoReferenciaFilter !== '' ? 1 : 0)}
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
                    Exportar declarações
                  </IGRPButton>
                  <IGRPButton
                    name={`button_import`}
                    size={`icon`}
                    variant={`outline`}
                    iconName={`Upload`}
                    className={cn('h-10 w-10')}
                    onClick={handleImportClick}
                  >
                    Importar declarações
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
                        name={`status_flt`}
                        label={`Estado`}
                        placeholder={`Todos Estados`}
                        onValueChange={setStatusFilter}
                        options={selectStatus_fltOptions}
                        value={statusFilter}
                      ></IGRPSelect>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPInputText
                        name={`nome_contribuinte_flt`}
                        label={`Nome de Contribuinte`}
                        onChange={(e) => setNomeContribuinteFilter(e.target.value)}
                        value={nomeContribuinteFilter}
                      ></IGRPInputText>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPSelect
                        name={`periodo_ref_flt`}
                        label={`Período de Referência`}
                        placeholder={`Todos Períodos`}
                        showSearch={true}
                        onValueChange={(e) => setPeriodoReferenciaFilter(e)}
                        options={selectPeriodo_ref_fltOptions}
                        value={periodoReferenciaFilter}
                      ></IGRPSelect>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPInputText
                        name={`nr_contribuinte_flt`}
                        label={`Nº de Contribuinte`}
                        onChange={(e) => setNrContribuinteFilter(e.target.value)}
                        value={nrContribuinteFilter}
                      ></IGRPInputText>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPInputText
                        name={`nr_processo_flt`}
                        label={`Nº de Processo`}
                        onChange={(e) => setNrProcessoFilter(e.target.value)}
                        value={nrProcessoFilter}
                      ></IGRPInputText>
                    </div>
                    <div className={cn(' space-y-1 min-w-[160px]')}>
                      <IGRPDatePickerRange
                        placeholder={`Escolha uma data`}
                        name={`date_flt`}
                        id={`date_flt`}
                        label={`Período de Entrega`}
                        className={cn()}
                        onDateChange={setDateFilter}
                      />
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
                          setNrContribuinteFilter('');
                          setNrProcessoFilter('');
                          setNomeContribuinteFilter('');
                          setDateFilter(undefined);
                          setFilterValue('');
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
                  {nrContribuinteFilter !== '' && (
                    <IGRPBadge
                      name={`nr_contr_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>Nº Contribuinte: {nrContribuinteFilter}</span>
                      <IGRPButton
                        name={`nr_contr_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setNrContribuinteFilter('')}
                      ></IGRPButton>
                    </IGRPBadge>
                  )}
                  {nomeContribuinteFilter !== '' && (
                    <IGRPBadge
                      name={`nome_contr_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>Nome Contribuinte: {nomeContribuinteFilter}</span>
                      <IGRPButton
                        name={`nome_contr_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setNomeContribuinteFilter('')}
                      ></IGRPButton>
                    </IGRPBadge>
                  )}
                  {nrProcessoFilter !== '' && (
                    <IGRPBadge
                      name={`nr_processo_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>Nº Processo: {nrContribuinteFilter}</span>
                      <IGRPButton
                        name={`nr_processo_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setNrProcessoFilter('')}
                      ></IGRPButton>
                    </IGRPBadge>
                  )}
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
                                : 'Desconhecido'}
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
                  {dateFilter !== undefined && (
                    <IGRPBadge
                      name={`date_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={cn('px-2 py-1 h-6')}
                    >
                      <span className={cn()}>
                        Período de Entrega:{' '}
                        {dateFilter.from?.toISOString().split('T')[0] ?? 'sempre'} a{' '}
                        {dateFilter.to?.toISOString().split('T')[0] ?? 'hoje'}
                      </span>
                      <IGRPButton
                        name={`date_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setDateFilter(undefined)}
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
                      setNrContribuinteFilter('');
                      setNrProcessoFilter('');
                      setNomeContribuinteFilter('');
                      setDateFilter(undefined);
                      setFilterValue('');
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
                      <IGRPDataTableHeaderSortToggle column={column} title={`Nº de Contribuinte`} />
                    ),
                    accessorKey: 'numeroContribuinte',
                    cell: ({ row }) => {
                      return row.getValue('numeroContribuinte');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle
                        column={column}
                        title={`Nome de Contribuinte`}
                      />
                    ),
                    accessorKey: 'nomeContribuinte',
                    cell: ({ row }) => {
                      return row.getValue('nomeContribuinte');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Nº de Processo`} />
                    ),
                    accessorKey: 'processoId',
                    cell: ({ row }) => {
                      return row.getValue('processoId');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle
                        column={column}
                        title={`Período de Referência`}
                      />
                    ),
                    accessorKey: 'mesReferencia',
                    cell: ({ row }) => {
                      return row.getValue('mesReferencia');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Data de Entrega`} />
                    ),
                    accessorKey: 'data',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellDate date={row.getValue('data')}></IGRPDataTableCellDate>
                      );
                    },
                    filterFn: IGRPDataTableDateRangeFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle
                        column={column}
                        title={`Total Comparticipação`}
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
                    header: 'Actions',
                    accessorKey: 'tbl_actions',
                    enableHiding: false,
                    cell: ({ row }) => {
                      const rowData = row.original;

                      return (
                        <IGRPDataTableRowAction>
                          <IGRPDataTableDropdownMenu
                            items={[
                              {
                                component: IGRPDataTableDropdownMenuLink,
                                props: {
                                  labelTrigger: `Visualizar`,
                                  icon: `Search`,
                                  showIcon: true,
                                  action: () => handleVisualizarNavigation(row),
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Contas`,
                                  icon: `DollarSign`,
                                  iconClassName: `text-amber-500`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuAlert,
                                props: {
                                  labelTrigger: `Validar`,
                                  icon: `Check`,
                                  iconClassName: `text-green-500`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuLink,
                                props: {
                                  labelTrigger: `Declaração`,
                                  icon: `FileText`,
                                  href: `https://igrp.cv/`,
                                  showIcon: true,
                                },
                              },
                              {
                                component: IGRPDataTableDropdownMenuAlert,
                                props: {
                                  labelTrigger: `Imprimir`,
                                  icon: `Printer`,
                                  iconClassName: `text-grey-500`,
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
                data={contentTabletable_declarations}
              />
            </IGRPCardContent>
          </IGRPCard>
        </div>
      </div>
    </div>
  );
}
