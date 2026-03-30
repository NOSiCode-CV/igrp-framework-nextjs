'use client';
'use no memo';

import { Fragment, useCallback, useId, useReducer } from 'react';
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
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
  useReactTable,
  type Row,
  type TableOptions,
} from '@tanstack/react-table';

import { cn } from '../../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { IGRPIcon } from '../icon';
import {
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableClientFilter,
} from './client-filter';
import { IGRPDataTablePagination, IGRPDataTablePaginationNumeric } from './pagination';
import { IGRPDataTableToggleVisibility } from './toggle-visibility';

/**
 * Props for the IGRPDataTable component.
 * @see IGRPDataTable
 */
interface IGRPDataTableProps<TData, TValue> {
  /** TanStack Table column definitions. */
  columns: ColumnDef<TData, TValue>[];
  /** Table data rows. */
  data: TData[];
  /** Show pagination controls. */
  showPagination?: boolean;
  /** Use numeric page selector instead of prev/next. */
  isNumericPagination?: boolean;
  /** Available page size options. */
  pageSizePagination?: number[];
  /** Use server-side filtering (requires serverFilterComponent). */
  isServerSide?: boolean;
  /** Show filter UI. */
  showFilter?: boolean;
  /** Client-side filter configurations. */
  clientFilters?: IGRPDataTableClientFilterListProps<TData>[];
  /** Label for clear filters button. */
  clientClearLabel?: string;
  /** Show column visibility toggle. */
  showToggleColumn?: boolean;
  /** Label for column visibility toggle button. */
  toggleLabel?: string;
  /** Label for column visibility dropdown. */
  toggleOptionsLabel?: string;
  /** CSS classes for the wrapper. */
  className?: string;
  /** CSS classes for the table element. */
  tableClassName?: string;
  /** CSS classes for the table header. */
  tableHeaderClassName?: string;
  /** CSS classes for the table body. */
  tableBodyClassName?: string;
  /** CSS classes for pagination. */
  paginationClassName?: string;
  /** Custom filter component for server-side mode. */
  serverFilterComponent?: React.ReactNode;
  /** Message when no rows match. */
  notFoundLabel?: string;
  /** Whether a row can be expanded. */
  getRowCanExpand?: TableOptions<TData>['getRowCanExpand'];
  /** Render expanded row content. */
  renderSubComponent?: (row: Row<TData>) => React.ReactElement | undefined;
  /** HTML id attribute. */
  id?: string;
}

type TableState = {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  pagination: PaginationState;
  sorting: SortingState;
  expanded: ExpandedState;
  rowSelection: RowSelectionState;
};

type TableAction =
  | { type: 'columnFilters'; payload: ColumnFiltersState }
  | { type: 'columnVisibility'; payload: VisibilityState }
  | { type: 'pagination'; payload: PaginationState }
  | { type: 'sorting'; payload: SortingState }
  | { type: 'expanded'; payload: ExpandedState }
  | { type: 'rowSelection'; payload: RowSelectionState };

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'columnFilters':
      return { ...state, columnFilters: action.payload };
    case 'columnVisibility':
      return { ...state, columnVisibility: action.payload };
    case 'pagination':
      return { ...state, pagination: action.payload };
    case 'sorting':
      return { ...state, sorting: action.payload };
    case 'expanded':
      return { ...state, expanded: action.payload };
    case 'rowSelection':
      return { ...state, rowSelection: action.payload };
    default:
      return state;
  }
}

/**
 * Data table with sorting, filtering, pagination, and expandable rows.
 * Built on TanStack Table. Use IGRPDataTableHeader*, IGRPDataTableCell*, etc. for column setup.
 */
