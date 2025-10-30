"use client";

import {
  cn,
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCheckboxPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogDescriptionPrimitive,
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
import { useState, useEffect, useMemo } from "react";
import { useAddMenusToDepartment, useDepartmentAvailableMenus, useRemoveMenusFromDepartment } from "../../use-departments";
import { useDepartmentMenus } from "@/features/menus/use-menus";
import { MenuEntryDTO } from "@igrp/platform-access-management-client-ts";

interface ManageMenusModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MenuWithChildren = MenuEntryDTO & { children?: MenuWithChildren[] };

export function ManageMenusModal({ 
  departmentCode,
  open,
  onOpenChange
}: ManageMenusModalProps) {
  const { igrpToast } = useIGRPToast();
  
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [menuAssignments, setMenuAssignments] = useState<Map<string, boolean>>(new Map());

  const { data: availableMenus, isLoading: loadingAvailable } = useDepartmentAvailableMenus(departmentCode || "");
  const { data: assignedMenus, isLoading: loadingAssigned } = useDepartmentMenus(departmentCode || "");
  const addMenusMutation = useAddMenusToDepartment();
  const removeMenusMutation = useRemoveMenusFromDepartment();
  const saving = addMenusMutation.isPending || removeMenusMutation.isPending;
  const loading = loadingAvailable || loadingAssigned;

  useEffect(() => {
    if (availableMenus && availableMenus.length > 0) {
      const initialAssignments = new Map<string, boolean>();
      const assignedCodes = new Set(assignedMenus?.map(menu => menu.code) || []);
      
      availableMenus.forEach((menu) => {
        const isAssigned = assignedCodes.has(menu.code);
        initialAssignments.set(menu.code, isAssigned);
      });
      setMenuAssignments(initialAssignments);
    }
  }, [availableMenus, assignedMenus, open]);

  const appsFromMenus = useMemo(() => {
    if (!availableMenus) return [];
    const uniqueAppCodes = new Set(availableMenus.map(menu => menu.applicationCode));
    return Array.from(uniqueAppCodes).map(appCode => ({
      code: appCode,
      name: appCode,
    }));
  }, [availableMenus]);

  const filteredByApp = selectedApp
    ? (availableMenus || []).filter(menu => menu.applicationCode === selectedApp)
    : (availableMenus || []);

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
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuCode)) {
        newSet.delete(menuCode);
      } else {
        newSet.add(menuCode);
      }
      return newSet;
    });
  };

  const toggleMenuAssignment = (menuCode: string) => {
    setMenuAssignments(prev => {
      const newMap = new Map(prev);
      newMap.set(menuCode, !newMap.get(menuCode));
      return newMap;
    });
  };

  const handleSave = async () => {
    try {
      const promises = [];
      const assignedCodes = new Set(assignedMenus?.map(menu => menu.code) || []);

      for (const [menuCode, isAssigned] of menuAssignments.entries()) {
        const wasAssigned = assignedCodes.has(menuCode);

        if (isAssigned && !wasAssigned) {
          promises.push(
            addMenusMutation.mutateAsync({
              code: departmentCode,
              menuCodes: [menuCode],
            })
          );
        }

        if (!isAssigned && wasAssigned) {
          promises.push(
            removeMenusMutation.mutateAsync({
              code: departmentCode,
              menuCodes: [menuCode],
            })
          );
        }
      }

      if (promises.length === 0) {
        igrpToast({
          type: "info",
          title: "Sem alterações",
          description: "Nenhuma mudança foi detectada.",
        });
        return;
      }

      await Promise.all(promises);

      igrpToast({
        type: "success",
        title: "Menus atualizados",
        description: "Os menus foram atribuídos ao departamento com sucesso.",
      });

      onOpenChange(false);
      
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
    const isAssigned = menuAssignments.get(menu.code) || false;

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
          <IGRPTableCellPrimitive className="text-center">
            <div className="flex items-center justify-center">
              <IGRPCheckboxPrimitive
                checked={isAssigned}
                onCheckedChange={() => toggleMenuAssignment(menu.code)}
              />
            </div>
          </IGRPTableCellPrimitive>
          
          <IGRPTableCellPrimitive>
            <div 
              className="flex items-center gap-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(menu.code)}
                  className="w-5 h-5 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0"
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
              variant="secondary" 
              className="text-xs"
            >
              {menu.applicationCode}
            </IGRPBadgePrimitive>
          </IGRPTableCellPrimitive>
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

  const filteredMenus = filteredByApp.filter((menu) => {
    if (!searchTerm) return true;
    return (
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const menuTree = buildMenuTree(filteredMenus);

  const hasChanges = Array.from(menuAssignments.entries()).some(([menuCode, isAssigned]) => {
    const assignedCodes = new Set(assignedMenus?.map(menu => menu.code) || []);
    const wasAssigned = assignedCodes.has(menuCode);
    return isAssigned !== wasAssigned;
  });

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="max-w-3xl! max-h-[90vh] overflow-hidden flex flex-col">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="flex items-center gap-2">
            <IGRPIcon iconName="Menu" className="w-5 h-5" strokeWidth={2} />
            Gerenciar Menus
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Selecione os menus que estarão disponíveis para este departamento.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <div className="w-full sm:w-64">
            <IGRPSelectPrimitive 
              value={selectedApp} 
              onValueChange={setSelectedApp}
              disabled={loading}
            >
              <IGRPSelectTriggerPrimitive>
                <IGRPSelectValuePrimitive placeholder="Todas aplicações" />
              </IGRPSelectTriggerPrimitive>
              <IGRPSelectContentPrimitive>
                {appsFromMenus.map((app) => (
                  <IGRPSelectItemPrimitive key={app.code} value={app.code}>
                    <div className="flex items-center gap-2">
                      <IGRPIcon iconName="AppWindow" className="w-4 h-4" strokeWidth={2} />
                      {app.name}
                    </div>
                  </IGRPSelectItemPrimitive>
                ))}
              </IGRPSelectContentPrimitive>
            </IGRPSelectPrimitive>
          </div>

          <div className="relative">
            <IGRPIcon
              iconName="Search"
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            />
            <IGRPInputPrimitive
              type="search"
              placeholder="Pesquisar menu..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <IGRPSkeletonPrimitive key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : menuTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IGRPIcon iconName="Menu" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
              <p className="font-medium">Nenhum menu encontrado</p>
              <p className="text-sm">
                {searchTerm 
                  ? "Tente ajustar os termos de pesquisa" 
                  : "Atribua aplicações ao departamento primeiro"
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                  <IGRPTableRowPrimitive>
                    <IGRPTableHeadPrimitive className="w-12 text-center">
                      <IGRPIcon iconName="Check" className="w-4 h-4 mx-auto" strokeWidth={2} />
                    </IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive>Menu</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className="w-48">Aplicação</IGRPTableHeadPrimitive>
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                
                <IGRPTableBodyPrimitive>
                  {menuTree.map((menu) => (
                    <MenuTreeRow key={menu.code} menu={menu} />
                  ))}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {filteredMenus.filter(m => menuAssignments.get(m.code)).length} de {filteredMenus.length} selecionados
          </div>
          
          <div className="flex gap-2">
            <IGRPButtonPrimitive
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
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
                  Salvar Menus
                </>
              )}
            </IGRPButtonPrimitive>
          </div>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}