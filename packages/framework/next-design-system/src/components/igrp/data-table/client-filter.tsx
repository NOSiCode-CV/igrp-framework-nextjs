'use client';

import { Fragment, type JSX, useEffect, useState } from 'react';
import { type Column, type Table } from '@tanstack/react-table';

import { IGRPButton } from '@/components/igrp/button';

interface IGRPDataTableClientFilterListProps<TData> {
  columnId: keyof TData;
  component: (column: Column<TData, unknown>) => JSX.Element;
}

interface IGRPDataTableFilterClientProps<TData> {
  table: Table<TData>;
  filterList: IGRPDataTableClientFilterListProps<TData>[];
  filterLabel: string;
}

function IGRPDataTableClientFilter<TData>({
  table,
  filterList,
  filterLabel,
}: IGRPDataTableFilterClientProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [cleanDates, setCleanDates] = useState(false); // TODO: check this render from daterangepicker

  const handleCleanFilter = () => {
    table.resetColumnFilters();
    setCleanDates(true);
  };

  useEffect(() => {
    if (cleanDates) {
      setCleanDates(false);
    }
  }, [cleanDates]);

  return (
    <div className='flex md:items-center gap-2 flex-col md:flex-row'>
      {filterList.map(({ columnId, component }) => {
        const column = table.getColumn(columnId as string);
        return column && <Fragment key={columnId as string}>{component(column)}</Fragment>;
      })}

      {isFiltered && (
        <IGRPButton
          onClick={handleCleanFilter}
          className='h-8 px-2 lg:px-3'
          variant='ghost'
          showIcon={true}
          iconName='X'
        >
          {filterLabel}
        </IGRPButton>
      )}
    </div>
  );
}

export { IGRPDataTableClientFilter };
export type { IGRPDataTableClientFilterListProps, IGRPDataTableFilterClientProps };