function IGRPDataTable<TData, TValue>({
  columns,
  data,
  showPagination = false,
  isNumericPagination = false,
  pageSizePagination = [50, 100, 150, 200],
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
  id,
}: IGRPDataTableProps<TData, TValue>) {
  const [state, dispatch] = useReducer(tableReducer, {
    columnFilters: [],
    columnVisibility: {},
    pagination: {
      pageIndex: 0,
      pageSize: pageSizePagination?.[0] || 50,
    },
    sorting: [],
    expanded: {},
    rowSelection: {},
  });

  const setColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) =>
      dispatch({
        type: 'columnFilters',
        payload: typeof updater === 'function' ? updater(state.columnFilters) : updater,
      }),
    [state.columnFilters],
  );
  const setColumnVisibility = useCallback(
    (updater: Updater<VisibilityState>) =>
      dispatch({
        type: 'columnVisibility',
        payload: typeof updater === 'function' ? updater(state.columnVisibility) : updater,
      }),
    [state.columnVisibility],
  );
  const setPagination = useCallback(
    (updater: Updater<PaginationState>) =>
      dispatch({
        type: 'pagination',
        payload: typeof updater === 'function' ? updater(state.pagination) : updater,
      }),
    [state.pagination],
  );
  const setSorting = useCallback(
    (updater: Updater<SortingState>) =>
      dispatch({
        type: 'sorting',
        payload: typeof updater === 'function' ? updater(state.sorting) : updater,
      }),
    [state.sorting],
  );
  const setExpanded = useCallback(
    (updater: Updater<ExpandedState>) =>
      dispatch({
        type: 'expanded',
        payload: typeof updater === 'function' ? updater(state.expanded) : updater,
      }),
    [state.expanded],
  );
  const setRowSelection = useCallback(
    (updater: Updater<RowSelectionState>) =>
      dispatch({
        type: 'rowSelection',
        payload: typeof updater === 'function' ? updater(state.rowSelection) : updater,
      }),
    [state.rowSelection],
  );

  const _id = useId();
  const ref = id ?? _id;

  // eslint-disable-next-line react-hooks/incompatible-library
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
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,

    state: {
      sorting: state.sorting,
      columnVisibility: state.columnVisibility,
      rowSelection: state.rowSelection,
      columnFilters: state.columnFilters,
      pagination: state.pagination,
      expanded: state.expanded,
    },

    enableRowSelection: true,
    enableSortingRemoval: false,
  });

  const NotFoundRowSubComponent = (
    <div className={cn('flex items-center gap-2 p-3')}>
      <IGRPIcon iconName="OctagonAlert" />
      <span>N/A</span>
    </div>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)} id={ref}>
      <div
        className={cn(
          'flex flex-col md:flex-row md:items-center md:justify-between md:flex-1 gap-3',
        )}
      >
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
          <IGRPDataTableToggleVisibility
            table={table}
            label={toggleLabel}
            optionsLabel={toggleOptionsLabel}
          />
        )}
      </div>

      <div className={cn('overflow-hidden rounded-md border')}>
        <Table className={tableClassName}>
          <TableHeader className={tableHeaderClassName}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={cn('border-b dark:border-slate-800/60')}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: `${header.getSize()}px` }}
                      className={cn('font-semibold px-3')}
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
                      // className={cn(
                      //   'border-0 [&:first-child>td:first-child]:rounded-tl-lg',
                      //   '[&:first-child>td:last-child]:rounded-tr-lg',
                      //   '[&:last-child>td:first-child]:rounded-bl-lg',
                      //   '[&:last-child>td:last-child]:rounded-br-lg h-px hover:bg-accent/50',
                      // )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'p-3 truncate h-[inherit] [&:has([aria-expanded])]:w-px [&:has([aria-expanded])]:py-0 [&:has([aria-expanded])]:pr-0',
                          )}
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
              // className={cn(
              //   'hover:bg-transparent [&:first-child>td:first-child]:rounded-tl-lg',
              //   '[&:first-child>td:last-child]:rounded-tr-lg',
              //   '[&:last-child>td:first-child]:rounded-bl-lg',
              //   '[&:last-child>td:last-child]:rounded-br-lg',
              // )}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn('h-24 text-center font-semibold')}
                >
                  {notFoundLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <tbody aria-hidden="true" className={cn('table-row h-1')}></tbody>
        </Table>
      </div>

      {table.getRowCount() > state.pagination.pageSize &&
        showPagination &&
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
