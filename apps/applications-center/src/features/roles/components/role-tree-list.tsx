"use client";

import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuLabelPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { STATUS_OPTIONS } from "@/lib/constants";
import { showStatus, statusClass } from "@/lib/utils";
import type { RoleArgs } from "../role-schemas";
import { useRoles } from "../use-roles";
import { RoleDeleteDialog } from "./role-delete-dialog";
import { RoleFormDialog } from "./role-form-dialog";
import { RoleDetails } from "./role-permissions-dialog";

interface RolesListProps {
  departmentCode: string;
}

type RoleWithChildren = RoleArgs & { children?: RoleWithChildren[] };

export function RolesListTree({ departmentCode }: RolesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleArgs | undefined>(undefined);
  const [parentRoleName, setParentRoleName] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  const { data: roles, isLoading, error } = useRoles({ departmentCode });

  const buildRoleTree = (roles: RoleArgs[]): RoleWithChildren[] => {
    const map = new Map<string, RoleWithChildren>();
    const roots: RoleWithChildren[] = [];
    roles.forEach((role) => {
      map.set(role.name, { ...role, children: [] });
    });

    roles.forEach((role) => {
      const node = map.get(role.name)!;
      if (role.parentCode) {
        const parent = map.get(role.parentCode);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpand = (roleName: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleName)) {
      newExpanded.delete(roleName);
    } else {
      newExpanded.add(roleName);
    }
    setExpandedRoles(newExpanded);
  };

  const handleNewRole = () => {
    setSelectedRole(undefined);
    setParentRoleName(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleDelete = (code: string) => {
    setRoleToDelete(code);
    setOpenDeleteDialog(true);
  };

  const handleEdit = (role: RoleArgs) => {
    setSelectedRole(role);
    setParentRoleName(null);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handleNewSubRole = (role: RoleArgs) => {
    setSelectedRole(undefined);
    setParentRoleName(role.name);
    setRoleToDelete(null);
    setOpenDetailsDialog(false);
    setOpenFormDialog(true);
  };

  const handlePermissions = (role: RoleArgs) => {
    setSelectedRole(role);
    setRoleToDelete(null);
    setOpenFormDialog(false);
    setOpenDetailsDialog(true);
  };

  const RoleTreeRow = ({ 
    role, 
    level = 0 
  }: { 
    role: RoleWithChildren; 
    level?: number 
  }) => {
    const hasChildren = role.children && role.children.length > 0;
    const isExpanded = expandedRoles.has(role.name);

    return (
      <>
        <IGRPTableRowPrimitive 
          className={cn(
            level > 0 && "bg-muted/30"
          )}
        >
          <IGRPTableCellPrimitive className="font-medium">
            <div 
              className="flex items-center gap-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(role.name)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors"
                >
                  <IGRPIcon
                    iconName="ChevronRight"
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                    strokeWidth={2}
                  />
                </button>
              ) : (
                <div className="w-5" />
              )}
              
              <IGRPIcon 
                iconName="ShieldCheck" 
                className="w-4 h-4 text-primary shrink-0" 
                strokeWidth={2}
              />
              
              <span>{role.name}</span>
            </div>
          </IGRPTableCellPrimitive>
          
          <IGRPTableCellPrimitive>
            {role.description || "N/A"}
          </IGRPTableCellPrimitive>
          
          <IGRPTableCellPrimitive className="whitespace-nowrap">
            <IGRPBadgePrimitive
              className={cn(statusClass(role.status), "capitalize")}
            >
              {showStatus(role.status)}
            </IGRPBadgePrimitive>
          </IGRPTableCellPrimitive>
          
          <IGRPTableCellPrimitive>
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  variant="ghost"
                  className="size-8 p-0"
                >
                  <span className="sr-only">Abrir Menu</span>
                  <IGRPIcon iconName="Ellipsis" className="size-4" strokeWidth={2} />
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="end">
                <IGRPDropdownMenuLabelPrimitive>
                  Ações
                </IGRPDropdownMenuLabelPrimitive>
                <IGRPDropdownMenuItemPrimitive
                  onSelect={() => handleEdit(role)}
                >
                  <IGRPIcon
                    iconName="Pencil"
                    className="mr-2 size-4"
                    strokeWidth={2}
                  />
                  Editar
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive
                  onSelect={() => handleNewSubRole(role)}
                >
                  <IGRPIcon
                    iconName="Plus"
                    className="mr-2 size-4"
                    strokeWidth={2}
                  />
                  Criar sub perfil
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuItemPrimitive
                  onSelect={() => handlePermissions(role)}
                >
                  <IGRPIcon
                    iconName="ShieldCheck"
                    className="mr-2 size-4"
                    strokeWidth={2}
                  />
                  Permissões
                </IGRPDropdownMenuItemPrimitive>
                <IGRPDropdownMenuSeparatorPrimitive />
                <IGRPDropdownMenuItemPrimitive
                  onClick={() => handleDelete(role.code)}
                  variant="destructive"
                >
                  <IGRPIcon
                    iconName="Trash"
                    className="mr-2 size-4"
                    strokeWidth={2}
                  />
                  Eliminar
                </IGRPDropdownMenuItemPrimitive>
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </IGRPTableCellPrimitive>
        </IGRPTableRowPrimitive>

        {hasChildren && isExpanded && role.children?.map((child) => (
          <RoleTreeRow 
            key={child.id} 
            role={child} 
            level={level + 1} 
          />
        ))}
      </>
    );
  };

  if (error) {
    return (
      <div className="rounded-md border py-6">
        <p className="text-center">Ocorreu um erro ao carregar roles.</p>
        <p className="text-center">{error.message}</p>
      </div>
    );
  }

  const filteredRoles = roles?.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(role.status);

    return matchesSearch && matchesStatus;
  });

  const roleTree = filteredRoles ? buildRoleTree(filteredRoles) : [];
  const roleEmpty = roles && roles.length === 0;

  return (
    <div className="flex flex-col gap-3 overflow-hidden animate-fade-in">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="leading-none font-semibold">Perfis</div>
            <div className="text-muted-foreground text-sm">
              Gerir e reorganizar os perfis.
            </div>
          </div>
          {!roleEmpty && (
            <div className="flex justify-end">
              <ButtonLink
                onClick={handleNewRole}
                icon="UserLock"
                href="#"
                label="Novo Perfil"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full min-w-0">
          <div className="relative w-full max-w-sm">
            <IGRPIcon
              iconName="Search"
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            />
            <IGRPInputPrimitive
              type="search"
              placeholder="Pesquisar perfil..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 flex-shirnk-0">
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive variant="outline" className="gap-2">
                  <IGRPIcon iconName="ListFilter" strokeWidth={2} />
                  Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="start" className="w-40">
                <IGRPDropdownMenuSeparatorPrimitive />
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <IGRPDropdownMenuCheckboxItemPrimitive
                    key={value}
                    checked={statusFilter.includes(value)}
                    onCheckedChange={(checked) => {
                      setStatusFilter(
                        checked
                          ? [...statusFilter, value]
                          : statusFilter.filter((s) => s !== value),
                      );
                    }}
                  >
                    {label}
                  </IGRPDropdownMenuCheckboxItemPrimitive>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <IGRPDropdownMenuSeparatorPrimitive />
                    <IGRPDropdownMenuItemPrimitive
                      onClick={() => setStatusFilter([])}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      <IGRPIcon iconName="X" className="mr-1" strokeWidth={2} />
                      Limpar
                    </IGRPDropdownMenuItemPrimitive>
                  </>
                )}
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <IGRPSkeletonPrimitive
                key={i}
                className="h-12 rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : roleEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <div>Nenhum perfil encontrado </div>
            {searchTerm ? (
              "Tente ajustar a sua pesquisa."
            ) : (
              <ButtonLink
                onClick={handleNewRole}
                icon="UserLock"
                href="#"
                label="Novo Perfil"
                variant="outline"
              />
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <IGRPTablePrimitive>
              <IGRPTableHeaderPrimitive>
                <IGRPTableRowPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Perfil
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Descrição
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap">
                    Estado
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="w-24" />
                </IGRPTableRowPrimitive>
              </IGRPTableHeaderPrimitive>
              <IGRPTableBodyPrimitive>
                {roleTree.map((role) => (
                  <RoleTreeRow key={role.id} role={role} />
                ))}
              </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
          </div>
        )}
      </div>

      <RoleFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        departmentCode={departmentCode}
        parentRoleName={parentRoleName}
        role={selectedRole}
      />

      {selectedRole && (
        <RoleDetails
          departmentCode={departmentCode}
          role={selectedRole}
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
        />
      )}

      {roleToDelete && (
        <RoleDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          roleToDelete={roleToDelete}
        />
      )}
    </div>
  );
}