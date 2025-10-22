'use client';

import { Fragment, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  // type OnChangeFn,
  // type RowSelectionState,
  type SortingState,
  type VisibilityState,
  useReactTable,
  type Row,
  type TableOptions,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/table';
import {
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableClientFilter,
} from './client-filter';
import { IGRPDataTablePagination, IGRPDataTablePaginationNumeric } from './pagination';
import { IGPRDataTableToggleVisibility } from './toggle-visibility';
import { cn } from '../../../lib/utils';
import { IGRPIcon } from '../icon';

interface IGRPDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showPagination?: boolean;
  isNumericPagination?: boolean;
  pageSizePagination?: number[];
  isServerSide?: boolean;
  showFilter?: boolean;
  clientFilters?: IGRPDataTableClientFilterListProps<TData>[];
  clientClearLabel?: string;
  showToggleColumn?: boolean;
  toggleLabel?: string;
  toggleOptionsLabel?: string;
  className?: string;
  tableClassName?: string;
  tableHeaderClassName?: string;
  tableBodyClassName?: string;
  paginationClassName?: string;
  serverFilterComponent?: React.ReactNode;
  notFoundLabel?: string;
  // rowSelection?: RowSelectionState
  // onRowSelectionChange?: OnChangeFn<RowSelectionState>
  getRowCanExpand?: TableOptions<TData>['getRowCanExpand'];
  renderSubComponent?: (row: Row<TData>) => React.ReactElement | undefined;
}

function IGRPDataTable<TData, TValue>({
  columns,
  data,
  showPagination = false,
  isNumericPagination = false,
  pageSizePagination,
  isServerSide = false,
  showFilter = false,
  clientFilters,
  clientClearLabel = 'Limpar',
  showToggleColumn = false,
  toggleLabel,
  toggleOptionsLabel,
  className,
  tableClassName,
  tableHeaderClassName,
  tableBodyClassName,
  paginationClassName,
  serverFilterComponent,
  notFoundLabel = 'Nenhum registo encontrado.',
  // rowSelection,
  // onRowSelectionChange,
  getRowCanExpand = () => false,
  renderSubComponent,
}: IGRPDataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSizePagination?.[0] || 50,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowCanExpand: getRowCanExpand,

    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    // onRowSelectionChange: onRowSelectionChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,

    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      expanded,
    },

    enableRowSelection: true,
    enableSortingRemoval: false,
  });

  const NotFoundRowSubComponent = (
    <div className="flex items-center gap-2 p-3">
      <IGRPIcon iconName="OctagonAlert" />
      <span>N/A</span>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:flex-1 gap-3">
        {showFilter &&
          (isServerSide ? (
            serverFilterComponent
          ) : (
            <IGRPDataTableClientFilter
              table={table}
              filterList={clientFilters || []}
              filterLabel={clientClearLabel}
            />
          ))}
        {showToggleColumn && (
          <IGPRDataTableToggleVisibility
            table={table}
            label={toggleLabel}
            optionsLabel={toggleOptionsLabel}
          />
        )}
      </div>

      <div className={cn('overflow-auto border')}>
        <Table className={tableClassName}>
          <TableHeader className={tableHeaderClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b dark:border-slate-800/60">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: `${header.getSize()}px` }}
                      className="px-4 py-3 font-semibold"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className={cn(tableBodyClassName)}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        'border-0 [&:first-child>td:first-child]:rounded-tl-lg',
                        '[&:first-child>td:last-child]:rounded-tr-lg',
                        '[&:last-child>td:first-child]:rounded-bl-lg',
                        '[&:last-child>td:last-child]:rounded-br-lg h-px hover:bg-accent/50',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="truncate p-3 h-[inherit] [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>

                    {row.getIsExpanded() && (
                      <TableRow key={`${row.id}-expanded`}>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          {renderSubComponent ? renderSubComponent(row) : NotFoundRowSubComponent}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow
                className={cn(
                  'hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg',
                  '[&:first-child>td:last-child]:rounded-tr-lg',
                  '[&:last-child>td:first-child]:rounded-bl-lg',
                  '[&:last-child>td:last-child]:rounded-br-lg',
                )}
              >
                <TableCell colSpan={columns.length} className="h-24 text-center font-semibold">
                  {notFoundLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tbody aria-hidden="true" className="table-row h-1"></tbody>
        </Table>
      </div>

      {showPagination &&
        (isNumericPagination ? (
          <IGRPDataTablePaginationNumeric
            table={table}
            pageSize={pageSizePagination}
            className={paginationClassName}
          />
        ) : (
          <IGRPDataTablePagination
            table={table}
            pageSize={pageSizePagination}
            className={paginationClassName}
          />
        ))}
    </div>
  );
}

export { IGRPDataTable, type IGRPDataTableProps };
