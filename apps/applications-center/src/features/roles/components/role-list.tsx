'use client';

import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
import {
  IGRPButtonPrimitive,
  IGRPInputPrimitive,
  // IGRPLabelPrimitive,
  IGRPTablePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableRowPrimitive,
  // IGRPBadgePrimitive,
  // IGRPDialogPrimitive,
  // IGRPDialogContentPrimitive,
  // IGRPDialogDescriptionPrimitive,
  // IGRPDialogFooterPrimitive,
  // IGRPDialogHeaderPrimitive,
  // IGRPDialogTitlePrimitive,
  IGRPDropdownMenuPrimitive,
  // IGRPDropdownMenuContentPrimitive,
  // IGRPDropdownMenuItemPrimitive,
  // IGRPDropdownMenuLabelPrimitive,
  // IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  // IGRPFormPrimitive,
  // IGRPFormControlPrimitive,
  // IGRPFormDescriptionPrimitive,
  // IGRPFormFieldPrimitive,
  // IGRPFormItemPrimitive,
  // IGRPFormLabelPrimitive,
  // useIGRPToast,
  IGRPIcon,
  // IGRPDialogTriggerPrimitive,
  // IGRPFormMessagePrimitive,
  IGRPCardPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { useRoles } from '../use-roles';
// import { RoleEditDialog } from './role-edit';
import { ButtonLink } from '@/components/button-link';
import { AppCenterLoading } from '@/components/loading';
// import { useCurrentUser } from '@/features/users/use-users';
// import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';
import { RoleFormDialog } from './role-form-dialog';

interface RolesListProps {
  departmentCode: string;
  username: string;
}

export function RolesList({ departmentCode, username }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFormDialog, setOpenFormDialog] = useState(false);
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  // const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  // const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const { data: roles, isLoading, error: error } = useRoles({ departmentCode, username });

  if (isLoading) return <AppCenterLoading descrption='A carregar perfis...' />;

  // const { mutateAsync: deleteRole, isPending: isDeletingRole } = useDeleteRole();
  // const { mutateAsync: addRolePermissions } = useAddRolePermissions();

  // const handleDeleteClick = (role: Role) => {
  //   setRoleToDelete(role);
  //   setDeleteConfirmation('');
  //   setDeleteDialogOpen(true);
  // };

  // const handleEditClick = (role: Role) => {
  //   setRoleToEdit(role);
  //   setEditDialogOpen(true);
  // };

  // const handleUpdateRole = async (roleId: number, data: any) => {
  //   try {
  //     await updateRole({ id: roleId, data });
  //     toast.success('Role updated', {
  //       description: 'Role has been updated successfully.',
  //     });
  //     refetch();
  //   } catch (error) {
  //     toast.error('Failed to update role', {
  //       description: error instanceof Error ? error.message : 'An unknown error occurred',
  //     });
  //   }
  // };

  // const handleConfirmDelete = async () => {
  //   if (!roleToDelete || deleteConfirmation !== roleToDelete?.name) {
  //     return;
  //   }

  //   try {
  //     await deleteRole(roleToDelete?.id);

  //     toast.success('Role deleted', {
  //       description: 'Role has been deleted successfully.',
  //     });

  //     setDeleteDialogOpen(false);
  //     setRoleToDelete(null);
  //     setDeleteConfirmation('');
  //     refetch();
  //   } catch (error) {
  //     toast.error('Failed to delete role', {
  //       description: error instanceof Error ? error.message : 'An unknown error occurred',
  //     });
  //   }
  // };

  // const handleViewRole = (role: Role) => {
  //   setSelectedRole(role);
  //   setViewDialogOpen(true);
  // };

  // const isDeleteConfirmed = deleteConfirmation === roleToDelete?.name;

  if (error) {
    return (
      <div className='rounded-md border py-6'>
        <p className='text-center'>Ocorreu um erro ao carregar roles.</p>
        <p className='text-center'>{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <>
      <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 py-6'>
        <IGRPCardHeaderPrimitive>
          <div className='flex items-center justify-between'>
            <div>
              <IGRPCardTitlePrimitive>Perfis</IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive>
                Gerir e reorganizar os perfis.
              </IGRPCardDescriptionPrimitive>
            </div>
            {/* {/* {!menuEmpty && ( */}
            <div className='flex justify-end'>
              <ButtonLink
                onClick={() => {
                  setOpenFormDialog(true);
                }}
                icon='UserLock'
                href='#'
                label='Novo Perfil'
              />
            </div>
            {/* )} */}
          </div>
        </IGRPCardHeaderPrimitive>

        <IGRPCardContentPrimitive className='flex flex-col gap-6'>
          <div className='flex justify-between items-center'>
            <div className='relative w-full max-w-sm'>
              <IGRPIcon
                iconName='Search'
                className='absolute left-2.5 top-2.5 size-4 text-muted-foreground'
              />
              <IGRPInputPrimitive
                type='search'
                placeholder='Pesquisar Perfil...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* EDIT */}

            {/* <RoleEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={roleToEdit}
          permissions={permissions}
          isLoadingPermissions={isLoadingPermissions}
          onUpdate={handleUpdateRole}
          isUpdating={isUpdatingRole}
        /> */}

            {/* VIEW */}

            {/* <IGRPDialogPrimitive
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        >
          <IGRPDialogContentPrimitive>
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Role Details</IGRPDialogTitlePrimitive>
              <IGRPDialogDescriptionPrimitive>Details for role {selectedRole?.name}</IGRPDialogDescriptionPrimitive>
            </IGRPDialogHeaderPrimitive>
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
                    <IGRPBadgePrimitive
                      key={permission.id}
                      variant='outline'
                      className='mr-1 mb-1'
                    >
                      {permission.name}
                    </IGRPBadgePrimitive>
                  ))
                ) : (
                  <span className='text-sm text-muted-foreground'>No permissions available</span>
                )}
              </div>
            </div>
            <IGRPDialogFooterPrimitive>
              <IGRPButtonPrimitive
                variant='outline'
                onClick={() => setViewDialogOpen(false)}
              >
                Close
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive> */}

            {/* DELETE DIALOG */}

            {/* <IGRPDialogPrimitive
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) {
              setRoleToDelete(null);
              setDeleteConfirmation('');
            }
          }}
        >
          <IGRPDialogContentPrimitive>
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Delete Role</IGRPDialogTitlePrimitive>
              <IGRPDialogDescriptionPrimitive>
                This action cannot be undone. This will permanently delete the role and all its
                associated permissions.
              </IGRPDialogDescriptionPrimitive>
            </IGRPDialogHeaderPrimitive>
            <div className='space-y-4 py-2'>
              <p>
                To confirm, type <span className=' font-bold'>{roleToDelete?.name}</span> below:
              </p>
              <div className='space-y-2'>
                <IGRPLabelPrimitive htmlFor='confirmation'>Confirmation</IGRPLabelPrimitive>
                <IGRPInputPrimitive
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
            <IGRPDialogFooterPrimitive>
              <IGRPButtonPrimitive
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
              </IGRPButtonPrimitive>
              <IGRPButtonPrimitive
                variant='destructive'
                onClick={handleConfirmDelete}
                disabled={!isDeleteConfirmed || isDeletingRole}
              >
                {isDeletingRole ? 'Deleting...' : 'Delete'}
              </IGRPButtonPrimitive>
            </IGRPDialogFooterPrimitive>
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive> */}
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
          ) : filteredRoles?.length === 0 ? (
            <div className='text-center py-6 text-muted-foreground'>
              Nenhum perfil encontrado{' '}
              {searchTerm ? 'Tente ajustar a sua pesquisa.' : 'Adicione umperfil para começar.'}
            </div>
          ) : (
            <div className='rounded-md border'>
              <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                  <IGRPTableRowPrimitive>
                    <IGRPTableHeadPrimitive>Perfil</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive>Descrição</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className='w-[100px]'></IGRPTableHeadPrimitive>
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                  {filteredRoles?.map((role, i) => (
                    <IGRPTableRowPrimitive key={role.id || i}>
                      <IGRPTableCellPrimitive className='font-medium'>
                        {role.name}
                      </IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive>{role.description || 'N/A'}</IGRPTableCellPrimitive>
                      <IGRPTableCellPrimitive>
                        <IGRPDropdownMenuPrimitive>
                          <IGRPDropdownMenuTriggerPrimitive asChild>
                            <IGRPButtonPrimitive
                              variant='ghost'
                              className='h-8 w-8 p-0'
                            >
                              <span className='sr-only'>Open menu</span>
                              <IGRPIcon
                                iconName='Ellipsis'
                                className='size-4'
                              />
                            </IGRPButtonPrimitive>
                          </IGRPDropdownMenuTriggerPrimitive>
                          {/* <IGRPDropdownMenuContentPrimitive align='end'>
                          <IGRPDropdownMenuLabelPrimitive>Ações</IGRPDropdownMenuLabelPrimitive>
                          <IGRPDropdownMenuItemPrimitive onClick={() => handleViewRole(role)}>
                            <IGRPIcon
                              iconName='Eye'
                              className='mr-0.5 size-4'
                            />{' '}
                            Ver
                          </IGRPDropdownMenuItemPrimitive>
                          <IGRPDropdownMenuItemPrimitive onClick={() => handleEditClick(role)}>
                            <IGRPIcon
                              iconName='Pencil'
                              className='mr-0.5 size-4'
                            />{' '}
                            Editar
                          </IGRPDropdownMenuItemPrimitive>
                          <IGRPDropdownMenuSeparatorPrimitive />
                          <IGRPDropdownMenuItemPrimitive
                            onClick={() => handleDeleteClick(role)}
                            variant='destructive'
                          >
                            <IGRPIcon
                              iconName='Trash'
                              className='mr-0.5 size-4'
                            />{' '}
                            Eliminar
                          </IGRPDropdownMenuItemPrimitive>
                        </IGRPDropdownMenuContentPrimitive> */}
                        </IGRPDropdownMenuPrimitive>
                      </IGRPTableCellPrimitive>
                    </IGRPTableRowPrimitive>
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>
          )}
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <RoleFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        departmentCode={departmentCode}
        roles={roles}
      />
    </>
  );
}
