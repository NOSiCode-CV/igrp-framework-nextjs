"use client";

import {
  type ColumnDef,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPTooltipContentPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPUserAvatar,
  IGRPDataTable,
  IGRPDataTableClientFilterListProps,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableHeaderSortToggle,
  IGRPDropdownMenuSeparatorPrimitive,
  type Row
  // useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { UserInviteDialog } from "@/features/users/components/user-invite-dialog";
import {
  useCurrentUser,
  useUserRoles,
  useUsers,
} from "@/features/users/use-users";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { UserRolesDialog } from "./user-role-dialog";

export function UserList() {
  const [data, setData] = useState<IGRPUserDTO[]>([]);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    username: string;
    email: string;
  } | null>(null);

  const [assignRolesFor, setAssignRolesFor] = useState<{
    open: boolean;
    username: string | null;
    email: string | null;
  }>(() => ({ open: false, username: null, email: null }));

  const { data: users, isLoading, error } = useUsers();
  const { data: currentUser, isLoading: currentUserLoading } = useCurrentUser();

  // const { igrpToast } = useIGRPToast();

  useEffect(() => {
    setData(users ?? []);
  }, [users]);

  const columns: ColumnDef<IGRPUserDTO>[] = [
    {
      header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" />,
      accessorKey: "name",
      cell: ({ row }) => {
        const email = String(row.getValue("email"));
        const name = String(row.getValue("name"));

        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={name}
              fallbackContent={getInitials(name)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div>
              <div className="text-sm leading-none">{name}</div>
              <span className="text-muted-foreground text-xs">
                {email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => <div>{row.getValue("email") || "N/A"}</div>,
    },
    {
      header: "Username",
      accessorKey: "username",
      cell: ({ row }) => {
        const email = String(row.getValue("email"));
        const username = String(row.getValue("username"));

        return (
          <>
            {isCurrentUser(email) ? (
              <div className="flex items-center gap-3">
                <IGRPTooltipProviderPrimitive>
                  <IGRPTooltipPrimitive>
                    <IGRPTooltipTriggerPrimitive asChild>
                      <ButtonLink
                        href={ROUTES.USER_PROFILE}
                        className="underline underline-offset-2 hover:text-primary hover:no-underline"
                        btnClassName="px-0 gap-1"
                        label={username}
                        icon="UserCheck"
                        variant="link"
                      />
                    </IGRPTooltipTriggerPrimitive>
                    <IGRPTooltipContentPrimitive className="px-2 py-1 text-xs">
                      Ver Perfil
                    </IGRPTooltipContentPrimitive>
                  </IGRPTooltipPrimitive>
                </IGRPTooltipProviderPrimitive>
              </div>
            ) : (
              username
            )}
          </>
        );
      }
    },
    {
      header: "Estado",
      accessorKey: "status",
      cell: ({ row }) => <span>{row.getValue("status")}</span>

    },
    {
      id: "roles",
      header: 'Perfís',
      cell: ({ row }) => <RolesCountCell username={String(row.getValue("username"))} />,
    },

    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions row={row} />,
      size: 60,
      enableHiding: false,
    },
  ];

  function RowActions({ row }: { row: Row<IGRPUserDTO> }) {
    const email = String(row.getValue("email"));
    const username = String(row.getValue("username"));

    return (
      <IGRPDropdownMenuPrimitive>
        <IGRPDropdownMenuTriggerPrimitive className="p-1 rounded-sm">
          <IGRPIcon iconName="Ellipsis" />
        </IGRPDropdownMenuTriggerPrimitive>

        <IGRPDropdownMenuContentPrimitive align="end" className="min-w-44">
          <IGRPDropdownMenuItemPrimitive
            onSelect={() => setAssignRolesFor({ open: true, username, email })}
          >
            <IGRPIcon iconName="ShieldUser" />
            <span>Associar Perfís</span>
          </IGRPDropdownMenuItemPrimitive>

          {!isCurrentUser(email) && (
            <>
              <IGRPDropdownMenuSeparatorPrimitive />

              <IGRPDropdownMenuItemPrimitive
                className="text-destructive focus:text-destructive"
                onSelect={() => handleDelete(username, email)}
                variant='destructive'
              >
                <IGRPIcon iconName="CircleOff" />
                Remover
              </IGRPDropdownMenuItemPrimitive>
            </>
          )}
        </IGRPDropdownMenuContentPrimitive>
      </IGRPDropdownMenuPrimitive>
    );
  }

  function RolesCountCell({ username }: { username: string }) {
    const { data, isLoading, isError } = useUserRoles(username);

    if (isLoading) return <div>…</div>;
    if (isError) return <div>—</div>;

    const roles = data ?? [];
    const names = roles.map((r) => r.name);

    if (roles.length === 0) {
      return <div className="text-center">0</div>;
    }

    return (
      <IGRPTooltipProviderPrimitive>
        <IGRPTooltipPrimitive>
          <IGRPTooltipTriggerPrimitive asChild>
            <div className="text-center cursor-default">{roles.length}</div>
          </IGRPTooltipTriggerPrimitive>

          <IGRPTooltipContentPrimitive className="text-sm p-4">
            <div className="flex max-w-64 max-h-48 flex-col gap-2 overflow-auto">
              {names.map((n) => (
                <div key={`${username}-${n}-${n}`} className="truncate">
                  {n}
                </div>
              ))}
            </div>
          </IGRPTooltipContentPrimitive>
        </IGRPTooltipPrimitive>
      </IGRPTooltipProviderPrimitive>
    );
  }

  const filters: IGRPDataTableClientFilterListProps<IGRPUserDTO>[] = [
    {
      columnId: "name",
      component: (column) => <IGRPDataTableFilterInput column={column} />,
    },
    {
      columnId: "status",
      component: (column) => (
        <IGRPDataTableFilterFaceted
          column={column}
          options={STATUS_OPTIONS}
          placeholder="Estado"
        />
      ),
    },
  ];

  if (isLoading || !users) {
    return <AppCenterLoading descrption="Carregando utilizadores..." />;
  }

  if (error) throw error;

  const handleDelete = (username: string, email: string) => {
    setUserToDelete({ username, email });
    setDeleteDialogOpen(true);
  };

  const isCurrentUser = (email: string) => {
    if (currentUser?.email === email) return true;
    return false;
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Gestão de Utilizadores"
        description="Ver e gerir todos os utilizadores do sistema."
        showActions
      >
        <ButtonLink
          onClick={() => setInviteDialogOpen(true)}
          icon="UserRoundPlus"
          href="#"
          label="Convidar Utilizador"
        />
      </PageHeader>

      <IGRPDataTable<IGRPUserDTO, IGRPUserDTO>
        showFilter
        showPagination
        tableClassName="table-fixed"
        columns={columns}
        data={data}
        clientFilters={filters}
      />

      {inviteDialogOpen && (
        <UserInviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}

      {assignRolesFor.open && (
        <UserRolesDialog
          open={assignRolesFor.open}
          onOpenChange={(open) =>
            setAssignRolesFor({ ...assignRolesFor, open })
          }
          username={assignRolesFor.username as string}
        />
      )}
    </div>
  );
}
