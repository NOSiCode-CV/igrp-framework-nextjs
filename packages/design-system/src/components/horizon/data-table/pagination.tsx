'use client';
'use no memo';

import { useId } from 'react';
import { type Table } from '@tanstack/react-table';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '../../ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { usePagination } from './hooks/use-pagination';
import { cn } from '../../../lib/utils';

/**
 * Props for the IGRPDataTablePagination components.
 * @see IGRPDataTablePagination
 * @see IGRPDataTablePaginationNumeric
 */
interface IGRPDataTablePaginationProps<TData> {
  /** TanStack Table instance. */
  table: Table<TData>;
  /** Page size options. */
  pageSize?: number[];
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Pagination with prev/next buttons and page size selector.
 */
function IGRPDataTablePagination<TData>({
  table,
  pageSize = [50, 100, 150, 200],
  className,
}: IGRPDataTablePaginationProps<TData>) {
  const id = useId();

  const start = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
  const end = table.getCanNextPage()
    ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
      table.getState().pagination.pageSize
    : table.getRowCount();
  return (
    <div className={cn('flex items-center gap-6 px-2', className)}>
      <div className={cn('flex items-center gap-3 grow justify-end')}>
        <Label htmlFor={id} className={cn('max-sm:sr-only')}>
          Registo por página
        </Label>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger id={id} className={cn('w-fit whitespace-nowrap')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={cn(
              '[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2',
            )}
          >
            {pageSize.map((p) => (
              <SelectItem key={p} value={p.toString()}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn('text-sm whitespace-nowrap text-muted-foreground')}>
        <p className={cn('whitespace-nowrap text-sm text-muted-foreground')} aria-live="polite">
          <span className={cn('text-foreground')}>
            {start}-{end}
          </span>{' '}
          de <span className={cn('text-foreground')}>{table.getRowCount().toString()}</span>
        </p>
      </div>

      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to first page"
              >
                <ChevronFirst size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>

            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Go to last page"
              >
                <ChevronLast size={16} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

/**
 * Pagination with numeric page buttons and page size selector.
 */
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
        className={cn('flex-1 whitespace-nowrap text-sm text-muted-foreground')}
        aria-live="polite"
      >
        Page{' '}
        <span className={cn('text-foreground')}>{table.getState().pagination.pageIndex + 1}</span>{' '}
        of <span className={cn('text-foreground')}>{table.getPageCount()}</span>
      </p>

      <div className={cn('grow')}>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
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
                    size="icon"
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
                size="icon"
                variant="outline"
                className={cn('disabled:pointer-events-none disabled:opacity-50')}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <div className={cn('flex flex-1 justify-end')}>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
          aria-label="Results per page"
        >
          <SelectTrigger id="results-per-page" className={cn('w-fit whitespace-nowrap')}>
            <SelectValue placeholder="Select number of results" />
          </SelectTrigger>
          <SelectContent>
            {pageSize.map((p) => (
              <SelectItem key={p} value={p.toString()}>
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
