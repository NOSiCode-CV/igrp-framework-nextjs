import { igrpAssertAuthorize } from "@igrp/framework-next";

import { ExemploActions } from "./_components/actions";

export default async function ExemploPermissaoPage() {
  // Authoritative page gate: missing permission → forbidden() → 403.
  await igrpAssertAuthorize("manage_access");

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-foreground">Exemplo de permissões</h1>
      <p className="text-muted-foreground">
        Esta página exige a permissão <code>manage_access</code>.
      </p>
      <ExemploActions />
    </div>
  );
}
