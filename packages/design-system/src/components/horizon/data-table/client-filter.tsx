'use client';

import { type Column, type Table } from '@tanstack/react-table';
import { Fragment, type JSX } from 'react';

import { cn } from '../../../lib/utils';

// import { IGRPButton } from '../button';

/**
 * Single filter config for client-side filtering.
 * @see IGRPDataTableClientFilter
 */
interface IGRPDataTableClientFilterListProps<TData> {
  /** Column id to filter. */
  columnId: keyof TData;
  /** Filter component receiving the column. */
  component: (props: { column: Column<TData, unknown> }) => JSX.Element;
}

/**
 * Props for the IGRPDataTableClientFilter component.
 * @see IGRPDataTableClientFilter
 */
interface IGRPDataTableFilterClientProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>;
  /** Filter configurations. */
  filterList: IGRPDataTableClientFilterListProps<TData>[];
  /** Label for clear filters button. */
  filterLabel: string;
}

/**
 * Renders client-side filter components for each configured column.
 */
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
