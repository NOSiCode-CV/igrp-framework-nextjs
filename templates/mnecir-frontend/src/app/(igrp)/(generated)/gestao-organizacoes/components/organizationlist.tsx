'use client';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
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
import { Progress } from '@/app/(myapp)/components/progress';
import {
  IGRPDataTable,
	IGRPDataTableRowAction,
	IGRPDataTableButtonLink 
} from "@igrp/igrp-framework-react-design-system";
import {getMembers} from '@/app/(myapp)/functions/members'
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { useOrgsTableStore} from '@/app/(myapp)/store/store'
import { ApiError } from '@/app/(myapp)/utils/api-client'
import {PaginatedCountryOrgResponse} from '@/app/(myapp)/types/country'

export default function Organizationlist() {

  
  type Table1 = {
    id: number;
    organization: string;
    designation: string;
    diplomatic_relations: string;
    members_count: number;
    notes: string;
}

  
  const [contentTabletable1, setContentTabletable1] = useState<Table1[]>([]);
  
const [loading, setLoading] = useState<boolean>(true);

const [showTablePagination, setShowTablePagination] = useState<boolean>(true);

const { igrpToast } = useIGRPToast()

async function countMembers (orgId: number): Promise<number> {

  const params = {
    organizationId: orgId, 
    countryName:undefined,
    alertLevel: undefined,
    
  }
const res = await getMembers("O", params);

if(res.totalElements) {
  return res.totalElements;
}

return 0;

}

const addData = useOrgsTableStore((state) => state.addData);
const data = useOrgsTableStore((state) => state.data);

useEffect(() => {
     const fetchData = async () => {
      try {
       
        const res = await getCountryAndOrgs("O");

        if(res) {
        
          addData(res);
        
        }
      
      } catch (err) {
        const error = err as ApiError;

        const message =
         error.message ||
          'Unexpected error occurred';

        igrpToast({
          type: 'error',
          title: `Erro ${error.status}`,
          description: message,
        });
      }
    };

    if(contentTabletable1.length === 0) {

    fetchData();
    }


},[])


useEffect(() => {

  const fecthOrgData = async (data: PaginatedCountryOrgResponse) => {
   
     const tableData = await Promise.all(
        data.content.map(async (item) => ({
          id: item.id,
          organization: item.acronym,
          designation: item.name,
          diplomatic_relations: `${item.relationStartDate}, ${item.statusDescription}`,
          notes: item.note,
          members_count: await countMembers(+item.id),
        }))
      );

     setContentTabletable1(tableData);

     setLoading(false);
  }
  if(data) {
   fecthOrgData(data);

  }
},[data])





  return (
<div className={ cn('component',)}    >
	{ !loading && (<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2',)}    >
	<IGRPDataTable<Table1, Table1>
  className={ cn() }
  columns={
    [
        {
          header: 'Org. Internacional'
,accessorKey: 'organization',
          cell: ({ row }) => {
          return row.getValue("organization")
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          header: 'Designação'
,accessorKey: 'designation',
          cell: ({ row }) => {
          return row.getValue("designation")
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          header: 'Inicio Relação Diplomática'
,accessorKey: 'diplomatic_relations',
          cell: ({ row }) => {
          return row.getValue("diplomatic_relations")
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          header: 'Membros'
,accessorKey: 'members_count',
          cell: ({ row }) => {
          return row.getValue("members_count")
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          header: 'Observações'
,accessorKey: 'notes',
          cell: ({ row }) => {
          return row.getValue("notes")
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          id: 'tableActionListCell1',
          enableHiding: false,cell: ({ row }) => {
          const rowData = row.original;

return (
<IGRPDataTableRowAction>
  <IGRPDataTableButtonLink
  labelTrigger={ `Editar` }
  href={ `/gestao-organizacoes/editar/${row?.original.id}` }
  variant={ `default` }
  icon={ `Pen` }
  className={ cn('size-7',) }
  action={ () => {} }
>
</IGRPDataTableButtonLink>
  <IGRPDataTableButtonLink
  labelTrigger={ `Páise Membros` }
  href={ `/gestao-organizacoes/${row?.original.id}/membros` }
  variant={ `default` }
  icon={ `Handshake` }
  className={ cn('size-7',) }
  action={ () => {} }
>
</IGRPDataTableButtonLink>
  <IGRPDataTableButtonLink
  labelTrigger={ `Desativar` }
  href={ `/gestao-organizacoes/desativar/${row?.original.id}` }
  variant={ `default` }
  icon={ `ToggleRight` }
  className={ cn('size-7',) }
  action={ () => {} }
>
</IGRPDataTableButtonLink>
</IGRPDataTableRowAction>
);
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
]
  }
  clientFilters={
    [
    ]
  }
  
  data={ contentTabletable1 }
showPagination={ showTablePagination }
/></div>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
