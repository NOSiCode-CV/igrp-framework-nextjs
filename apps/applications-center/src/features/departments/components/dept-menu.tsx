"use client";

import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { useDepartmentAvailableApps, useDepartmentAvailableMenus } from "../use-departments";
import { useApplicationAvailableMenus } from "@/features/applications/use-applications";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";
import { useRoles } from "@/features/roles/use-roles";
import { useAddRolesToMenu, useRemoveRolesFromMenu } from "@/features/menus/use-menus";

interface MenuPermissionsProps {
  departmentCode: string;
  parentDepartmentCode?: string | null;
}

type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function MenuPermissions({ 
  departmentCode, 
  parentDepartmentCode
}: MenuPermissionsProps) {
  const { igrpToast } = useIGRPToast();
  
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [menuRoleAssignments, setMenuRoleAssignments] = useState<Map<string, Set<string>>>(new Map());
  
  const addRolesMutation = useAddRolesToMenu();
  const removeRolesMutation = useRemoveRolesFromMenu();
  const saving = addRolesMutation.isPending || removeRolesMutation.isPending;
  const { data: roles, isLoading: isLoadRoles } = useRoles({ departmentCode: departmentCode || "" });

  const isChildDepartment = !!parentDepartmentCode;

  const deptForApps = isChildDepartment ? parentDepartmentCode : departmentCode;
  console.log("deptForApps - ", deptForApps)
  const {
    data: menusFromDepartment, 
    isLoading: loadingMenusFromDept 
  } = useDepartmentAvailableMenus(
    !isChildDepartment ? departmentCode : ""
  );

  const { 
    data: apps, 
    isLoading: loadingApps 
  } = useDepartmentAvailableApps(deptForApps || "");

  const { 
    data: menusFromApp, 
    isLoading: loadingMenusFromApp 
  } = useApplicationAvailableMenus(
    isChildDepartment && selectedApp ? selectedApp : ""
  );

  const menus = isChildDepartment ? (menusFromApp || []) : (menusFromDepartment || []);
  const loadingMenus = isChildDepartment ? loadingMenusFromApp : loadingMenusFromDept;

  useEffect(() => {
    if (menus && menus.length > 0) {
      const initialAssignments = new Map<string, Set<string>>();
      menus.forEach((menu) => {
        initialAssignments.set(menu.code, new Set(menu.roles || []));
      });
      setMenuRoleAssignments(initialAssignments);
    }
  }, [menus]);

  const buildMenuTree = (menus: MenuEntryDTO[]): MenuWithChildren[] => {
    const map = new Map<string, MenuWithChildren>();
    const roots: MenuWithChildren[] = [];

    menus.forEach((menu) => {
      map.set(menu.code, { ...menu, children: [] });
    });

    menus.forEach((menu) => {
      const node = map.get(menu.code)!;
      if (menu.parentCode) {
        const parent = map.get(menu.parentCode);
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

  const toggleExpand = (menuCode: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuCode)) {
      newExpanded.delete(menuCode);
    } else {
      newExpanded.add(menuCode);
    }
    setExpandedMenus(newExpanded);
  };

  const toggleRoleForMenu = (menuCode: string, roleName: string) => {
    const newAssignments = new Map(menuRoleAssignments);
    const menuRoles = newAssignments.get(menuCode) || new Set<string>();
    
    if (menuRoles.has(roleName)) {
      menuRoles.delete(roleName);
    } else {
      menuRoles.add(roleName);
    }
    
    newAssignments.set(menuCode, menuRoles);
    setMenuRoleAssignments(newAssignments);
  };

  
  const handleSave = async () => {
  try {
    const promises = [];

    for (const [menuCode, currentRoles] of menuRoleAssignments.entries()) {
      const originalMenu = menus.find(m => m.code === menuCode);
      const originalRoles = new Set(originalMenu?.roles || []);
      
      const rolesToAdd = Array.from(currentRoles).filter(role => !originalRoles.has(role));
      const rolesToRemove = Array.from(originalRoles).filter(role => !currentRoles.has(role));
      
      if (rolesToAdd.length > 0) {
        promises.push(
          addRolesMutation.mutateAsync({
            menuCode,
            roleCodes: rolesToAdd,
          })
        );
      }
      
      if (rolesToRemove.length > 0) {
        promises.push(
          removeRolesMutation.mutateAsync({
            menuCode,
            roleCodes: rolesToRemove,
          })
        );
      }
    }

    await Promise.all(promises);

    igrpToast({
      type: "success",
      title: "Permissões salvas",
      description: "Os perfis foram atribuídos aos menus com sucesso.",
    });
    
  } catch (error) {
    console.error("Erro:", error);
    igrpToast({
      type: "error",
      title: "Erro ao salvar",
      description: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};


  const MenuTreeRow = ({ 
    menu, 
    level = 0 
  }: { 
    menu: MenuWithChildren; 
    level?: number 
  }) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.code);
    const assignedRoles = menuRoleAssignments.get(menu.code) || new Set<string>();

    const getMenuTypeLabel = (type: string) => {
      switch(type) {
        case "MENU_PAGE": return "Página";
        case "EXTERNAL_PAGE": return "Externa";
        case "FOLDER": return "Pasta";
        default: return type;
      }
    };

    const getMenuIcon = (type: string) => {
      switch(type) {
        case "FOLDER": return "Folder";
        case "EXTERNAL_PAGE": return "ExternalLink";
        case "MENU_PAGE": return "FileText";
        default: return "FileText";
      }
    };

    return (
      <>
        <IGRPTableRowPrimitive className={cn(level > 0 && "bg-muted/20")}>
          <IGRPTableCellPrimitive>
            <div 
              className="flex items-center gap-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(menu.code)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors flex-shrink-0"
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
                <div className="w-5 shrink-0" />
              )}
              
              <IGRPIcon 
                iconName={getMenuIcon(menu.type)}
                className="w-4 h-4 text-primary shrink-0" 
                strokeWidth={2}
              />
              
              <div className="min-w-0">
                <div className="font-medium truncate">{menu.name}</div>
                {menu.url && (
                  <div className="text-xs text-muted-foreground truncate">
                    {menu.url}
                  </div>
                )}
              </div>
            </div>
          </IGRPTableCellPrimitive>
          
          <IGRPTableCellPrimitive>
            <IGRPBadgePrimitive
              variant={menu.type === "FOLDER" ? "secondary" : "default"}
              className="text-xs"
            >
              {getMenuTypeLabel(menu.type)}
            </IGRPBadgePrimitive>
          </IGRPTableCellPrimitive>
          
          {roles?.map((role) => (
            <IGRPTableCellPrimitive key={role.name} className="text-center">
              <div className="flex items-center justify-center">
                <IGRPCheckboxPrimitive
                  checked={assignedRoles.has(role.name)}
                  onCheckedChange={() => toggleRoleForMenu(menu.code, role.name)}
                />
              </div>
            </IGRPTableCellPrimitive>
          ))}
        </IGRPTableRowPrimitive>

        {hasChildren && isExpanded && menu.children?.map((child) => (
          <MenuTreeRow 
            key={child.code} 
            menu={child} 
            level={level + 1} 
          />
        ))}
      </>
    );
  };

  const filteredMenus = menus.filter((menu) => {
    if (!searchTerm) return true;
    return (
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const menuTree = buildMenuTree(filteredMenus);
  const hasChanges = menuRoleAssignments.size > 0;

  const showMenus = isChildDepartment ? selectedApp && !loadingMenus : !loadingMenus;
  const showAppSelector = isChildDepartment;


  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <div className="leading-none font-semibold mb-1">Permissões de Menu</div>
        <div className="text-muted-foreground text-sm">
          {isChildDepartment ? (
            <>
              <IGRPIcon iconName="Info" className="w-3.5 h-3.5 inline mr-1" strokeWidth={2} />
              Departamento filho: selecione uma aplicação do departamento pai ({parentDepartmentCode})
            </>
          ) : (
            "Atribua perfis aos menus disponíveis do departamento."
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {showAppSelector && (
          <div className="w-full sm:w-80">
            <label className="text-sm font-medium mb-2 block">
              Aplicação (do pai) <span className="text-destructive">*</span>
            </label>
            <IGRPSelectPrimitive 
              value={selectedApp} 
              onValueChange={setSelectedApp}
              disabled={loadingApps}
            >
              <IGRPSelectTriggerPrimitive>
                <IGRPSelectValuePrimitive placeholder="Selecionar aplicação" />
              </IGRPSelectTriggerPrimitive>
              <IGRPSelectContentPrimitive>
                {apps?.map((app) => (
                  <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                    <div className="flex items-start gap-2">
                      <IGRPIcon iconName="AppWindow" className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                      <div>
                        <div className="font-medium">{app.name}</div>
                        {app.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{app.description}</div>
                        )}
                      </div>
                    </div>
                  </IGRPSelectItemPrimitive>
                ))}
              </IGRPSelectContentPrimitive>
            </IGRPSelectPrimitive>
          </div>
        )}

        {showMenus && menus.length > 0 && (
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Pesquisar menu</label>
            <div className="relative">
              <IGRPIcon
                iconName="Search"
                className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              />
              <IGRPInputPrimitive
                type="search"
                placeholder="Pesquisar..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {isChildDepartment && !selectedApp ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <IGRPIcon iconName="AppWindow" className="w-20 h-20 mb-4 opacity-30" strokeWidth={1.5} />
          <p className="text-lg font-medium mb-2">Selecione uma aplicação</p>
          <p className="text-sm">Escolha uma aplicação do departamento pai</p>
        </div>
      ) : loadingMenus ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : menuTree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <IGRPIcon iconName="Search" className="w-16 h-16 mb-4 opacity-30" strokeWidth={1.5} />
          <p className="text-lg font-medium mb-2">Nenhum menu encontrado</p>
          <p className="text-sm">
            {searchTerm 
              ? "Tente ajustar os termos de pesquisa" 
              : "Não há menus disponíveis"
            }
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <IGRPTablePrimitive>
              <IGRPTableHeaderPrimitive>
                <IGRPTableRowPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap min-w-[320px]">
                    Menu
                  </IGRPTableHeadPrimitive>
                  <IGRPTableHeadPrimitive className="whitespace-nowrap w-28">
                    Tipo
                  </IGRPTableHeadPrimitive>
                  
                  {roles?.map((role) => (
                    <IGRPTableHeadPrimitive 
                      key={role.name} 
                      className="text-center whitespace-nowrap w-36"
                    >
                      <div className="flex flex-col items-center gap-1 py-1">
                        <IGRPIcon iconName="ShieldCheck" className="w-4 h-4 text-primary" strokeWidth={2} />
                        <span className="text-xs font-semibold truncate max-w-full px-1" title={role.name}>
                          {role.name.split('.').pop() || role.name}
                        </span>
                      </div>
                    </IGRPTableHeadPrimitive>
                  ))}
                </IGRPTableRowPrimitive>
              </IGRPTableHeaderPrimitive>
              
              <IGRPTableBodyPrimitive>
                {menuTree.map((menu) => (
                  <MenuTreeRow key={menu.code} menu={menu} />
                ))}
              </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-muted-foreground">
              {menus.length} menu{menus.length !== 1 ? 's' : ''} • {roles?.length} perfil
            </div>
            
            <div className="flex gap-2">
              <IGRPButtonPrimitive
                variant="outline"
                onClick={() => {
                  if (isChildDepartment) {
                    setSelectedApp("");
                  }
                  setMenuRoleAssignments(new Map());
                }}
                disabled={saving}
              >
                <IGRPIcon iconName="X" className="w-4 h-4 mr-1" strokeWidth={2} />
                Cancelar
              </IGRPButtonPrimitive>
              
              <IGRPButtonPrimitive
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <IGRPIcon iconName="Loader" className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <IGRPIcon iconName="Check" className="w-4 h-4" strokeWidth={2} />
                    Salvar Permissões
                  </>
                )}
              </IGRPButtonPrimitive>
            </div>
          </div>
        </>
      )}
    </div>
  );
}