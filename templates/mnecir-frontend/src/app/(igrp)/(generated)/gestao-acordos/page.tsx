'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import AccordFilterBar from '@/app/(igrp)/(generated)/gestao-acordos/components/accordfilterbar';
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
  IGRPDataTable,
  IGRPDataTableCellDate,
  IGRPDataTableRowAction,
  IGRPDataTableButtonLink,
} from '@igrp/igrp-framework-react-design-system';
import { useGetAccords } from '@/app/(myapp)/hooks/accords-management';
import { useRouter } from 'next/navigation';

export default function PageAccordmanagementComponent() {

  const router = useRouter();
  
  type Table1 = {
    countryOrganizationName: string;
    type: string;
    title: string;
    signatureDat: string;
    needRatification: string;
    id: number;
    domain: string;
    phase: string;
    nature: string;
    boPublicationDate: string;
    statusDescription: string;
  };

  const [contentTabletable1, setContentTabletable1] = useState<Table1[]>([]);

  const [openFilter, setOpenFilter] = useState<boolean>(false);

  const [accordFilters, setAccordFilters] = useState<any>(undefined);

  const { igrpToast } = useIGRPToast();

  const { data, isLoading, error } = useGetAccords(accordFilters);
  useEffect(() => {
    if (!data?.content || isLoading) return;
    setContentTabletable1(data.content as any);
  }, [isLoading, data]);

  function goToaccordManagementNovo(row?: any): void {
    router.push(`/gestao-acordos/novo`);
  }

  return (
    <div className={cn('page', 'space-y-6')}>
      <div className={cn('section', ' space-y-6')}>
        <IGRPPageHeader
          name={`pageHeader1`}
          title={`Gestão de Acordos, Convenções e Tratados`}
          iconBackButton={`ArrowLeft`}
          variant={`h3`}
        >
          <div className="flex items-center gap-2">
            <IGRPButton
              name={`button2`}
              variant={`outline`}
              size={`default`}
              showIcon={true}
              iconName={`ListFilter`}
              className={cn()}
              onClick={() => {
                setOpenFilter(!openFilter);
              }}
            >
              Filtros
            </IGRPButton>
            <IGRPButton
              name={`button1`}
              variant={`default`}
              size={`sm`}
              showIcon={true}
              iconName={`Plus`}
              className={cn(
                '',
                'font-inter text-base leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',
              )}
              onClick={() => goToaccordManagementNovo()}
            >
              Novo
            </IGRPButton>
          </div>
        </IGRPPageHeader>

        {openFilter && (
          <div className={cn()}>
            <AccordFilterBar
              onSubmitFilter={(values) => setAccordFilters(values)}
            ></AccordFilterBar>
          </div>
        )}
        <IGRPDataTable<Table1, Table1>
          columns={[
            {
              header: 'País/ Organização Internacional',
              accessorKey: 'countryOrganizationName',
              cell: ({ row }) => {
                return row.getValue('countryOrganizationName');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Tipo',
              accessorKey: 'type',
              cell: ({ row }) => {
                return row.getValue('type');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Título',
              accessorKey: 'title',
              cell: ({ row }) => {
                return row.getValue('title');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Data de assinatura',
              accessorKey: 'signatureDat',
              cell: ({ row }) => {
                return (
                  <IGRPDataTableCellDate
                    date={row.getValue('signatureDat')}
                    dateFormat={`dd/MM/YYYY`}
                  ></IGRPDataTableCellDate>
                );
              },
              filterFn: IGRPDataTableDateRangeFilterFn,
            },
            {
              header: 'Exige Ratificação',
              accessorKey: 'needRatification',
              cell: ({ row }) => {
                return row.getValue('needRatification');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Dominio',
              accessorKey: 'domain',
              cell: ({ row }) => {
                return row.getValue('domain');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Fase',
              accessorKey: 'phase',
              cell: ({ row }) => {
                return row.getValue('phase');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Natureza',
              accessorKey: 'nature',
              cell: ({ row }) => {
                return row.getValue('nature');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Data publicação BO',
              accessorKey: 'boPublicationDate',
              cell: ({ row }) => {
                return row.getValue('boPublicationDate');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              header: 'Estado',
              accessorKey: 'statusDescription',
              cell: ({ row }) => {
                return row.getValue('statusDescription');
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
            {
              id: 'tableActionListCell2',
              enableHiding: false,
              cell: ({ row }) => {
                const rowData = row.original;

                return (
                  <IGRPDataTableRowAction>
                    <IGRPDataTableButtonLink
                      labelTrigger={`Editar`}
                      href={`/gestao-acordos/${row.original.id}/editar`}
                      variant={`outline`}
                      icon={`TestTubeDiagonal`}
                      className={cn()}
                      action={() => {}}
                    ></IGRPDataTableButtonLink>
                    <IGRPDataTableButtonLink
                      labelTrigger={`Desativar`}
                      href={`/gestao-acordos/desativar/${row?.original.id}`}
                      variant={`default`}
                      icon={`CircleOff`}
                      className={cn()}
                      action={() => {}}
                    ></IGRPDataTableButtonLink>
                  </IGRPDataTableRowAction>
                );
              },
              filterFn: IGRPDataTableFacetedFilterFn,
            },
          ]}
          clientFilters={[]}
          data={contentTabletable1}
        />
      </div>
    </div>
  );
}
