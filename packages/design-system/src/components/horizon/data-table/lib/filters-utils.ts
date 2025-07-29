import type { FilterFn } from '@tanstack/react-table';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IGRPDataTableDateRangeFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue || !filterValue.from) return true;
  const cellValue = row.getValue(columnId) as string;
  const date = new Date(cellValue);
  const start = filterValue.from;
  const end = filterValue.to ? new Date(filterValue.to) : undefined;

  if (start && end) {
    return date >= start && date <= end;
  }
  return date >= start;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IGRPDataTableFacetedFilterFn: FilterFn<any> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};
