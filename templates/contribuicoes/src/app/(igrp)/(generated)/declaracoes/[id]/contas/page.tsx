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
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableRowAction,
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuLink,
} from '@igrp/igrp-framework-react-design-system';
import { CurrentAccount } from '@/app/(myapp)/data/types';
import { CurrentAccountResponse } from '@/app/(myapp)/data/types';
import { router } from 'next/client';
import { removeAccents } from '@/app/(myapp)/utils/utils';
import { getCurrentAccountList } from '@/app/(myapp)/actions/mock-actions';

export default function PageContasComponent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [totalMovement, setTotalMovement] = useState<string>(`F CFA 0`);
  const [totalDeclared, setTotalDeclared] = useState<string>(`F CFA 0`);
  const [totalCalculated, setTotalCalculated] = useState<string>(`F CFA 0`);
  const [totalPaid, setTotalPaid] = useState<string>(`F CFA 0`);
  const [filterValue, setFilterValue] = useState<string>(``);
  const [selectStatus_fltOptions, setSelectStatus_fltOptions] = useState<IGRPOptionsProps[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(``);
  const [nomeContribuinteFilter, setNomeContribuinteFilter] = useState<string>(``);
  const [referenceMonthFilter, setReferenceMonthFilter] = useState<string>(``);
  const [nrContribuinteFilter, setNrContribuinteFilter] = useState<string>(``);
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const [contentTabletable_current_account, setContentTabletable_current_account] = useState<
    CurrentAccount[]
  >([]);

  const [resetFilters, setResetFilters] = useState<boolean>(false);

  const [hasActiveFilters, setHasActiveFilters] = useState<boolean>(false);

  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  function handleNovoClick(): void {
    router.push('/contas/nova-conta');
  }

  function getStatusBadge(value: CurrentAccount): {
    iconName?: string;
    bgClass?: string;
    textClass?: string;
    label?: string;
    className?: string;
  } {
    if (!value) return {};
    const status = value.status;
    const label = status;
    const bgClass =
      status === 'Pendente'
        ? 'bg-yellow-200'
        : status === 'Pago'
          ? 'bg-green-200'
          : status === 'Atrasado'
            ? 'bg-red-200'
            : 'bg-gray-200';

    return { label, bgClass };
  }

  function handleDownloadClick(): void {
    console.log('Handling Download');
  }

  function handleRefreshClick(): void {
    updateTabletable_current_account();
  }

  useEffect(() => {
    updateTabletable_current_account();
    loadStatusFltCombobox();
  }, [
    statusFilter,
    dateFilter,
    filterValue,
    nrContribuinteFilter,
    nomeContribuinteFilter,
    referenceMonthFilter,
  ]);

  const updateTabletable_current_account = async () => {
    let data: CurrentAccount[] = (await getCurrentAccountList()).data;

    setHasActiveFilters(false);

    if (filterValue) {
      data = data.filter((it) =>
        removeAccents(it.taxpayerName)
          .toLowerCase()
          .includes(removeAccents(filterValue).toLowerCase()),
      );
      setHasActiveFilters(true);
    }

    if (nomeContribuinteFilter) {
      data = data.filter((it) =>
        removeAccents(it.taxpayerName)
          .toLowerCase()
          .includes(removeAccents(nomeContribuinteFilter).toLowerCase()),
      );
      setHasActiveFilters(true);
    }

    if (referenceMonthFilter) {
      data = data.filter((it) => it.referenceMonth === referenceMonthFilter);
      setHasActiveFilters(true);
    }

    if (nrContribuinteFilter) {
      data = data.filter((it) => it.taxpayerNumber === nrContribuinteFilter);
      setHasActiveFilters(true);
    }

    if (statusFilter) {
      data = data.filter((it) => it.status === statusFilter);
      setHasActiveFilters(true);
    }

    if (dateFilter) {
      // Date filtering logic would go here if needed
      setHasActiveFilters(true);
    }

    setContentTabletable_current_account(data);

    // Update stats
    setTotalMovement(`F CFA ${data.reduce((sum, c) => sum + (c.movement || 0), 0)}`);
    setTotalDeclared(`F CFA ${data.reduce((sum, c) => sum + (c.declared || 0), 0)}`);
    setTotalCalculated(`F CFA ${data.reduce((sum, c) => sum + (c.calculated || 0), 0)}`);
    setTotalPaid(`F CFA ${data.reduce((sum, c) => sum + (c.paid || 0), 0)}`);
  };

  const loadStatusFltCombobox = async () => {
    setSelectStatus_fltOptions([
      { value: 'Pendente', label: 'Pendente' },
      { value: 'Pago', label: 'Pago' },
      { value: 'Atrasado', label: 'Atrasado' },
    ]);
  };

  return (
    <div className={cn('page')}>
      <div className={cn('flex', 'flex-col', ' h-full w-full')}>
        <IGRPPageHeader
          title={`Lista de Conta Corrente`}
          description={`Gerencie as contas correntes no sistema de segurança social`}
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

        <div
          className={cn(
            'grid',
            'grid-cols-4',
            ' sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 px-6 w-full',
          )}
        >
          <IGRPStatsCard
            name={`movement_stat_box`}
            title={`Total Movimento`}
            iconName={`ArrowUpDown`}
            showIcon={true}
            iconVariant={`primary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`primary`}
            value={totalMovement}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`declared_stat_box`}
            title={`Total Declarado`}
            iconName={`FileText`}
            showIcon={true}
            iconVariant={`secondary`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`secondary`}
            value={totalDeclared}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`calculated_stat_box`}
            title={`Total Apurado`}
            iconName={`Calculator`}
            showIcon={true}
            iconVariant={`success`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`success`}
            value={totalCalculated}
          ></IGRPStatsCard>
          <IGRPStatsCard
            name={`paid_stat_box`}
            title={`Total Pago`}
            iconName={`Banknote`}
            showIcon={true}
            iconVariant={`warning`}
            cardBorder={`rounded-xl`}
            cardBorderPosition={`top`}
            cardVariant={`warning`}
            value={totalPaid}
          ></IGRPStatsCard>
        </div>
        <div className={cn('flex', 'flex-1', ' px-6 pb-6 w-full')}>
          <IGRPCard name={`main_content_card`} className={cn('shadow-sm w-full')}>
            <IGRPCardContent className={cn('p4 border-b bg-white')}>
              <div className={cn('flex', 'flex-wrap', ' items-center gap-3  px-4')}>
                <div className={cn('section', ' relative flex-1 min-w-[240px]')}>
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
                        (referenceMonthFilter !== '' ? 1 : 0) +
                        (nrContribuinteFilter !== '' ? 1 : 0) +
                        (nomeContribuinteFilter !== '' ? 1 : 0)}
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
                    Exportar contas
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
                      <IGRPInputText
                        name={`reference_month_flt`}
                        label={`Mês de Referência`}
                        onChange={(e) => setReferenceMonthFilter(e.target.value)}
                        value={referenceMonthFilter}
                      ></IGRPInputText>
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
                          setReferenceMonthFilter('');
                          setNrContribuinteFilter('');
                          setNomeContribuinteFilter('');
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
                      badgeClassName={`px-2 py-1 h-6`}
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
                      badgeClassName={`px-2 py-1 h-6`}
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
                  {statusFilter !== '' && (
                    <IGRPBadge
                      name={`status_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={`px-2 py-1 h-6`}
                    >
                      <span className={cn()}>
                        Estado:{' '}
                        {statusFilter === 'PAGO'
                          ? 'Pago'
                          : statusFilter === 'PENDENTE'
                            ? 'Pendente'
                            : statusFilter === 'ATRASADO'
                              ? 'Atrasado'
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
                  {referenceMonthFilter !== '' && (
                    <IGRPBadge
                      name={`periodo_ref_active_filter_badge`}
                      variant={`soft`}
                      badgeClassName={`px-2 py-1 h-6`}
                    >
                      <span className={cn()}>Mês de Referência: {referenceMonthFilter}</span>
                      <IGRPButton
                        name={`periodo_ref_active_filters_button`}
                        variant={`ghost`}
                        size={`icon`}
                        showIcon={true}
                        iconName={`X`}
                        iconClassName={`h-3 w-3`}
                        className={cn('ml-1 hover:text-destructive')}
                        onClick={() => setReferenceMonthFilter('')}
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
                      setReferenceMonthFilter('');
                      setNrContribuinteFilter('');
                      setNomeContribuinteFilter('');
                      setFilterValue('');
                    }}
                  >
                    Limpar Todos
                  </IGRPButton>
                </div>
              )}
              <IGRPDataTable<CurrentAccount, CurrentAccount>
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
                    accessorKey: 'taxpayerNumber',
                    cell: ({ row }) => {
                      return row.getValue('taxpayerNumber');
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
                    accessorKey: 'taxpayerName',
                    cell: ({ row }) => {
                      return row.getValue('taxpayerName');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Mês de Referência`} />
                    ),
                    accessorKey: 'referenceMonth',
                    cell: ({ row }) => {
                      return row.getValue('referenceMonth');
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Movimento`} />
                    ),
                    accessorKey: 'movement',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('movement')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Declarado`} />
                    ),
                    accessorKey: 'declared',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('declared')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Apurado`} />
                    ),
                    accessorKey: 'calculated',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('calculated')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Pago`} />
                    ),
                    accessorKey: 'paid',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('paid')}
                          currency={`XOF`}
                        ></IGRPDataTableCellAmount>
                      );
                    },
                    filterFn: IGRPDataTableFacetedFilterFn,
                  },
                  {
                    header: ({ column }) => (
                      <IGRPDataTableHeaderSortToggle column={column} title={`Diferença`} />
                    ),
                    accessorKey: 'difference',
                    cell: ({ row }) => {
                      return (
                        <IGRPDataTableCellAmount
                          field={row.getValue('difference')}
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
                    accessorKey: 'status',
                    cell: ({ row }) => {
                      const rowData = row.original;

                      const { iconName, bgClass, textClass, label, className } =
                        getStatusBadge(rowData);

                      return (
                        <IGRPDataTableCellBadge
                          label={label ?? row.original.status}
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
                                component: IGRPDataTableDropdownMenuCustom,
                                props: {
                                  labelTrigger: `Visualizar`,
                                  icon: `Search`,
                                  showIcon: true,
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
                data={contentTabletable_current_account}
              />
            </IGRPCardContent>
          </IGRPCard>
        </div>
      </div>
    </div>
  );
}
