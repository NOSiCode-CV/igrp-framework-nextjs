// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import {
//   IGRPBadgePrimitive,
//   IGRPButtonPrimitive,
//   IGRPDropdownMenuPrimitive,
//   IGRPDropdownMenuContentPrimitive,
//   IGRPDropdownMenuItemPrimitive,
//   IGRPDropdownMenuLabelPrimitive,
//   IGRPDropdownMenuSeparatorPrimitive,
//   IGRPDropdownMenuTriggerPrimitive,
//   IGRPTablePrimitive,
//   IGRPTableBodyPrimitive,
//   IGRPTableCellPrimitive,
//   IGRPTableHeadPrimitive,
//   IGRPTableHeaderPrimitive,
//   IGRPTableRowPrimitive,
//   useIGRPToast,
//   IGRPIcon,
// } from '@igrp/igrp-framework-react-design-system';
// import { IGRPApplicationArgs } from '@igrp/framework-next-types';

// import { Permission } from '../types';
// import { useDeletePermission } from '../hooks/use-permission';
// import { PermissionEditDialog } from './edit-dialog';
// import { PermissionDeleteDialog } from './delete-dialog';

// interface PermissionTableProps {
//   permissions: Permission[];
//   onRefresh?: () => void;
//   hideApplicationColumn?: boolean;
// }
// type PermissionToDelete = {
//   id: number;
//   name: string;
// };

// export function PermissionTable({
//   permissions,
//   onRefresh,
//   hideApplicationColumn = false,
// }: PermissionTableProps) {
//   const { mutateAsync: deletePermission } = useDeletePermission();
//   const [permissionToDelete, setPermissionToDelete] = useState<PermissionToDelete | null>(null);
//   const [permissionToEdit, setPermissionToEdit] = useState<Permission | null>(null);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [editDialogOpen, setEditDialogOpen] = useState(false);

//   const { igrpToast } = useIGRPToast();

//   const handleDelete = (id: number, name: string) => {
//     setPermissionToDelete({ id, name });
//     setDeleteDialogOpen(true);
//   };

//   const handleEdit = (permission: Permission) => {
//     setPermissionToEdit(permission);
//     setEditDialogOpen(true);
//   };

//   const confirmDelete = async () => {
//     if (!permissionToDelete) return;

//     const promise = deletePermission(permissionToDelete.id);
//     igrpToast({
//       promise: promise,
//       loading: 'Deleting permission...',
//       success: `Permission '${permissionToDelete.name}' deleted successfully.`,
//       error: (err) => `Failed to delete: ${(err as Error).message}`,
//       duration: 4000,
//     });

//     try {
//       await promise;
//       if (onRefresh) {
//         onRefresh();
//       }
//     } finally {
//       setTimeout(() => {
//         setDeleteDialogOpen(false);
//         setPermissionToDelete(null);
//       }, 4000);
//     }
//   };

//   const handleEditSuccess = () => {
//     if (onRefresh) onRefresh();
//   };

//   return (
//     <>
//       <div className='rounded-md border'>
//         <IGRPTablePrimitive>
//           <IGRPTableHeaderPrimitive>
//             <IGRPTableRowPrimitive>
//               <IGRPTableHeadPrimitive>Nome</IGRPTableHeadPrimitive>
//               <IGRPTableHeadPrimitive>Descrição</IGRPTableHeadPrimitive>
//               {!hideApplicationColumn && <IGRPTableHeadPrimitive>Aplicação</IGRPTableHeadPrimitive>}
//               <IGRPTableHeadPrimitive>Estado</IGRPTableHeadPrimitive>
//               <IGRPTableHeadPrimitive className='w-25'></IGRPTableHeadPrimitive>
//             </IGRPTableRowPrimitive>
//           </IGRPTableHeaderPrimitive>
//           <IGRPTableBodyPrimitive>
//             {permissions.map((perm) => (
//               <IGRPTableRowPrimitive key={perm.id}>
//                 <IGRPTableCellPrimitive className='font-medium'>
//                   <Link
//                     href={`/permissions/${perm.id}`}
//                     className='cursor-pointer hover:underline text-primary'
//                   >
//                     {perm.name}
//                   </Link>
//                 </IGRPTableCellPrimitive>
//                 <IGRPTableCellPrimitive>
//                   {perm.description || 'No description'}
//                 </IGRPTableCellPrimitive>

//                 <IGRPTableCellPrimitive>
//                   <IGRPBadgePrimitive variant={perm.status === 'ACTIVE' ? 'default' : 'outline'}>
//                     {perm.status}
//                   </IGRPBadgePrimitive>
//                 </IGRPTableCellPrimitive>
//                 <IGRPTableCellPrimitive>
//                   <IGRPDropdownMenuPrimitive>
//                     <IGRPDropdownMenuTriggerPrimitive asChild>
//                       <IGRPButtonPrimitive
//                         variant='ghost'
//                         className='h-8 w-8 p-0'
//                       >
//                         <span className='sr-only'>Open menu</span>
//                         <IGRPIcon
//                           iconName='MoreHorizontal'
//                           className='size-4'
//                         />
//                       </IGRPButtonPrimitive>
//                     </IGRPDropdownMenuTriggerPrimitive>
//                     <IGRPDropdownMenuContentPrimitive align='end'>
//                       <IGRPDropdownMenuLabelPrimitive>Ações</IGRPDropdownMenuLabelPrimitive>
//                       <IGRPDropdownMenuItemPrimitive asChild>
//                         <Link href={`/permissions/${perm.id}`}>
//                           <IGRPIcon
//                             iconName='Eye'
//                             className='mr-2 size-4'
//                           />{' '}
//                           Ver
//                         </Link>
//                       </IGRPDropdownMenuItemPrimitive>
//                       <IGRPDropdownMenuItemPrimitive onClick={() => handleEdit(perm)}>
//                         <IGRPIcon
//                           iconName='Edit'
//                           className='mr-2 h-4 w-4'
//                         />{' '}
//                         Editar
//                       </IGRPDropdownMenuItemPrimitive>
//                       <IGRPDropdownMenuSeparatorPrimitive />
//                       <IGRPDropdownMenuItemPrimitive
//                         className='text-destructive focus:text-destructive cursor-pointer'
//                         onClick={() => handleDelete(perm.id, perm.name)}
//                       >
//                         <IGRPIcon
//                           iconName='Trash'
//                           className='mr-2 size-4'
//                         />{' '}
//                         Eliminar
//                       </IGRPDropdownMenuItemPrimitive>
//                     </IGRPDropdownMenuContentPrimitive>
//                   </IGRPDropdownMenuPrimitive>
//                 </IGRPTableCellPrimitive>
//               </IGRPTableRowPrimitive>
//             ))}
//           </IGRPTableBodyPrimitive>
//         </IGRPTablePrimitive>
//       </div>

//       {permissionToDelete && (
//         <PermissionDeleteDialog
//           open={deleteDialogOpen}
//           onOpenChange={setDeleteDialogOpen}
//           permissionName={permissionToDelete.name}
//           onDelete={confirmDelete}
//         />
//       )}

//       {permissionToEdit && (
//         <PermissionEditDialog
//           open={editDialogOpen}
//           onOpenChange={setEditDialogOpen}
//           permission={permissionToEdit}
//           onSuccess={handleEditSuccess}
//         />
//       )}
//     </>
//   );
// }
