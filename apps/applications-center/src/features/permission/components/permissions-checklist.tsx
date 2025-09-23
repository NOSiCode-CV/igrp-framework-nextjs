'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
  IGRPPaginationContentPrimitive,
  IGRPPaginationItemPrimitive,
  IGRPPaginationPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { showStatus, statusClass } from '@/lib/utils';
import { PermissionArgs } from '../permissions-schemas';
import { usePermissions } from '../use-permission';

const multiColumnFilterFn: FilterFn<PermissionArgs> = (row, columnId, filterValue) => {
  console.log({ row, columnId, filterValue })
  const term = String(filterValue ?? '').toLowerCase().trim();
  if (!term) return true;

  const name = String(row.original?.name ?? '').toLowerCase();
  const desc = String(row.original?.description ?? '').toLowerCase();

  return name.includes(term) || desc.includes(term);
}

const columns: ColumnDef<PermissionArgs>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <IGRPCheckboxPrimitive
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='ring ring-current/50'
      />
    ),
    cell: ({ row }) => (
      <IGRPCheckboxPrimitive
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='ring ring-current/50'
      />
    ),
    size: 28,
    enableSorting: false,
  },
  {
    header: 'Nome',
    accessorKey: 'name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
    enableSorting: false,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: true
  },
  {
    header: 'Descrição',
    accessorKey: 'description',
    cell: ({ row }) => <div>{row.getValue('description') || 'N/A'}</div>,
    enableSorting: false,
  },
  {
    header: 'Estado',
    accessorKey: 'status',
    cell: ({ row }) => (
      <IGRPBadgePrimitive className={cn(statusClass(row.getValue('status')), 'capitalize')}>
        {showStatus(row.getValue('status'))}
      </IGRPBadgePrimitive>
    ),
    size: 40,
    enableSorting: false,
  },
];

export function PermissionsCheckList({ departmentCode }: { departmentCode: string }) {
  const id = useId();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [data, setData] = useState<PermissionArgs[]>([]);
  const inputRef = useRef<HTMLInputElement>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const { data: permissions, isLoading, error } = usePermissions({ departmentCode });

  const table = useReactTable({
    data,
    columns,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination,
      columnFilters,
    },
  });

  useEffect(() => {
    setData(permissions || []);
  }, [permissions]);

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar permissões.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>     
      <div className="relative px-3">
        <IGRPInputPrimitive
          id={`${id}-input`}
          ref={inputRef}
          className={cn(
            "peer ps-9 border-foreground/30 focus-visible:ring-[2px] focus-visible:ring-foreground/30 focus-visible:border-foreground/30",
            Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
          )}

          value={(table.getColumn("name")?.getFilterValue() ?? "") as string}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          placeholder="Filtar por nome..."
          type="text"
          aria-label="Filtar por nome"
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-2 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <IGRPIcon iconName='ListFilter' />
        </div>
        {Boolean(table.getColumn("name")?.getFilterValue()) && (
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear filter"
            onClick={() => {
              table.getColumn("name")?.setFilterValue("")
              if (inputRef.current) {
                inputRef.current.focus()
              }
            }}
          >
            <IGRPIcon iconName='CircleX' />
          </button>
        )}
      </div>
      {isLoading ? (
        <div className='grid gap-4 animate-pulse'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className='h-12 rounded-lg bg-muted'
            />
          ))}
        </div>
      ) : (
        <>
          <div className='bg-background overflow-hidden rounded-md border'>
            <IGRPTablePrimitive className='table-fixed'>
              <IGRPTableHeaderPrimitive>
                {table.getHeaderGroups().map((headerGroup) => (
                  <IGRPTableRowPrimitive
                    key={headerGroup.id}
                    className='hover:bg-transparent'
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <IGRPTableHeadPrimitive
                          key={header.id}
                          style={{ width: `${header.getSize()}px` }}
                          className='h-12'
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </IGRPTableHeadPrimitive>
                      );
                    })}
                  </IGRPTableRowPrimitive>
                ))}
              </IGRPTableHeaderPrimitive>
              <IGRPTableBodyPrimitive>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <IGRPTableRowPrimitive
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <IGRPTableCellPrimitive key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </IGRPTableCellPrimitive>
                      ))}
                    </IGRPTableRowPrimitive>
                  ))
                ) : (
                  <IGRPTableRowPrimitive>
                    <IGRPTableCellPrimitive
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      Sem resultados!
                    </IGRPTableCellPrimitive>
                  </IGRPTableRowPrimitive>
                )}
              </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
          </div>

          <div className='flex items-center justify-between gap-8'>
            <div className='flex items-center gap-3'>
              <IGRPLabelPrimitive
                htmlFor={`${id}-per-page`}
                className='max-sm:sr-only'
              >
                Rows per page
              </IGRPLabelPrimitive>
              <IGRPSelectPrimitive
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <IGRPSelectTriggerPrimitive
                  id={`${id}-per-page`}
                  className='w-fit whitespace-nowrap'
                >
                  <IGRPSelectValuePrimitive placeholder='Select number of results' />
                </IGRPSelectTriggerPrimitive>
                <IGRPSelectContentPrimitive className='[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2'>
                  {[5, 10, 25, 50].map((pageSize) => (
                    <IGRPSelectItemPrimitive
                      key={pageSize}
                      value={pageSize.toString()}
                    >
                      {pageSize}
                    </IGRPSelectItemPrimitive>
                  ))}
                </IGRPSelectContentPrimitive>
              </IGRPSelectPrimitive>
            </div>
            <div className='text-muted-foreground flex grow justify-end text-sm whitespace-nowrap'>
              <p
                className='text-muted-foreground text-sm whitespace-nowrap'
                aria-live='polite'
              >
                <span className='text-foreground'>
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                  -
                  {Math.min(
                    Math.max(
                      table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
                      table.getState().pagination.pageSize,
                      0,
                    ),
                    table.getRowCount(),
                  )}
                </span>{' '}
                of <span className='text-foreground'>{table.getRowCount().toString()}</span>
              </p>
            </div>
            <div>
              <IGRPPaginationPrimitive>
                <IGRPPaginationContentPrimitive>
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.firstPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label='Go to first page'
                    >
                      <IGRPIcon iconName='ChevronFirst' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label='Go to previous page'
                    >
                      <IGRPIcon iconName='ChevronLeft' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label='Go to next page'
                    >
                      <IGRPIcon iconName='ChevronRight' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                  <IGRPPaginationItemPrimitive>
                    <IGRPButtonPrimitive
                      size='icon'
                      variant='outline'
                      className='disabled:pointer-events-none disabled:opacity-50'
                      onClick={() => table.lastPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label='Go to last page'
                    >
                      <IGRPIcon iconName='ChevronLast' />
                    </IGRPButtonPrimitive>
                  </IGRPPaginationItemPrimitive>
                </IGRPPaginationContentPrimitive>
              </IGRPPaginationPrimitive>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
