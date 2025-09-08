// 'use client';

// import { useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';

// import {
//   IGRPDialogPrimitive,
//   IGRPDialogContentPrimitive,
//   IGRPDialogDescriptionPrimitive,
//   IGRPDialogFooterPrimitive,
//   IGRPDialogHeaderPrimitive,
//   IGRPDialogTitlePrimitive,
// } from '@igrp/igrp-framework-react-design-system';
// import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
// import {
//   IGRPFormPrimitive,
//   IGRPFormControlPrimitive,
//   IGRPFormDescriptionPrimitive,
//   IGRPFormFieldPrimitive,
//   IGRPFormItemPrimitive,
//   IGRPFormLabelPrimitive,
// } from '@igrp/igrp-framework-react-design-system';
// import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
// import { IGRPTextAreaPrimitive } from '@igrp/igrp-framework-react-design-system';
// import { IIGRPCheckboxPrimitive } from '@igrp/igrp-framework-react-design-system';
// import { useRolePermissions, useAddRolePermissions, useRemoveRolePermissions } from '../use-roles';

// const roleEditSchema = z.object({
//   name: z.string().min(2, 'Role name is required'),
//   description: z.string().optional(),
//   permissions: z.array(z.number()).optional(),
// });

// type RoleEditFormValues = z.infer<typeof roleEditSchema>;

// interface Role {
//   id: number;
//   name: string;
//   description?: string;
//   departmentId: number;
// }

// interface RoleEditDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   role: Role | null;
//   permissions: Array<{ id: number; name: string }>;
//   isLoadingPermissions: boolean;
//   onUpdate: (roleId: number, data: RoleEditFormValues) => Promise<void>;
//   isUpdating: boolean;
// }

// export function RoleEditDialog({
//   open,
//   onOpenChange,
//   role,
//   permissions,
//   isLoadingPermissions,
//   onUpdate,
//   isUpdating,
// }: RoleEditDialogProps) {
//   const { data: currentPermissions = [], isLoading: isLoadingCurrentPermissions } =
//     useRolePermissions(role?.id || 0);
//   const { mutateAsync: addPermissions } = useAddRolePermissions();
//   const { mutateAsync: removePermissions } = useRemoveRolePermissions();

//   const form = useForm<RoleEditFormValues>({
//     resolver: zodResolver(roleEditSchema),
//     defaultValues: {
//       name: '',
//       description: '',
//       permissions: [],
//     },
//   });

//   useEffect(() => {
//     if (role && open && !isLoadingCurrentPermissions) {
//       const permissionIds = currentPermissions?.map((p) => p.id) || [];
//       form.reset({
//         name: role.name,
//         description: role.description || '',
//         permissions: permissionIds,
//       });
//     }
//   }, [role, form, open, currentPermissions, isLoadingCurrentPermissions]);

//   const onSubmit = async (values: RoleEditFormValues) => {
//     if (!role) return;

//     try {
//       await onUpdate(role.id, {
//         name: values.name,
//         description: values.description,
//       });

//       const currentPerms = currentPermissions?.map((p) => p.id) || [];
//       const newPerms = values.permissions || [];

//       const toAdd = newPerms.filter((p) => !currentPerms.includes(p));
//       const toRemove = currentPerms.filter((p) => !newPerms.includes(p));

//       if (toAdd.length > 0) {
//         await addPermissions({ roleId: role.id, permissions: toAdd });
//       }

//       if (toRemove.length > 0) {
//         await removePermissions({ roleId: role.id, permissions: toRemove });
//       }

//       onOpenChange(false);
//     } catch (error) {
//       throw error;
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={onOpenChange}
//     >
//       <DialogContent className='sm:max-w-[500px]'>
//         <DialogHeader>
//           <DialogTitle>Edit Role</DialogTitle>
//           <DialogDescription>Update the role information and permissions.</DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className='space-y-4 py-4'
//           >
//             <FormField
//               control={form.control}
//               name='name'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Role Name</FormLabel>
//                   <FormControl>
//                     <Input
//                       placeholder='Enter role name'
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>The name of the role</FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name='description'
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Description</FormLabel>
//                   <FormControl>
//                     <Textarea
//                       placeholder='Enter role description'
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormDescription>Optional description of the role</FormDescription>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {isLoadingPermissions || isLoadingCurrentPermissions ? (
//               <div>Loading available permissions...</div>
//             ) : permissions.length > 0 ? (
//               <FormField
//                 control={form.control}
//                 name='permissions'
//                 render={() => (
//                   <FormItem>
//                     <div className='mb-4'>
//                       <FormLabel>Permissions</FormLabel>
//                       <FormDescription>Select the permissions for this role</FormDescription>
//                     </div>
//                     <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
//                       {permissions.map((permission) => (
//                         <FormField
//                           key={permission.id}
//                           control={form.control}
//                           name='permissions'
//                           render={({ field }) => {
//                             return (
//                               <FormItem
//                                 key={permission.id}
//                                 className='flex flex-row items-start space-x-3 space-y-0'
//                               >
//                                 <FormControl>
//                                   <Checkbox
//                                     checked={field.value?.includes(permission.id)}
//                                     onCheckedChange={(checked) => {
//                                       return checked
//                                         ? field.onChange([...(field.value || []), permission.id])
//                                         : field.onChange(
//                                             field.value?.filter((value) => value !== permission.id),
//                                           );
//                                     }}
//                                   />
//                                 </FormControl>
//                                 <FormLabel className='font-normal'>{permission.name}</FormLabel>
//                               </FormItem>
//                             );
//                           }}
//                         />
//                       ))}
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             ) : (
//               <p className='text-sm text-muted-foreground'>
//                 No permissions available for this application.
//               </p>
//             )}

//             <DialogFooter>
//               <Button
//                 type='button'
//                 variant='outline'
//                 onClick={() => onOpenChange(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type='submit'
//                 disabled={isUpdating || isLoadingCurrentPermissions}
//               >
//                 {isUpdating ? 'Updating...' : 'Update Role'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// }
