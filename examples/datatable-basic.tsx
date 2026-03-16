/**
 * Basic data table example using IGRP Design System.
 * Copy into your app or use as reference.
 */
'use client';

import {
  IGRPDataTable,
  type ColumnDef,
} from '@igrp/igrp-framework-react-design-system';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.getValue('id'),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => row.getValue('name'),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.getValue('email'),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => row.getValue('role'),
  },
];

const sampleData: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', role: 'user' },
  { id: '3', name: 'Carol', email: 'carol@example.com', role: 'user' },
];

export function DatatableBasicExample() {
  return <IGRPDataTable columns={columns} data={sampleData} />;
}
