'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Edit, MoreHorizontal, Trash, Eye } from 'lucide-react';

import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,  } from '@igrp/igrp-framework-react-design-system';
import { DepartmentDeleteDialog } from './delete-dialog';
import { Department } from '../types';
import { useDeleteDepartment } from '../hooks/use-departments';

interface DepartmentTableProps {
  departments: Department[];
  onRefresh?: () => void;
}

export function DepartmentTable({ departments, onRefresh }: DepartmentTableProps) {
  const { mutateAsync: deleteDepartment } = useDeleteDepartment();
  const [departmentToDelete, setDepartmentToDelete] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = (id: number, name: string) => {
    setDepartmentToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!departmentToDelete) return;

    const promise = deleteDepartment(departmentToDelete.id);

    toast.promise(promise, {
      loading: 'Deleting department...',
      success: `Department '${departmentToDelete.name}' deleted successfully.`,
      error: (err) => `Failed to delete: ${(err as Error).message}`,
      duration: 2500,
    });

    try {
      await promise;
      if (onRefresh) onRefresh();
    } finally {
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setDepartmentToDelete(null);
      }, 2500);
    }
  };

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Application ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='w-[100px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className='font-medium'>
                  <Link
                    href={`/department/${dept.id}`}
                    className='cursor-pointer hover:underline text-primary'
                  >
                    {dept.name}
                  </Link>
                </TableCell>
                <TableCell>{dept.code}</TableCell>
                <TableCell>{dept.description || 'No description'}</TableCell>
                <TableCell>
                  {dept.application_id ? (
                    <Badge variant='secondary'>{dept.application_id}</Badge>
                  ) : (
                    <span className='text-muted-foreground text-sm'>None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={dept.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {dept.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        className='h-8 w-8 p-0'
                      >
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/department/${dept.id}`}>
                          <Eye className='mr-2 h-4 w-4' /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/department/${dept.id}/edit`}>
                          <Edit className='mr-2 h-4 w-4' /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive cursor-pointer'
                        onClick={() => handleDelete(dept.id, dept.name)}
                      >
                        <Trash className='mr-2 h-4 w-4' /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {departmentToDelete && (
        <DepartmentDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          departmentName={departmentToDelete.name}
          onDelete={confirmDelete}
        />
      )}
    </>
  );
}
