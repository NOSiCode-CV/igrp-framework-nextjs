"use client";

import {
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
  IGRPSkeletonPrimitive,
  IGRPTableBodyPrimitive,
  IGRPTableCellPrimitive,
  IGRPTableHeaderPrimitive,
  IGRPTableHeadPrimitive,
  IGRPTablePrimitive,
  IGRPTableRowPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useEffect } from "react";
import { useAddApplicationsToDepartment, useDepartmentAvailableApps, useRemoveApplicationsFromDepartment } from "../../use-departments";
import { useApplications } from "@/features/applications/use-applications";

interface ManageAppsModalProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageAppsModal({ 
  departmentCode,
  open,
  onOpenChange
}: ManageAppsModalProps) {
  const { igrpToast } = useIGRPToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [appAssignments, setAppAssignments] = useState<Map<string, boolean>>(new Map());

  const { data: availableApps, isLoading: loadingAvailable } = useDepartmentAvailableApps(departmentCode || "");
  const { data: assignedApps, isLoading: loadingAssigned } = useApplications({ departmentCode: departmentCode || "" });
  const addApplicationsMutation = useAddApplicationsToDepartment();
  const removeApplicationsMutation = useRemoveApplicationsFromDepartment();
  const saving = addApplicationsMutation.isPending || removeApplicationsMutation.isPending;
  const loading = loadingAvailable || loadingAssigned;

  useEffect(() => {
    if (availableApps && availableApps.length > 0) {
      const initialAssignments = new Map<string, boolean>();
      const assignedCodes = new Set(assignedApps?.map(app => app.code) || []);
      
      availableApps.forEach((app) => {
        const isAssigned = assignedCodes.has(app.code);
        initialAssignments.set(app.code, isAssigned);
      });
      setAppAssignments(initialAssignments);
    }
  }, [availableApps, assignedApps, open]);

  const toggleAppAssignment = (appCode: string) => {
    setAppAssignments(prev => {
      const newMap = new Map(prev);
      newMap.set(appCode, !newMap.get(appCode));
      return newMap;
    });
  };

  const handleSave = async () => {
    try {
      const promises = [];
      const assignedCodes = new Set(assignedApps?.map(app => app.code) || []);

      for (const [appCode, isAssigned] of appAssignments.entries()) {
        const wasAssigned = assignedCodes.has(appCode);

        if (isAssigned && !wasAssigned) {
          promises.push(
            addApplicationsMutation.mutateAsync({
              code: departmentCode,
              appCodes: [appCode],
            })
          );
        }

        if (!isAssigned && wasAssigned) {
          promises.push(
            removeApplicationsMutation.mutateAsync({
              code: departmentCode,
              appCodes: [appCode],
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
        title: "Aplicações atualizadas",
        description: "As aplicações foram atribuídas ao departamento com sucesso.",
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

  const filteredApps = (availableApps || []).filter((app) => {
    if (!searchTerm) return true;
    return (
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const hasChanges = Array.from(appAssignments.entries()).some(([appCode, isAssigned]) => {
    const assignedCodes = new Set(assignedApps?.map(app => app.code) || []);
    const wasAssigned = assignedCodes.has(appCode);
    return isAssigned !== wasAssigned;
  });

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <IGRPDialogContentPrimitive className="max-w-3xl!  max-h-[90vh] overflow-hidden flex flex-col">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive className="flex items-center gap-2">
            <IGRPIcon iconName="AppWindow" className="w-5 h-5" strokeWidth={2} />
            Gerenciar Aplicações
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Selecione as aplicações que estarão disponíveis para este departamento.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="pb-4">
          <div className="relative">
            <IGRPIcon
              iconName="Search"
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
            />
            <IGRPInputPrimitive
              type="search"
              placeholder="Pesquisar aplicação..."
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
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <IGRPIcon iconName="AppWindow" className="w-12 h-12 mb-3 opacity-30" strokeWidth={1.5} />
              <p className="font-medium">Nenhuma aplicação encontrada</p>
              <p className="text-sm">
                {searchTerm ? "Tente ajustar os termos de pesquisa" : "Não há aplicações disponíveis"}
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
                    <IGRPTableHeadPrimitive>Aplicação</IGRPTableHeadPrimitive>
                    <IGRPTableHeadPrimitive className="w-32">Tipo</IGRPTableHeadPrimitive>
                  </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                
                <IGRPTableBodyPrimitive>
                  {filteredApps.map((app) => {
                    const isAssigned = appAssignments.get(app.code) || false;
                    
                    return (
                      <IGRPTableRowPrimitive key={app.code}>
                        <IGRPTableCellPrimitive className="text-center">
                          <div className="flex items-center justify-center">
                            <IGRPCheckboxPrimitive
                              checked={isAssigned}
                              onCheckedChange={() => toggleAppAssignment(app.code)}
                            />
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <div className="flex items-start gap-3">
                            <IGRPIcon 
                              iconName="AppWindow"
                              className="w-5 h-5 text-primary shrink-0 mt-0.5" 
                              strokeWidth={2}
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{app.name}</div>
                              {app.description && (
                                <div className="text-xs whitespace-pre-line! text-muted-foreground mt-1 line-clamp-2">
                                  {app.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </IGRPTableCellPrimitive>
                        
                        <IGRPTableCellPrimitive>
                          <IGRPBadgePrimitive variant="secondary" className="text-xs">
                            {app.type}
                          </IGRPBadgePrimitive>
                        </IGRPTableCellPrimitive>
                      </IGRPTableRowPrimitive>
                    );
                  })}
                </IGRPTableBodyPrimitive>
              </IGRPTablePrimitive>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {filteredApps.filter(app => appAssignments.get(app.code)).length} de {filteredApps.length} selecionadas
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
                  Salvar Aplicações
                </>
              )}
            </IGRPButtonPrimitive>
          </div>
        </div>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}