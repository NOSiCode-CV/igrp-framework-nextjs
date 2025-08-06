'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { IGRPInputPrimitive  } from '@igrp/igrp-framework-react-design-system';
import { IGRPLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import {  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,  } from '@igrp/igrp-framework-react-design-system';
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPDialogPrimitive,  IGRPDialogContentPrimitive, IGRPDialogDescriptionPrimitive, IGRPDialogFooterPrimitive, IGRPDialogHeaderPrimitive, IGRPDialogTitlePrimitive } from '@igrp/igrp-framework-react-design-system';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IGRPFormPrimitive, IGRPFormControlPrimitive, IGRPFormDescriptionPrimitive, IGRPFormFieldPrimitive, IGRPFormItemPrimitive, IGRPFormLabelPrimitive} from '@igrp/igrp-framework-react-design-system'
import { IIGRPCheckboxPrimitive } from '@igrp/igrp-framework-react-design-system'
import {
  useAddRole,
  useAllRoles,
  useDeleteRole,
  useUpdateRole,
  useAddRolePermissions,
} from '@/features/roles/hooks/use-roles';
import { usePermissionsByApplication } from '@/features/permission/hooks/use-permission';
import { RoleEditDialog } from './edit-role';

interface Role {
  id: number;
  name: string;
  description?: string;
  departmentId: number;
}

