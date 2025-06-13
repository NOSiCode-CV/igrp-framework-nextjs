'use client';

import { useId } from 'react';
import { type Table } from '@tanstack/react-table';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/horizon/button';
import { Label } from '@/components/primitives/label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/horizon/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { usePagination } from './hooks/use-pagination';
import { cn } from '@/lib/utils';

interface IGRPDataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSize?: number[];
  className?: string;
}

function IGRPDataTablePagination<TData>({
  table,
  pageSize = [50, 100, 150, 200],
  className,
}: IGRPDataTablePaginationProps<TData>) {
  const id = useId();

  return (
    <div className={cn('flex items-center justify-between gap-8', className)}>
      <div className='flex items-center gap-3'>
        <Label
          htmlFor={id}
          className='max-sm:sr-only'
        >
          Rows per page
        </Label>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger
            id={id}
            className='w-fit whitespace-nowrap'
          >
            <SelectValue placeholder='Select number of results' />
          </SelectTrigger>
          <SelectContent className='[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2'>
            {pageSize.map((p) => (
              <SelectItem
                key={p}
                value={p.toString()}
              >
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex grow justify-end whitespace-nowrap text-sm text-muted-foreground'>
        <p
          className='whitespace-nowrap text-sm text-muted-foreground'
          aria-live='polite'
        >
          <span className='text-foreground'>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
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
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Go to first page'
              >
                <ChevronFirst
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Go to previous page'
              >
                <ChevronLeft
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Go to next page'
              >
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Go to last page'
              >
                <ChevronLast
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function IGRPDataTablePaginationNumeric<TData>({
  table,
  pageSize = [50, 100, 150, 200],
  className,
}: IGRPDataTablePaginationProps<TData>) {
  const id = useId();
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  });

  return (
    <div
      id={id}
      className={cn('flex items-center justify-between gap-3 max-sm:flex-col', className)}
    >
      <p
        className='flex-1 whitespace-nowrap text-sm text-muted-foreground'
        aria-live='polite'
      >
        Page <span className='text-foreground'>{table.getState().pagination.pageIndex + 1}</span> of{' '}
        <span className='text-foreground'>{table.getPageCount()}</span>
      </p>

      <div className='grow'>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label='Go to previous page'
              >
                <ChevronLeft
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>

            {showLeftEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {pages.map((page) => {
              const isActive = page === table.getState().pagination.pageIndex + 1;
              return (
                <PaginationItem key={page}>
                  <Button
                    size='icon'
                    variant={`${isActive ? 'outline' : 'ghost'}`}
                    onClick={() => table.setPageIndex(page - 1)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              );
            })}

            {showRightEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <Button
                size='icon'
                variant='outline'
                className='disabled:pointer-events-none disabled:opacity-50'
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label='Go to next page'
              >
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <div className='flex flex-1 justify-end'>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
          aria-label='Results per page'
        >
          <SelectTrigger
            id='results-per-page'
            className='w-fit whitespace-nowrap'
          >
            <SelectValue placeholder='Select number of results' />
          </SelectTrigger>
          <SelectContent>
            {pageSize.map((p) => (
              <SelectItem
                key={p}
                value={p.toString()}
              >
                {p} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export {
  IGRPDataTablePagination,
  IGRPDataTablePaginationNumeric,
  type IGRPDataTablePaginationProps,
};
