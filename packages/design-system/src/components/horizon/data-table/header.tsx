'use client';

import { type Column, type Table } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
} from 'lucide-react';

import { Button } from '../../primitives/button';
import { Checkbox } from '../../primitives/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu';

import { cn } from '../../../lib/utils';

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
  const canSort = column.getCanSort();
  const isSorted = column.getIsSorted();

  const ariaSort = isSorted === 'asc' ? 'ascending' : isSorted === 'desc' ? 'descending' : 'none';

  return (
    <div
      aria-label={`Ordenar por ${title}`}
      className={cn(className)}
      aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
      {...props}
    >
      {canSort ? (
        <Button
          variant="ghost"
          onClick={(e) => column.toggleSorting(undefined, e.shiftKey)}
          className={cn('px-0 py-0 has-[>svg]:px-0 data-[state=open]:bg-accent')}
          title="Ordenar"
          size="sm"
        >
          <span>{title}</span>

          {isSorted === 'asc' ? (
            <ChevronUp className={cn('ms-2 text-muted-foreground/70')} />
          ) : isSorted === 'desc' ? (
            <ChevronDown className={cn('ms-2 text-muted-foreground/70')} />
          ) : (
            <ArrowUpDown className={cn('ms-2 text-muted-foreground/70')} />
          )}
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
    <div aria-label={`Sort by ${title}`} className={cn(className)} {...props}>
      {canSort ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn('data-[state=open]:bg-accent data-[state=open]:border-accent')}
            >
              <span>{title}</span>
              {isSorted === 'desc' ? (
                <ArrowDown className={cn('ms-2 text-muted-foreground/70')} />
              ) : isSorted === 'asc' ? (
                <ArrowUp className={cn('ms-2 text-muted-foreground/70')} />
              ) : (
                <ChevronsUpDown className={cn('ms-2 text-muted-foreground/70')} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={handleSortAsc} aria-label="Sort ascending">
              <ArrowUp className={cn('text-muted-foreground/70 size-3.5')} />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSortDesc} aria-label="Sort descending">
              <ArrowDown className={cn('text-muted-foreground/70 size-3.5')} />
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
      aria-label="Select all"
      className={className}
      {...props}
    />
  );
}

function IGRPDataTableHeaderDefault<T>({
  title,
  className,
  ...props
}: Omit<IGRPDataTableHeaderProps<T>, 'column' | 'table'> & React.ComponentProps<'div'>) {
  return (
    <div className={cn(className)} {...props}>
      {title}
    </div>
  );
}

export {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderDefault,
};
