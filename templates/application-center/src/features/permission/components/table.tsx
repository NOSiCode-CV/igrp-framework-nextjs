'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Edit, MoreHorizontal, Trash, Eye } from 'lucide-react';

import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Permission } from '../types';
import { Application } from '@/features/applications/types';
import { useDeletePermission } from '../hooks/use-permission';
import { PermissionEditDialog } from './edit-dialog';
import { PermissionDeleteDialog } from './delete-dialog';

interface PermissionTableProps {
  permissions: Permission[];
  applications: Application[];
  onRefresh?: () => void;
  hideApplicationColumn?: boolean;
}

export function PermissionTable({
  permissions,
  applications,
  onRefresh,
  hideApplicationColumn = false,
}: PermissionTableProps) {
  const { mutateAsync: deletePermission } = useDeletePermission();
  const [permissionToDelete, setPermissionToDelete] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDelete = (id: number, name: string) => {
    setPermissionToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setPermissionToEdit(permission);
    setEditDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!permissionToDelete) return;

    const promise = deletePermission(permissionToDelete.id);

    toast.promise(promise, {
      loading: 'Deleting permission...',
      success: `Permission '${permissionToDelete.name}' deleted successfully.`,
      error: (err) => `Failed to delete: ${(err as Error).message}`,
      duration: 2500,
    });

    try {
      await promise;
      if (onRefresh) onRefresh();
    } finally {
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setPermissionToDelete(null);
      }, 2500);
    }
  };

  const handleEditSuccess = () => {
    if (onRefresh) onRefresh();
  };

  const getAppName = (appId: number) => {
    return applications?.find((app) => app.id === appId)?.name || `App ${appId}`;
  };

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              {!hideApplicationColumn && <TableHead>Application</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className='w-[100px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell className='font-medium'>
                  <Link
                    href={`/permissions/${perm.id}`}
                    className='cursor-pointer hover:underline text-primary'
                  >
                    {perm.name}
                  </Link>
                </TableCell>
                <TableCell>{perm.description || 'No description'}</TableCell>
                {!hideApplicationColumn && (
                  <TableCell>
                    {perm.applicationId ? (
                      <Badge variant='secondary'>{getAppName(perm.applicationId)}</Badge>
                    ) : (
                      <span className='text-muted-foreground text-sm'>None</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={perm.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {perm.status}
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
                        <Link href={`/permissions/${perm.id}`}>
                          <Eye className='mr-2 h-4 w-4' /> View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(perm)}>
                        <Edit className='mr-2 h-4 w-4' /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive cursor-pointer'
                        onClick={() => handleDelete(perm.id, perm.name)}
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

      {permissionToDelete && (
        <PermissionDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          permissionName={permissionToDelete.name}
          onDelete={confirmDelete}
        />
      )}

      {permissionToEdit && (
        <PermissionEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          permission={permissionToEdit}
          applications={applications}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
