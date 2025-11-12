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
  IGRPDataTable,
	IGRPDataTableCellBadge,
	IGRPDataTableRowAction,
	IGRPDataTableButtonLink 
} from "@igrp/igrp-framework-react-design-system";
import {getCountryAndOrgs} from '@/app/(myapp)/functions/countries-orgs'
import { useCountryTableStore} from '@/app/(myapp)/store/store'
import { ApiError } from '@/app/(myapp)/utils/api-client'

export default function Countrylist() {

  
  type Table2 = {
    id: number;
    alert: string;
    country: string;
    designation: string;
    geo_area: string;
    diplomatic_relations: string;
    comments: string;
}

  
  const [contentTabletable2, setContentTabletable2] = useState<Table2[]>([]);
  
const [loading, setLoading] = useState<boolean>(true);

const [showTablePagination, setShowTablePagination] = useState<boolean>(true);

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

const addData = useCountryTableStore((state) => state.addData);
const data = useCountryTableStore((state) => state.data);

useEffect(() => {
     const fetchData = async () => {
      try {
       
        const res = await getCountryAndOrgs("P");
   

        if(res && contentTabletable2.length === 0) {
        
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

},[contentTabletable2])


useEffect(() => {
  if(data) {
    const tableData = data.content.map((item) => ({
      id: item.id,
      alert: item.alertLevel,
      country: item.geographyName,
      designation: item.name,
      geo_area: item.geographicalAreaDescription,
      diplomatic_relations: `${item.relationStartDate}, ${item.statusDescription}`,
      comments: item.note
    }));

     setContentTabletable2(tableData);
     setLoading(false);

  }
},[data])


  return (
<div className={ cn('component',)}    >
	{ !loading && (<div className={ cn('flex','flex flex-col flex-nowrap items-stretch justify-start gap-2','border border-none border-[#000000]',)}    >
	<IGRPDataTable<Table2, Table2>
  tableClassName={ `border border-solid border-[#E0E0E0] rounded-xl` }
  className={ cn('',) }
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
          header: 'Pais '
,accessorKey: 'country',
          cell: ({ row }) => {
          return row.getValue("country")
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
          header: 'Área Geográfica'
,accessorKey: 'geo_area',
          cell: ({ row }) => {
          return row.getValue("geo_area")
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
          id: 'tableActionListCell2',
          enableHiding: false,cell: ({ row }) => {
          const rowData = row.original;

return (
<IGRPDataTableRowAction>
  <IGRPDataTableButtonLink
  labelTrigger={ `Editar` }
  href={ `/gestao-paises/editar/${row?.original.id}` }
  variant={ `default` }
  icon={ `Pen` }
  className={ cn('size-7',) }
  action={ () => {} }
>
</IGRPDataTableButtonLink>
  <IGRPDataTableButtonLink
  labelTrigger={ `Desativar` }
  href={ `/gestao-paises/desativar/${row?.original.id}` }
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
  
  data={ contentTabletable2 }
showPagination={ showTablePagination }
/></div>)}
{ loading && (<div className={ cn('flex','flex flex-row flex-nowrap items-center justify-center gap-2',)}    >
	<Progress    ></Progress></div>)}</div>
  );
}
