"use client";

import {
  cn,
  IGRPBadge,
  IGRPBadgePrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPTabItem,
  IGRPTabs,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import type { DepartmentArgs } from "../dept-schemas";
import { useDepartments, useDepartmentByCode } from "../use-departments";
import { DepartmentDeleteDialog } from "./dept-delete-dialog";
import { DepartmentFormDialog } from "./dept-form-dialog";
import { PageHeader } from "@/components/page-header";
import DepartmentTreeItem from "./dept-tree-item";
import { RolesList } from "@/features/roles/components/role-list";
import { PermissionList } from "@/features/permissions/components/permission-list";

export type DepartmentWithChildren = DepartmentArgs & {
  children?: DepartmentWithChildren[];
};

export function DepartmentListTree() {
  const [selectedDeptCode, setSelectedDeptCode] = useState<string | null>(null);
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDept, setCurrentDept] = useState<DepartmentArgs | null>(null);
  const [parentDeptId, setParentDeptId] = useState<string | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: departments, isLoading, error } = useDepartments();
  const { data: selectedDepartment } = useDepartmentByCode(
    selectedDeptCode || ""
  );
  //   const { data: parentDept } = useDepartmentByCode(
  //     selectedDepartment?.parent_code || ""
  //   );

  const buildTree = (depts: DepartmentArgs[]): DepartmentWithChildren[] => {
    const map = new Map<string, DepartmentWithChildren>();
    const roots: DepartmentWithChildren[] = [];

    depts.forEach((dept) => {
      map.set(dept.code, { ...dept, children: [] });
    });

    depts.forEach((dept) => {
      const node = map.get(dept.code)!;
      if (dept.parent_code) {
        const parent = map.get(dept.parent_code);
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

  const handleOpenCreate = () => {
    setCurrentDept(null);
    setDeptToDelete(null);
    setParentDeptId(null);
    setOpenFormDialog(true);
  };

  const handleDelete = (code: string, name: string) => {
    setOpenFormDialog(false);
    setCurrentDept(null);
    setParentDeptId(null);
    setDeptToDelete({ code, name });
    setOpenDeleteDialog(true);
  };

  const handleEdit = (dept: DepartmentArgs) => {
    setDeptToDelete(null);
    setParentDeptId(null);
    setCurrentDept(dept);
    setOpenFormDialog(true);
  };

  const handleCreateSubDept = (parentCode: string) => {
    setDeptToDelete(null);
    setCurrentDept(null);
    setParentDeptId(parentCode);
    setOpenFormDialog(true);
  };

  const filterTree = (
    depts: DepartmentWithChildren[],
    term: string
  ): DepartmentWithChildren[] => {
    if (!term) return depts;

    return depts
      .map((dept) => {
        const matchesCurrent =
          dept.name.toLowerCase().includes(term.toLowerCase()) ||
          dept.code.toLowerCase().includes(term.toLowerCase());

        const filteredChildren = dept.children
          ? filterTree(dept.children, term)
          : [];

        if (matchesCurrent || filteredChildren.length > 0) {
          return { ...dept, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as DepartmentWithChildren[];
  };

  if (isLoading || !departments) {
    return <AppCenterLoading descrption="Carregando departamentos..." />;
  }

  if (error) throw error;

  const departmentTree = buildTree(departments);
  const filteredTree = filterTree(departmentTree, searchTerm);

  const tabs: IGRPTabItem[] = [
    {
      label: "Departamentos",
      value: "departments",
      content: (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Informação do Departamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-normal text-muted-foreground mb-1">Nome</h4>
                <p className="font-medium text-base">
                  {selectedDepartment?.name}
                </p>
              </div>

              <div>
                <h4 className="font-normal text-muted-foreground mb-1">
                  Código
                </h4>
                <p className="font-medium font-mono">
                  {selectedDepartment?.code}
                </p>
              </div>

              <div>
                <h4 className="font-normal text-muted-foreground mb-1">
                  Estado
                </h4>
                <span
                  className={cn(
                    "inline-flex px-2.5 py-1 rounded-md text-xs font-medium",
                    selectedDepartment?.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {selectedDepartment?.status}
                </span>
              </div>

              <div>
                <h4 className="font-normal text-muted-foreground mb-1">
                  Departamento Pai
                </h4>
                <p className="font-medium">
                  {selectedDepartment?.parent_code || "N/A"}
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <h4 className="font-normal text-muted-foreground mb-1">
                  Descrição
                </h4>
                <p>{selectedDepartment?.description || "Sem descrição."}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Perfis (Roles)",
      value: "roles",
      content: (
        <RolesList departmentCode={selectedDepartment?.parent_code || ""} />
      ),
    },
    {
      label: "Permissões",
      value: "permissions",
      content: (
        <PermissionList
          departmentCode={selectedDepartment?.parent_code || ""}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-screen  overflow-hidden">
      <PageHeader
        title="Gestão de Departamentos"
        description="Ver e gerir todos os departamentos do sistema."
        showActions
      >
        <ButtonLink
          onClick={() => handleOpenCreate}
          icon="Plus"
          href="#"
          label="Novo Departamento"
        />
      </PageHeader>

      <div className="flex mt-5 h-screen">
        <div className="w-80 flex flex-col">
          <div className="">
            <div className="flex items-center justify-between mb-3"></div>

            <div className="relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="text"
                placeholder="Pesquisar departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background pl-8"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredTree.map((dept) => (
              <DepartmentTreeItem
                expandedDepts={expandedDepts}
                setExpandedDepts={setExpandedDepts}
                setSelectedDeptCode={setSelectedDeptCode}
                selectedDeptCode={selectedDeptCode}
                handleEdit={handleEdit}
                handleCreateSubDept={handleCreateSubDept}
                handleDelete={handleDelete}
                key={dept.code}
                dept={dept}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedDepartment ? (
            <div className="container mx-auto p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">
                      {selectedDepartment.name}
                    </h1>
                    {IGRPBadge ? (
                      <IGRPBadge
                        variant="solid"
                        color={
                          selectedDepartment.status === "ACTIVE"
                            ? "success"
                            : "destructive"
                        }
                      >
                        {selectedDepartment.status === "ACTIVE"
                          ? "Ativo"
                          : "Inativo"}
                      </IGRPBadge>
                    ) : (
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium",
                          selectedDepartment.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {selectedDepartment.status === "ACTIVE"
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">
                      #{selectedDepartment.code}
                    </span>
                  </div>
                </div>

                {/* <div className="flex gap-2">
                  <ButtonLink
                    onClick={() => handleEdit(selectedDepartment)}
                    icon="Pencil"
                    href="#"
                    label="Editar"
                    variant="outline"
                  />
                  <ButtonLink
                    onClick={() => handleCreateSubDept(selectedDepartment.code)}
                    icon="Plus"
                    href="#"
                    label="Adicionar"
                  />
                </div> */}
              </div>

              <IGRPTabs
                defaultValue="roles"
                items={tabs}
                className="min-w-0"
                tabContentClassName="px-0"
              />
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <IGRPIcon
                iconName="FolderTree"
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <div className="py-2">
                Escolha um departamento na lista para ver os detalhes{" "}
              </div>

              <ButtonLink
                onClick={handleOpenCreate}
                icon="Plus"
                href="#"
                label="Novo Departamento"
                variant="outline"
              />
            </div>
          )}
        </div>
      </div>

      <DepartmentFormDialog
        open={openFormDialog}
        onOpenChange={setOpenFormDialog}
        department={currentDept}
        parentDeptId={parentDeptId}
      />

      {deptToDelete && (
        <DepartmentDeleteDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          deptToDelete={deptToDelete}
        />
      )}
    </div>
  );
}
