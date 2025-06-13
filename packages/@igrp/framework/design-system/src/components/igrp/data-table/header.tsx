'use client';

import { useCallback } from 'react';
import { type Column, type Table } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/horizon/button';
import { Checkbox } from '@/components/horizon/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives/dropdown-menu';

import { cn } from '@/lib/utils';

interface IGRPDataTableHeaderProps<T> {
  table: Table<T>;
  column: Column<T, unknown>;
  title: string;
}

function IGRPDataTableHeaderSortToggle<T>({
  column,
  title,
  className,
  ...props
}: Omit<IGRPDataTableHeaderProps<T>, 'table'> & React.ComponentProps<'div'>) {
  const canSort = column?.getCanSort();
  const isSorted = column?.getIsSorted();

  const handleToggleSorting = useCallback(() => {
    column?.toggleSorting(isSorted === 'asc');
  }, [column, isSorted]);

  return (
    <div
      aria-label={`Sort by ${title}`}
      className={cn('flex items-center space-x-2', className)}
      {...props}
    >
      {canSort ? (
        <Button
          variant='ghost'
          onClick={handleToggleSorting}
          className='flex items-center gap-2'
        >
          <span>{title}</span>
          <ArrowUpDown className={cn('ml-2 h-4 w-4', !isSorted && 'text-gray-500')} />
        </Button>
      ) : (
        <span>{title}</span>
      )}
    </div>
  );
}

function IGRPDataTableHeaderSortDropdown<T>({
  column,
  title,
  className,
  ...props
}: Omit<IGRPDataTableHeaderProps<T>, 'table'> & React.ComponentProps<'div'>) {
  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();

  const handleSortAsc = () => column.toggleSorting(false);
  const handleSortDesc = () => column.toggleSorting(true);

  return (
    <div
      aria-label={`Sort by ${title}`}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {canSort ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className={cn(
                '-ml-3 h-8 flex items-center space-x-2',
                'data-[state=open]:bg-accent data-[state=open]:border-accent',
              )}
            >
              <span>{title}</span>
              {isSorted === 'desc' ? (
                <ArrowDown />
              ) : isSorted === 'asc' ? (
                <ArrowUp />
              ) : (
                <ChevronsUpDown />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start'>
            <DropdownMenuItem
              onClick={handleSortAsc}
              aria-label='Sort ascending'
            >
              <ArrowUp className='h-3.5 w-3.5 text-muted-foreground/70' />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSortDesc}
              aria-label='Sort descending'
            >
              <ArrowDown className='h-3.5 w-3.5 text-muted-foreground/70' />
              Desc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span>{title}</span>
      )}
    </div>
  );
}

function IGRPDataTableHeaderRowsSelect<T>({
  table,
  className,
  ...props
}: Omit<IGRPDataTableHeaderProps<T>, 'column' | 'title'> & React.ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(value) => table.toggleAllRowsSelected?.(!!value)}
      aria-label='Select all'
      className={className}
      {...props}
    />
  );
}

function IGRPDataTableHeaderDefault<T>({
  title,
  className,
  ...props
}: Omit<IGRPDataTableHeaderProps<T>, 'column' | 'table'> & React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(className)}
      {...props}
    >
      {title}
    </span>
  );
}

export {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderDefault,
};
