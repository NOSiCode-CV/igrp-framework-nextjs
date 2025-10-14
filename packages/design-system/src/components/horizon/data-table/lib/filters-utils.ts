import type { FilterFn } from '@tanstack/react-table';

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

export const IGRPDataTableFacetedFilterFn: FilterFn<any> = (
  row,
  columnId,
  filterValue: string[],
) => {
  if (!filterValue?.length) return true;
  const status = row.getValue(columnId) as string;
  return filterValue.includes(status);
};

export const multiColumnFilterFn: FilterFn<any> = (row, _columnId, filterValue) => {
  const term = String(filterValue ?? '')
    .toLowerCase()
    .trim();
  if (!term) return true;
  const name = String(row.original?.name ?? '').toLowerCase();
  const desc = String(row.original?.description ?? '').toLowerCase();
  return name.includes(term) || desc.includes(term);
};