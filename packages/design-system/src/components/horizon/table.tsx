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
} from '../primitives/table';

type IGRPTableProps<T> = {
  content: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    render?: (value: T[keyof T]) => ReactNode;
  }[];
  actions?: (row: { original: T }) => ReactNode;
  tableClass?: string;
  tHeadClass?: string;
  tBodyClass?: string;
  tFootClass?: string;
  tHeadRowClass?: string;
  tBodyRowClass?: string;
  tFootRowClass?: string;
  showFooter?: boolean;
  footerContent?: ReactNode;
  footerColumn?: keyof T;
  isStriped?: boolean;
  isHeaderSticky?: boolean;
  id?: string;
};

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

  const renderCell = (value: T[keyof T], render?: (value: T[keyof T]) => ReactNode): ReactNode => {
    if (render) {
      return render(value);
    }
    return String(value);
  };

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
                  {renderCell(row[column.accessorKey], column.render)}
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
