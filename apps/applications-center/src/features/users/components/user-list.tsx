'use client';

import { useEffect, useId, useRef, useState } from 'react';

// import { UserDeleteDialog } from '@/features/users/components/delete-dialog';
// import { UserInviteDialog } from '@/features/users/components/invite-dialog';
import { useUsers, useCurrentUser } from '@/features/users/use-users';
import {
  cn,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  IGRPBadge,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPLabelPrimitive,
  IGRPPaginationContentPrimitive,
  IGRPPaginationItemPrimitive,
  IGRPPaginationPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  PaginationState,
  RowSelectionState,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';
import { ROUTES } from '@/lib/constants';
import { ButtonLink } from '@/components/button-link';
import { PageHeader } from '@/components/page-header';
import { AppCenterLoading } from '@/components/loading';
import { showStatus, statusClass } from '@/lib/utils';
import { IGRPUserDTO } from '@igrp/platform-access-management-client-ts';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

const multiColumnFilterFn: FilterFn<IGRPUserDTO> = (row, _columnId, filterValue) => {
  const term = String(filterValue ?? '')
    .toLowerCase()
    .trim();
  if (!term) return true;
  const name = String(row.original?.name ?? '').toLowerCase();
  const desc = String(row.original?.username ?? '').toLowerCase();
  return name.includes(term) || desc.includes(term);
};

const columns: ColumnDef<IGRPUserDTO>[] = [
  {
    header: 'UserName',
    accessorKey: 'username',
    cell: ({ row }) => <div><IGRPTooltipProviderPrimitive>
      <IGRPTooltipPrimitive>
        <IGRPTooltipTriggerPrimitive asChild>
          <ButtonLink
            href={ROUTES.USER_PROFILE}
            className='underline underline-offset-2 hover:text-primary hover:no-underline'
            label={row.getValue('username')}
            icon={''}
            variant='link'
          />
        </IGRPTooltipTriggerPrimitive>
        <IGRPTooltipContentPrimitive className='px-2 py-1 text-xs'>
          Ver Perfil
        </IGRPTooltipContentPrimitive>
      </IGRPTooltipPrimitive>
    </IGRPTooltipProviderPrimitive></div>,
    enableSorting: false,
    filterFn: multiColumnFilterFn,
    enableColumnFilter: true,
  },
  {
    header: 'Email',
    accessorKey: 'email',
    cell: ({ row }) => <div>{row.getValue('email') || 'N/A'}</div>,
    enableSorting: false,
  },
  {
    header: 'Nome',
    accessorKey: 'name',
    cell: ({ row }) => <div>{row.getValue('name') || 'N/A'}</div>,
    enableSorting: false,
  },
];

export function UserList() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ username: string; email: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [data, setData] = useState<IGRPUserDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: users, isLoading, error } = useUsers();
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();

  // const { mutateAsync: deleteUser } = useDeleteUser();

  const { igrpToast } = useIGRPToast();

  useEffect(() => {
    setData(users ?? []);
  }, [users]);

  const table = useReactTable({
    data,
    columns,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    state: { pagination, columnFilters },
  });


  if (isLoading || !users) {
    return <AppCenterLoading descrption='Carregando utilizadores...' />;
  }

  if (error) throw error;


  const handleDelete = (username: string, email: string) => {
    setUserToDelete({ username, email });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      // await deleteUser(userToDelete.username);

      igrpToast({
        type: 'success',
        title: 'Elinimar Utilizador',
        description: `Utilizador '${userToDelete.email}' eliminado com sucesso`,
      });
    } catch (error) {
      console.error('Falha ao eliminar utilizador:', error);
      igrpToast({
        type: 'error',
        title: 'Falha ao eliminar utilizador',
        description: `Tente novamente. ${error}`,
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCurrentUser = (email: string) => {
    if (currentUser?.email === email) return true;
    return false;
  };

  return (
    <div className='flex flex-col gap-10 animate-fade-in'>
      <PageHeader
        title='Gestão de Utilizadores'
        description='Ver e gerir todos os utilizadores do sistema.'
        showActions
      >
        <ButtonLink
          onClick={() => setInviteDialogOpen(true)}
          icon='UserRoundPlus'
          href='#'
          label='Convidar Utilizador'
        />
      </PageHeader>

      <div className='flex flex-col sm:flex-row gap-2 mt-4'>
        <div className='relative w-full max-w-sm'>
          <IGRPIcon
            iconName='Search'
            className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground'
          />
          <IGRPInputPrimitive
            id={`${id}-input`}
            ref={inputRef}
            className={cn(
              'peer ps-9 border-foreground/30 focus-visible:ring-[2px] focus-visible:ring-foreground/30 focus-visible:border-foreground/30',
              Boolean(table.getColumn('name')?.getFilterValue()) && 'pe-9',
            )}
            value={(table.getColumn('name')?.getFilterValue() ?? '') as string}
            onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
            placeholder='Filtar por nome...'
            type='text'
            aria-label='Filtar por nome'
          />
          {Boolean(table.getColumn('name')?.getFilterValue()) && (
            <button
              className='text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-2 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Clear filter'
              onClick={() => {
                table.getColumn('name')?.setFilterValue('');
                inputRef.current?.focus();
              }}
            >
              <IGRPIcon iconName='CircleX' />
            </button>
          )}
        </div>
      </div>

      <div className='border rounded-md'>
        <IGRPTablePrimitive>
          <IGRPTableHeaderPrimitive className='bg-muted'>
            {table.getHeaderGroups().map((headerGroup) => (
              <IGRPTableRowPrimitive key={headerGroup.id} className='border-b dark:border-slate-800/60'>
                {headerGroup.headers.map((header) => (
                  <IGRPTableHeadPrimitive
                    key={header.id}
                    className='px-4 py-3 font-semibold'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </IGRPTableHeadPrimitive>
                ))}
              </IGRPTableRowPrimitive>

            ))}
          </IGRPTableHeaderPrimitive>

          <IGRPTableBodyPrimitive>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <IGRPTableRowPrimitive
                  key={row.id}
                  className='border-b dark:border-slate-800/60'
                >
                  {row.getVisibleCells().map((cell) => (
                    <IGRPTableCellPrimitive key={cell.id} className='p-4'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </IGRPTableCellPrimitive>
                  ))}
                </IGRPTableRowPrimitive>
              ))
            ) : (
              <IGRPTableRowPrimitive>
                <IGRPTableCellPrimitive
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Nenhum utilizador encontrado.
                </IGRPTableCellPrimitive>
              </IGRPTableRowPrimitive>
            )}
            
              {/* <IGRPTableCellPrimitive className='p-4 text-base'>
                {isCurrentUser(user.email) ? (
                  <IGRPTooltipProviderPrimitive>
                    <IGRPTooltipPrimitive>
                      <IGRPTooltipTriggerPrimitive asChild>
                        <ButtonLink
                          href={ROUTES.USER_PROFILE}
                          className='underline underline-offset-2 hover:text-primary hover:no-underline'
                          label={user.username}
                          icon={''}
                          variant='link'
                        />
                      </IGRPTooltipTriggerPrimitive>
                      <IGRPTooltipContentPrimitive className='px-2 py-1 text-xs'>
                        Ver Perfil
                      </IGRPTooltipContentPrimitive>
                    </IGRPTooltipPrimitive>
                  </IGRPTooltipProviderPrimitive>
                ) : (
                  user.username
                )}
              </IGRPTableCellPrimitive>
              
              <IGRPTableCellPrimitive className='p-4'>
                {isCurrentUser(user.email) ? (
                  <IGRPBadge>{`It's you`}</IGRPBadge>
                ) : (
                  <IGRPButtonPrimitive
                    variant='destructive'
                    size='icon'
                    className='size-7 text-destructive bg-transparent hover:text-white dark:text-white hover:bg-destructive/60 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60'
                    onClick={() => handleDelete(user.username, user.email)}
                  >
                    <IGRPIcon
                      iconName='Trash2'
                      strokeWidth={2}
                    />
                  </IGRPButtonPrimitive>
                )}
              </IGRPTableCellPrimitive> */} 
            
          </IGRPTableBodyPrimitive>
        </IGRPTablePrimitive>
      </div>

      <div className='flex items-center justify-between gap-8'>
        <div className='flex items-center justify-end gap-3'>
          <IGRPLabelPrimitive
            htmlFor={`${id}-per-page`}
            className='max-sm:sr-only'
          >
            Rows per page
          </IGRPLabelPrimitive>
          <IGRPSelectPrimitive
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <IGRPSelectTriggerPrimitive
              id={`${id}-per-page`}
              className='w-fit whitespace-nowrap'
            >
              <IGRPSelectValuePrimitive placeholder='Select number of results' />
            </IGRPSelectTriggerPrimitive>
            <IGRPSelectContentPrimitive className='[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2'>
              {[5, 10, 25, 50].map((pageSize) => (
                <IGRPSelectItemPrimitive
                  key={pageSize}
                  value={pageSize.toString()}
                >
                  {pageSize}
                </IGRPSelectItemPrimitive>
              ))}
            </IGRPSelectContentPrimitive>
          </IGRPSelectPrimitive>
        </div>

        <div className='text-muted-foreground flex grow justify-end text-sm whitespace-nowrap'>
          <p
            className='text-muted-foreground text-sm whitespace-nowrap'
            aria-live='polite'
          >
            <span className='text-foreground'>
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  table.getState().pagination.pageSize,
                  0,
                ),
                table.getRowCount(),
              )}
            </span>{' '}
            of <span className='text-foreground'>{table.getRowCount().toString()}</span>
          </p>
        </div>

        <div>
          <IGRPPaginationPrimitive>
            <IGRPPaginationContentPrimitive>
              <IGRPPaginationItemPrimitive>
                <IGRPButtonPrimitive
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to first page'
                >
                  <IGRPIcon iconName='ChevronFirst' />
                </IGRPButtonPrimitive>
              </IGRPPaginationItemPrimitive>
              <IGRPPaginationItemPrimitive>
                <IGRPButtonPrimitive
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label='Go to previous page'
                >
                  <IGRPIcon iconName='ChevronLeft' />
                </IGRPButtonPrimitive>
              </IGRPPaginationItemPrimitive>
              <IGRPPaginationItemPrimitive>
                <IGRPButtonPrimitive
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to next page'
                >
                  <IGRPIcon iconName='ChevronRight' />
                </IGRPButtonPrimitive>
              </IGRPPaginationItemPrimitive>
              <IGRPPaginationItemPrimitive>
                <IGRPButtonPrimitive
                  size='icon'
                  variant='outline'
                  className='disabled:pointer-events-none disabled:opacity-50'
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label='Go to last page'
                >
                  <IGRPIcon iconName='ChevronLast' />
                </IGRPButtonPrimitive>
              </IGRPPaginationItemPrimitive>
            </IGRPPaginationContentPrimitive>
          </IGRPPaginationPrimitive>
        </div>
      </div>

      {/* {userToDelete && (
        <UserDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          userName={userToDelete.username}
          onDelete={confirmDelete}
        />
      )}

      {inviteDialogOpen && (
        <UserInviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )} */}
    </div>
  );
}
