import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPDataTableCellExpander,
  IGRPServerDataTable,
  type ColumnDef,
  type IGRPServerDataTableProps,
  type IGRPServerPaginationState,
} from '@igrp/igrp-framework-react-design-system';
import { useState } from 'react';

type Row = { id: number; name: string; role: string };

const roles = ['Admin', 'Manager', 'Analyst', 'Viewer'];
const fixture: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  role: roles[i % roles.length],
}));

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
];

const expandableColumns: ColumnDef<Row>[] = [
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => <IGRPDataTableCellExpander row={row} field="user" />,
    enableSorting: false,
    enableHiding: false,
    size: 46,
  },
  ...columns,
];

type Args = Partial<IGRPServerDataTableProps<Row, unknown>> & { total?: number };

// Stands in for the server: slices the fixture by the page the table asks for.
function Harness({ total = fixture.length, pageSize = 10, ...props }: Args & { pageSize?: number }) {
  const all = fixture.slice(0, total);
  const [page, setPage] = useState({ pageIndex: 0, pageSize });
  const pagination: IGRPServerPaginationState = {
    ...page,
    totalElements: all.length,
    totalPages: Math.max(1, Math.ceil(all.length / page.pageSize)),
  };
  const start = page.pageIndex * page.pageSize;
  return (
    <IGRPServerDataTable<Row, unknown>
      columns={columns}
      data={all.slice(start, start + page.pageSize)}
      pagination={pagination}
      onPaginationChange={(pageIndex, size) => setPage({ pageIndex, pageSize: size })}
      {...props}
    />
  );
}

const meta: Meta<typeof Harness> = {
  title: 'Components/ServerDataTable',
  component: Harness,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Harness>;

export const Default: Story = {};

export const SinglePage: Story = { args: { total: 4 } };

export const Expandable: Story = {
  args: {
    columns: expandableColumns,
    getRowId: (row) => String(row.id),
    getRowCanExpand: () => true,
    renderSubComponent: (row) => <div className="p-4">Details for {row.original.name}</div>,
  },
};

export const Numeric: Story = { args: { paginationType: 'numeric' } };

export const Loading: Story = { args: { isLoading: true } };
