'use client';

import { type Column, type Table } from '@tanstack/react-table';
import { Fragment, type JSX } from 'react';

import { IGRPButton } from '../button';

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

  const handleCleanFilter = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex md:items-center gap-2 flex-col md:flex-row">
      {filterList.map(({ columnId, component }) => {
        const column = table.getColumn(columnId as string);
        return column && <Fragment key={columnId as string}>{component(column)}</Fragment>;
      })}

      {isFiltered && (
        <IGRPButton
          onClick={handleCleanFilter}
          className="h-8 px-2 lg:px-3"
          variant="ghost"
          showIcon={true}
          iconName="X"
        >
          {filterLabel}
        </IGRPButton>
      )}
    </div>
  );
}

export {
  IGRPDataTableClientFilter,
  type IGRPDataTableFilterClientProps,
  type IGRPDataTableClientFilterListProps,
};
