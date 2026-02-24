'use client';

import { type Column, type Table } from '@tanstack/react-table';
import { Fragment, type JSX } from 'react';

import { cn } from '../../../lib/utils';

// import { IGRPButton } from '../button';

interface IGRPDataTableClientFilterListProps<TData> {
  columnId: keyof TData;
  component: (props: { column: Column<TData, unknown> }) => JSX.Element;
}

interface IGRPDataTableFilterClientProps<TData> {
  table: Table<TData>;
  filterList: IGRPDataTableClientFilterListProps<TData>[];
  filterLabel: string;
}

function IGRPDataTableClientFilter<TData>({
  table,
  filterList,
  // filterLabel,
}: IGRPDataTableFilterClientProps<TData>) {
  // const isFiltered = table.getState().columnFilters.length > 0;

  // const handleCleanFilter = () => {
  //   table.resetColumnFilters();
  //   filterList.forEach(({ columnId }) => {
  //   const col = table.getColumn(columnId as string);
  //   col?.setFilterValue(undefined);
  // });
  // };

  return (
    <div className={cn('flex md:items-center gap-2 flex-col md:flex-row')}>
      {filterList.map(({ columnId, component }) => {
        const column = table.getColumn(columnId as string);
        return (
          column && <Fragment key={columnId as string}>{component({ column: column })}</Fragment>
        );
      })}

      {/* {isFiltered && (
        <IGRPButton
          onClick={handleCleanFilter}         
          variant="ghost"
          showIcon
          iconName="X"
        >
          {filterLabel}
        </IGRPButton>
      )} */}
    </div>
  );
}

export {
  IGRPDataTableClientFilter,
  type IGRPDataTableFilterClientProps,
  type IGRPDataTableClientFilterListProps,
};
