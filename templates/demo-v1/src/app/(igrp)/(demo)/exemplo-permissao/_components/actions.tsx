"use client";

import { IGRPAuthorization } from "@igrp/framework-next-ui";
import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

export function ExemploActions() {
  return (
    <div className="flex gap-2">
      <IGRPButton>Ver</IGRPButton>
      <IGRPAuthorization
        permission="delete_invoice"
        fallback={<IGRPButton disabled>Eliminar</IGRPButton>}
      >
        <IGRPButton variant="destructive">Eliminar</IGRPButton>
      </IGRPAuthorization>
    </div>
  );
}
