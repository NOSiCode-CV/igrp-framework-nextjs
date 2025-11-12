'use client'

/* THIS FILE WAS GENERATED AUTOMATICALLY BY iGRP STUDIO. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { use, useState, useEffect, useRef } from 'react';
import { cn, useIGRPMenuNavigation, useIGRPToast } from '@igrp/igrp-framework-react-design-system';
import { IGRPDataTableFacetedFilterFn , IGRPDataTableDateRangeFilterFn } from "@igrp/igrp-framework-react-design-system";
import { IGRPDataTableHeaderSortToggle, IGRPDataTableHeaderSortDropdown, IGRPDataTableHeaderRowsSelect } from "@igrp/igrp-framework-react-design-system";
import {Progress} from '@/app/(myapp)/components/progress'
import { 
  IGRPIcon,
	IGRPText,
	IGRPDataTable,
	IGRPDataTableCellBadge,
	IGRPDataTableRowAction,
	IGRPDataTableButtonLink 
} from "@igrp/igrp-framework-react-design-system";
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { useMembersTableStore} from '@/app/(myapp)/store/store'
import {getMembers} from '@/app/(myapp)/functions/members'
import {getCountryAndOrgsById} from '@/app/(myapp)/functions/countries-orgs'
import { ApiError } from '@/app/(myapp)/utils/api-client'

export default function Memberlist({ orgId } : { orgId: string }) {

  
  type Table1 = {
    id: number;
    alert: string;
    country: string;
    diplomatic_relations: string;
    comments: string;
}

  
  const [contentTabletable1, setContentTabletable1] = useState<Table1[]>([]);
  
const [loading, setLoading] = useState<boolean>(true);

const [showTablePagination, setShowTablePagination] = useState<boolean>(true);

const [orgName, setOrgName] = useState<string>('');

const { igrpToast } = useIGRPToast()

function getStatusColor (data: any): any {

  
const color = () => {
  switch (data.alert) {
    case "1":
      return 'bg-red-100 text-red-800';
    case "2":
      return 'bg-orange-100 text-orange-800';
    case "3":
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};

const labelText = () => {
  switch (data.alert) {
    case "1":
      return 'Máxima';
    case "2":
      return 'Média';
    case "3":
      return 'Baixa';
    default:
      return 'Sem alerta';
  }
};

  return {
    label: labelText(),
    bgClass: color(),
    textClass: '',
    className: '',
    iconName: '',
  };

}

const addData = useMembersTableStore((state) => state.addData);
const data = useMembersTableStore((state) => state.data);

useEffect(() => {
  const fetchData = async () => {
    try {
      const params = {
      organizationId: +orgId, 
      countryName:undefined,
      alertLevel: undefined,
      
    }
      const res = await getMembers("O", params);
      const org = await getCountryAndOrgsById("O", orgId);

      if (res && org) {
        setOrgName(org.name);
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

  fetchData();
}, [orgId, addData]);


useEffect(() => {
  if(data) {
    const tableData = data.content.map((item) => ({
      id: item.id,
      alert: item.alertLevel,
      country: item.countryGeographyName,
      diplomatic_relations: `${item.relationStartDate}, ${item.statusDescription}`,
      comments: item.note
    }));

     setContentTabletable1(tableData);
     setLoading(false);

  }
},[data])


  return (
<div className={ cn('component','block',)}    >
	{ !loading && (<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','border border-none border-[#000000]',)}    >
	<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-start gap-2',)}    >
	<IGRPIcon
  name={ `icon1` }
  iconName={ `Landmark` }
size={ `14` }
  className={ cn('',) }
  
  
>
</IGRPIcon>
<IGRPText
  name={ `text1` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('mb-0','font-inter text-[13px] leading-6 tracking-0 word-spacing-0 text-left font-semibold not-italic no-underline normal-case',) }
  
  
>
  Organização Internacional:
</IGRPText>
<IGRPText
  name={ `text2` }
  variant={ `primary` }
weight={ `normal` }
size={ `default` }
align={ `left` }
spacing={ `normal` }
maxLines={ 3 }
  className={ cn('mb-0','font-inter text-[13px] leading-6 tracking-0 word-spacing-0 text-left font-normal not-italic no-underline normal-case',) }
  
  
>
  { orgName }
</IGRPText></div>
<IGRPDataTable<Table1, Table1>
  className={ cn() }
  columns={
    [
        {
          header: 'Alerta'
,accessorKey: 'alert',
          cell: ({ row }) => {
          const rowData = row.original;

const { iconName, bgClass, textClass, label, className } = getStatusColor(rowData);

return <IGRPDataTableCellBadge
  label={ label ?? row.original.alert }
  variant={ `soft` }
badgeClassName={ `${bgClass} ${textClass} ${className}` }
>

</IGRPDataTableCellBadge>
          },
          filterFn: IGRPDataTableFacetedFilterFn
        },
        {
          header: 'Pais'
,accessorKey: 'country',
          cell: ({ row }) => {
          return row.getValue("country")
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
          header: 'Observações'
,accessorKey: 'comments',
          cell: ({ row }) => {
          return row.getValue("comments")
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
  href={ `/gestao-organizacoes/${orgId}/membros/${row.original.id}/editar` }
  variant={ `default` }
  icon={ `Pen` }
  className={ cn('size-7',) }
  action={ () => {} }
>
</IGRPDataTableButtonLink>
  <IGRPDataTableButtonLink
  labelTrigger={ `Desativar` }
  href={ `/gestao-organizacoes/${orgId}/membros/${row.original.id}/desativar` }
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