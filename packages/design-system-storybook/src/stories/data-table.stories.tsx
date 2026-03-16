import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPDataTable,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellDate,
  IGRPDataTableCellExpander,
  IGRPDataTableCellLink,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterSelect,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderSortToggle,
  type ColumnDef,
  type IGRPDataTableProps,
} from '@igrp/igrp-framework-react-design-system';

type UserRow = {
  id: number;
  name: string;
  role: 'Admin' | 'Manager' | 'Analyst' | 'Viewer';
  status: 'Active' | 'Pending' | 'Inactive';
  amount: number;
  completed: number;
  total: number;
  createdAt: string;
  website: string;
};

const rows: UserRow[] = Array.from({ length: 16 }).map((_, index) => {
  const roles: UserRow['role'][] = ['Admin', 'Manager', 'Analyst', 'Viewer'];
  const statuses: UserRow['status'][] = ['Active', 'Pending', 'Inactive'];

  const total = 10;
  const completed = index % (total + 1);
  return {
    id: index + 1,
    name: `User ${index + 1}`,
    role: roles[index % roles.length] as UserRow['role'],
    status: statuses[index % statuses.length] as UserRow['status'],
    amount: 1200 + index * 95,
    completed,
    total,
    createdAt: new Date(2025, (index % 12) + 1, (index % 28) + 1).toISOString(),
    website: `https://example.com/users/${index + 1}`,
  };
});

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Viewer', label: 'Viewer' },
];

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Inactive', label: 'Inactive' },
];

const getStatusBadgeColor = (status: UserRow['status']) => {
  if (status === 'Active') return 'success';
  if (status === 'Pending') return 'warning';
  return 'destructive';
};

const columns: ColumnDef<UserRow>[] = [
  {
    id: 'select',
    header: ({ table }) => <IGRPDataTableHeaderRowsSelect table={table} />,
    cell: ({ row }) => <IGRPDataTableCellCheckbox row={row} />,
    enableSorting: false,
    enableHiding: false,
    size: 46,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Name" />,
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Role" />,
    cell: ({ row }) => row.original.role,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Status" />,
    cell: ({ row }) => (
      <IGRPDataTableCellBadge
        label={row.original.status}
        color={getStatusBadgeColor(row.original.status)}
        variant="soft"
      />
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Amount" />,
    cell: ({ row }) => (
      <IGRPDataTableCellAmount
        field={String(row.original.amount)}
        currency="USD"
        language="en-US"
      />
    ),
  },  
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Created At" />,
    cell: ({ row }) => <IGRPDataTableCellDate date={row.original.createdAt} />,
  },
  {
    accessorKey: 'website',
    header: 'Website',
    cell: ({ row }) => (
      <IGRPDataTableCellLink href={row.original.website} target="_blank" showIcon iconName="ExternalLink">
        Profile
      </IGRPDataTableCellLink>
    ),
    enableSorting: false,
  },
];

const meta: Meta<typeof IGRPDataTable> = {
  title: 'Components/DataTable',
  component: IGRPDataTable,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<IGRPDataTableProps<UserRow, unknown>>;

export const Default: Story = {
  args: {
    data: rows,
    columns,
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

export const WithClientFilters: Story = {
  args: {
    data: rows,
    columns,
    showFilter: true,
    clientFilters: [
      {
        columnId: 'name',
        component: ({ column }) => <IGRPDataTableFilterInput column={column} placeholder="Search by name" />,
      },
      {
        columnId: 'role',
        component: ({ column }) => (
          <IGRPDataTableFilterSelect
            column={column}
            options={roleOptions}
            placeholder="Select role"
            className="min-w-44"
          />
        ),
      },
      {
        columnId: 'status',
        component: ({ column }) => (
          <IGRPDataTableFilterFaceted
            column={column}
            options={statusOptions}
            placeholder="Status"
            iconName="BadgeCheck"
          />
        ),
      },
    ],
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

export const WithPagination: Story = {
  args: {
    data: rows,
    columns,
    showPagination: true,
    pageSizePagination: [5, 10, 20],
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

export const WithNumericPagination: Story = {
  args: {
    data: rows,
    columns,
    showPagination: true,
    isNumericPagination: true,
    pageSizePagination: [5, 10, 20],
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

export const WithToggleColumns: Story = {
  args: {
    data: rows,
    columns,
    showToggleColumn: true,
    toggleLabel: 'Columns',
    toggleOptionsLabel: 'Show/Hide columns',
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

export const ServerSideFilterMode: Story = {
  args: {
    data: rows,
    columns,
    isServerSide: true,
    showFilter: true,
    serverFilterComponent: (
      <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
        Custom server-side filter UI area
      </div>
    ),
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};

const columnsWithExpand: ColumnDef<UserRow>[] = [
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

export const WithExpandableRows: Story = {
  args: {
    data: rows,
    columns: columnsWithExpand,
    getRowCanExpand: () => true,
    renderSubComponent: (row) => (
      <div className="grid gap-2 rounded-md bg-muted/40 p-3 text-sm">
        <p>
          <strong>User:</strong> {row.original.name}
        </p>
        <p>
          <strong>Role:</strong> {row.original.role}
        </p>
        <p>
          <strong>Status:</strong> {row.original.status}
        </p>
        <p>
          <strong>Progress:</strong> {row.original.completed}/{row.original.total}
        </p>
      </div>
    ),
  },
  render: (args) => (
    <div className="mx-auto w-full max-w-7xl p-4">
      <IGRPDataTable {...args} />
    </div>
  ),
};