const roleSchema = z.object({
  code: z.string().min(2, 'Role code is required'),
  permissions: z.array(z.number()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RolesListProps {
  departmentId: number;
  applicationId: number;
}

const useRolesByDepartment = (departmentId: number) => {
  const { data: allRoles = [], isLoading, refetch } = useAllRoles();

  const roles = allRoles.filter((role: Role) => role.departmentId === departmentId);

  return {
    data: roles as Role[],
    isLoading,
    refetch,
  };
};

export function RolesList({ departmentId, applicationId }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const { data: roles = [], isLoading, refetch } = useRolesByDepartment(departmentId);
  const { data: permissions = [], isLoading: isLoadingPermissions } =
    usePermissionsByApplication(applicationId);
  const { mutateAsync: addRole, isPending: isAddingRole } = useAddRole();
  const { mutateAsync: updateRole, isPending: isUpdatingRole } = useUpdateRole();
  const { mutateAsync: deleteRole, isPending: isDeletingRole } = useDeleteRole();
  const { mutateAsync: addRolePermissions } = useAddRolePermissions();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      code: '',
      permissions: [],
    },
  });

  const onSubmit = async (values: RoleFormValues) => {
    try {
      const newRole = await addRole({
        name: values.code,
        description: `Role for ${values.code}`,
        departmentId: departmentId,
        parentId: null,
        status: 'ACTIVE',
      });

      if (values.permissions && values.permissions.length > 0) {
        await addRolePermissions({
          roleId: newRole.id,
          permissions: values.permissions,
        });
      }

      toast.success('Role added', {
        description: 'Role has been added successfully.',
      });

      form.reset();
      setCreateDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmation('');
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setRoleToEdit(role);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async (roleId: number, data: any) => {
    try {
      await updateRole({ id: roleId, data });
      toast.success('Role updated', {
        description: 'Role has been updated successfully.',
      });
      refetch();
    } catch (error) {
      toast.error('Failed to update role', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete || deleteConfirmation !== roleToDelete?.name) {
      return;
    }

    try {
      await deleteRole(roleToDelete?.id);

      toast.success('Role deleted', {
        description: 'Role has been deleted successfully.',
      });

      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      setDeleteConfirmation('');
      refetch();
    } catch (error) {
      toast.error('Failed to delete role', {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  const handleViewRole = (role: Role) => {
    setSelectedRole(role);
    setViewDialogOpen(true);
  };

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isDeleteConfirmed = deleteConfirmation === roleToDelete?.name;

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <div className='relative w-full max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            type='search'
            placeholder='Search roles...'
            className='pl-8'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>Add Role</Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Add Role</DialogTitle>
              <DialogDescription>Add a new role to this department.</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4 py-4'
              >
                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter role code'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>A unique identifier for this role</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isLoadingPermissions ? (
                  <div>Loading available permissions...</div>
                ) : permissions.length > 0 ? (
                  <FormField
                    control={form.control}
                    name='permissions'
                    render={() => (
                      <FormItem>
                        <div className='mb-4'>
                          <FormLabel>Permissions</FormLabel>
                          <FormDescription>Select the permissions for this role</FormDescription>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {permissions.map((permission) => (
                            <FormField
                              key={permission.id}
                              control={form.control}
                              name='permissions'
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={permission.id}
                                    className='flex flex-row items-start space-x-3 space-y-0'
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                permission.id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== permission.id,
                                                ),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className='font-normal'>{permission.name}</FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No permissions available for this application.
                  </p>
                )}

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isAddingRole}
                  >
                    {isAddingRole ? 'Adding...' : 'Add Role'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <RoleEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={roleToEdit}
          permissions={permissions}
          isLoadingPermissions={isLoadingPermissions}
          onUpdate={handleUpdateRole}
          isUpdating={isUpdatingRole}
        />

        <Dialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription>Details for role {selectedRole?.name}</DialogDescription>
            </DialogHeader>
            <div className='py-4'>
              <h3 className='font-medium'>Role Code</h3>
              <p className='text-sm text-muted-foreground mb-4'>{selectedRole?.name}</p>

              <h3 className='font-medium'>Role ID</h3>
              <p className='text-sm text-muted-foreground mb-4'>{selectedRole?.id}</p>

              <h3 className='font-medium'>Department ID</h3>
              <p className='text-sm text-muted-foreground mb-4'>{departmentId}</p>

              <h3 className='font-medium'>Application ID</h3>
              <p className='text-sm text-muted-foreground mb-4'>{applicationId}</p>

              <h3 className='font-medium'>Permissions</h3>
              <div className='mt-2 space-y-1'>
                {isLoadingPermissions ? (
                  <p>Loading permissions...</p>
                ) : permissions.length > 0 ? (
                  permissions.map((permission) => (
                    <Badge
                      key={permission.id}
                      variant='outline'
                      className='mr-1 mb-1'
                    >
                      {permission.name}
                    </Badge>
                  ))
                ) : (
                  <span className='text-sm text-muted-foreground'>No permissions available</span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setRoleToDelete(null);
              setDeleteConfirmation('');
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Role</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the role and all its
                associated permissions.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-2'>
              <p>
                To confirm, type <span className=' font-bold'>{roleToDelete?.name}</span> below:
              </p>
              <div className='space-y-2'>
                <Label htmlFor='confirmation'>Confirmation</Label>
                <Input
                  id='confirmation'
                  value={deleteConfirmation}
                  onChange={(e) => {
                    setDeleteConfirmation(e.target.value);
                  }}
                  placeholder={`Type '${roleToDelete?.name}' to confirm`}
                  className='w-full'
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setRoleToDelete(null);
                  setDeleteConfirmation('');
                }}
                disabled={isDeletingRole}
                type='button'
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleConfirmDelete}
                disabled={!isDeleteConfirmed || isDeletingRole}
              >
                {isDeletingRole ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className='grid gap-2 animate-pulse'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className='h-10 rounded-lg bg-muted'
            />
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className='text-center py-6 text-muted-foreground'>
          No roles found. {searchTerm ? 'Try adjusting your search.' : 'Add a role to get started.'}
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role, i) => (
                <TableRow key={role.id || i}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell>{role.description || 'No description'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewRole(role)}>
                          <Eye className='mr-2 h-4 w-4' /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(role)}>
                          <Edit className='mr-2 h-4 w-4' /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className='text-destructive focus:text-destructive cursor-pointer'
                          onClick={() => handleDeleteClick(role)}
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
      )}
    </div>
  );
}
