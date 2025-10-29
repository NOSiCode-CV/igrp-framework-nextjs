"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { IGRPUserDTO, Status } from "@igrp/platform-access-management-client-ts";
import { IGRPDialogDelete } from "@/components/dialog-delete";
import { useUpdateUser } from "../use-users";
import { statusSchema } from "@/schemas/global";

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: IGRPUserDTO;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  userToDelete,
}: UserDeleteDialogProps) {
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: removeUser } = useUpdateUser();

  async function confirmDelete() {
    const username = userToDelete.username;
    const payload = { 
      ...userToDelete, 
      status: statusSchema.enum.INACTIVE as Status
    };
    try {
      await removeUser({ username, user: payload });
      igrpToast({
        type: "success",
        title: "Utilizador Desativado",
        description: `Utilizador '${userToDelete.username}' foi desativado com sucesso.`,        
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao desativar.",
        description: (error as Error).message,
      });
    }
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: userToDelete.username }}
      confirmDelete={confirmDelete}
      label="Username"
      labelBtnDelete="Desativar"
    />
  );
}
