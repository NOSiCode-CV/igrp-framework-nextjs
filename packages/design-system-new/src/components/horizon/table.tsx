'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

/** @internal Renders cell content with optional custom render function. */
function TableCellContent<T>({ value, render }: { value: T; render?: (value: T) => ReactNode }) {
  if (render) {
    return <>{render(value)}</>;
  }
  return <>{String(value)}</>;
}

/**
 * Props for the IGRPTable component.
 * @see IGRPTable
 */
type IGRPTableProps<T> = {
  /** Row data. */
  content: T[];
  /** Column definitions. */
  columns: {
    header: string;
    accessorKey: keyof T;
    render?: (value: T[keyof T]) => ReactNode;
  }[];
  /** Row actions render function. */
  actions?: (row: { original: T }) => ReactNode;
  /** CSS classes for the table wrapper. */
  tableClass?: string;
  /** CSS classes for the header. */
  tHeadClass?: string;
  /** CSS classes for the body. */
  tBodyClass?: string;
  /** CSS classes for the footer. */
  tFootClass?: string;
  /** CSS classes for header rows. */
  tHeadRowClass?: string;
  /** CSS classes for body rows. */
  tBodyRowClass?: string;
  /** CSS classes for footer rows. */
  tFootRowClass?: string;
  /** Whether to show the footer. */
  showFooter?: boolean;
  /** Footer content. */
  footerContent?: ReactNode;
  /** Column to show footer content in. */
  footerColumn?: keyof T;
  /** Alternate row background. */
  isStriped?: boolean;
  /** Sticky header on scroll. */
  isHeaderSticky?: boolean;
  /** HTML id attribute. */
  id?: string;
};

/**
 * Table with configurable columns, row actions, footer, and styling options.
 */
function IGRPTable<T>({
  content,
  columns,
  actions,
  tableClass,
  tHeadClass,
  tBodyClass,
  tFootClass,
  tHeadRowClass,
  tBodyRowClass,
  tFootRowClass,
  showFooter = false,
  footerContent,
  footerColumn,
  isStriped = false,
  isHeaderSticky = false,
  id,
}: IGRPTableProps<T>) {
  const _id = useId();
  const ref = id ?? _id;

  const stripeClass = isStriped ? 'odd:bg-muted/50 odd:hover:bg-muted/50 border-none' : '';

  const stickyHeaderClass = isHeaderSticky
    ? 'bg-background/90 sticky top-0 z-10 backdrop-blur-xs'
    : '';

  return (
    <div className={cn('w-full overflow-auto', tableClass)} id={ref}>
      <Table>
        <TableHeader className={cn(stickyHeaderClass, tHeadClass)}>
          <TableRow className={cn('bg-muted/50', tHeadRowClass)}>
            {columns.map((column) => (
              <TableHead key={column.accessorKey.toString()}>{column.header}</TableHead>
            ))}
            {actions && (
              <TableHead>
                <span className={cn('sr-only')}>Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className={cn(tBodyClass)}>
          {content?.map((row, rowIndex) => (
            <TableRow className={cn(tBodyRowClass, stripeClass)} key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey.toString()}>
                  <TableCellContent value={row[column.accessorKey]} render={column.render} />
                </TableCell>
              ))}
              {actions && (
                <TableCell className={cn('text-right')}>{actions({ original: row })}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        {showFooter && (
          <TableFooter className={cn(tFootClass)}>
            <TableRow className={cn(tFootRowClass)}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey.toString()} className={cn('font-medium')}>
                  {footerColumn === column.accessorKey ? footerContent : ''}
                </TableCell>
              ))}
              {actions && <TableCell></TableCell>}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

export { IGRPTable, type IGRPTableProps };
