import {
  cn,
  IGRPButtonPrimitive,
  IGRPCommandEmptyPrimitive,
  IGRPCommandGroupPrimitive,
  IGRPCommandInputPrimitive,
  IGRPCommandItemPrimitive,
  IGRPCommandListPrimitive,
  IGRPCommandPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPIcon,
  IGRPPopoverContentPrimitive,
  IGRPPopoverPrimitive,
  IGRPPopoverTriggerPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useMemo, useState } from "react";
import { useRoles } from "@/features/roles/use-roles";
import { useDepartments } from "@/features/departments/use-departments";
import { useAddUserRole } from "../use-users";

export function UserRolesDialog({
  open,
  username,
  onClose,
}: {
  open: boolean;
  username: string | null;
  onClose: () => void;
}) {
  const { igrpToast } = useIGRPToast();

  // Department selector
  const { data: depts, isLoading: deptsLoading, error: deptsError } = useDepartments();
  const [deptPopoverOpen, setDeptPopoverOpen] = useState(false);
  const [departmentCode, setDepartmentCode] = useState<string | undefined>(undefined);

  // Roles for selected department
  const { data: roles, isLoading: rolesLoading, error: rolesError, refetch } = useRoles({
    departmentCode,
  });

  // Selected roles (array) — same shape as invite dialog
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const selected = useMemo(() => new Set(roleNames), [roleNames]);

  useEffect(() => {
    if (!open) {
      setDepartmentCode(undefined);
      setRoleNames([]);
    }
  }, [open]);

  // When department changes, clear the selected roles (to avoid cross-dept mismatch)
  const handleSelectDept = (code: string) => {
    setDepartmentCode(code);
    refetch();
    setRoleNames([]);
    setDeptPopoverOpen(false);
  };

  const toggleRole = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setRoleNames(Array.from(next));
  };

  const clearAll = () => setRoleNames([]);

  const { mutateAsync: addUserRole, isPending } = useAddUserRole();

  const handleConfirm = async () => {
    if (!username || !departmentCode || roleNames.length === 0) {
      onClose();
      return;
    }

    // NOTE: API expects just roleNames[]. Department scoping is handled server-side
    // based on the selected department + role names you send (if required on server).
    const op = addUserRole({ username, roleNames });

    igrpToast({
      promise: op,
      loading: "A atribuir perfis...",
      success: `Perfis atribuídos a ${username}`,
      error: (e) => `Falha ao atribuir perfis: ${String(e)}`,
    });

    try {
      await op;
      onClose();
    } catch {
      // toast already shown
    }
  };

  const deptName = (code?: string) =>
    depts?.find((d) => d.code === code)?.name ?? (code ?? "");

  const label =
    selected.size === 0
      ? !departmentCode || (roles?.length ?? 0) === 0
        ? "Selecione um departamento"
        : "Selecionar roles"
      : selected.size === 1
      ? Array.from(selected)[0]
      : `${selected.size} roles selecionados`;

  return (
    <IGRPDialogPrimitive open={open} onOpenChange={(o) => !o && onClose()}>
      <IGRPDialogContentPrimitive className="sm:max-w-lg">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>Adicionar perfis</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Selecione um departamento e escolha 1..N perfis para o utilizador <b>{username}</b>.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        {/* Department selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Departamento</label>
          <IGRPPopoverPrimitive open={deptPopoverOpen} onOpenChange={setDeptPopoverOpen}>
            <IGRPPopoverTriggerPrimitive asChild>
              <IGRPButtonPrimitive
                variant="outline"
                role="combobox"
                className={cn("w-full justify-between", !departmentCode && "text-muted-foreground")}
                disabled={deptsLoading || !!deptsError || (depts?.length ?? 0) === 0}
              >
                {deptsLoading
                  ? "A carregar departamentos..."
                  : departmentCode
                  ? deptName(departmentCode)
                  : deptsError
                  ? "Erro ao carregar departamentos"
                  : (depts?.length ?? 0) === 0
                  ? "Sem departamentos"
                  : "Selecionar departamento"}
                <IGRPIcon iconName="ChevronsUpDown" className="ml-2 h-4 w-4 opacity-50" />
              </IGRPButtonPrimitive>
            </IGRPPopoverTriggerPrimitive>
            <IGRPPopoverContentPrimitive className="w-[--radix-popover-trigger-width] p-0">
              <IGRPCommandPrimitive>
                <IGRPCommandInputPrimitive placeholder="Procurar departamento..." />
                <IGRPCommandListPrimitive>
                  <IGRPCommandEmptyPrimitive>
                    Nenhum departamento encontrado.
                  </IGRPCommandEmptyPrimitive>
                  <IGRPCommandGroupPrimitive>
                    {depts?.map((dept) => (
                      <IGRPCommandItemPrimitive
                        key={dept.code}
                        value={dept.code}
                        onSelect={(v) => handleSelectDept(v)}
                      >
                        <IGRPIcon
                          iconName="Check"
                          className={cn(
                            "mr-2 h-4 w-4",
                            departmentCode === dept.code ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {dept.name}
                      </IGRPCommandItemPrimitive>
                    ))}
                  </IGRPCommandGroupPrimitive>
                </IGRPCommandListPrimitive>
              </IGRPCommandPrimitive>
            </IGRPPopoverContentPrimitive>
          </IGRPPopoverPrimitive>
        </div>

        {/* Roles (multi-select) – same UX as invite dialog */}
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Perfis do departamento</label>

          <IGRPPopoverPrimitive>
            <IGRPPopoverTriggerPrimitive asChild>
              <IGRPButtonPrimitive
                variant="outline"
                role="combobox"
                disabled={!departmentCode || (roles?.length ?? 0) === 0}
                className={cn(
                  "w-full justify-between",
                  selected.size === 0 && "text-muted-foreground"
                )}
              >
                <span className="truncate">{label}</span>
                <IGRPIcon iconName="ChevronsUpDown" className="ml-2 h-4 w-4 opacity-50" />
              </IGRPButtonPrimitive>
            </IGRPPopoverTriggerPrimitive>

            <IGRPPopoverContentPrimitive
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <IGRPCommandPrimitive>
                <IGRPCommandInputPrimitive placeholder="Procurar perfil..." />
                <IGRPCommandListPrimitive>
                  <IGRPCommandEmptyPrimitive>Nenhum perfil encontrado.</IGRPCommandEmptyPrimitive>
                  <IGRPCommandGroupPrimitive>
                    {rolesLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        A carregar perfis...
                      </div>
                    ) : rolesError ? (
                      <div className="px-3 py-2 text-sm text-destructive">
                        Falha a carregar perfis.
                      </div>
                    ) : (
                      roles?.map((role) => {
                        const checked = selected.has(role.name);
                        return (
                          <IGRPCommandItemPrimitive
                            key={role.name}
                            value={role.name}
                            onSelect={(val) => toggleRole(val)}
                          >
                            <IGRPIcon
                              iconName="Check"
                              className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")}
                            />
                            {role.name}
                          </IGRPCommandItemPrimitive>
                        );
                      })
                    )}
                  </IGRPCommandGroupPrimitive>

                  <div className="flex items-center justify-between px-2 py-2 border-t">
                    <IGRPButtonPrimitive
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearAll()}
                      disabled={selected.size === 0}
                    >
                      Limpar
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        // just close via clicking elsewhere; content is a popover, so do nothing
                        (e.currentTarget.closest("[data-state]") as HTMLElement | null)?.blur?.();
                      }}
                      disabled={selected.size === 0}
                    >
                      Confirmar
                    </IGRPButtonPrimitive>
                  </div>
                </IGRPCommandListPrimitive>
              </IGRPCommandPrimitive>
            </IGRPPopoverContentPrimitive>
          </IGRPPopoverPrimitive>

          {/* Chips */}
          {selected.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(selected).map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                >
                  {r}
                  <button
                    type="button"
                    className="opacity-60 hover:opacity-100"
                    onClick={() => toggleRole(r)}
                    aria-label={`Remover ${r}`}
                    title={`Remover ${r}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <IGRPDialogFooterPrimitive className="mt-4">
          <IGRPButtonPrimitive variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            onClick={handleConfirm}
            disabled={isPending || !departmentCode || roleNames.length === 0}
          >
            Atribuir
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  );
}
