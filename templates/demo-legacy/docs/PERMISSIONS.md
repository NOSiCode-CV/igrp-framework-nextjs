# Permissions (token-claims gating)

Gating reads the IGRP access-token claims — zero network. The AM API is the
real enforcement on every data call; these gates shape what the user sees.

## Page gate (authoritative, server)
```tsx
import { igrpAssertAuthorize } from "@igrp/framework-next";
export default async function Page() {
  await igrpAssertAuthorize("manage_access"); // missing → 403 (forbidden.tsx)
  return <Screen />;
}
```

## Component gate (client)
```tsx
import { IGRPAuthorization } from "@igrp/framework-next-ui";
<IGRPAuthorization permission="delete_invoice"><DeleteButton /></IGRPAuthorization>
// or, inside your own component:
const { can } = usePermissions();
<IGRPButton disabled={!can("read_invoice")}>Ver</IGRPButton>
```

## Per-page guard checklist (there is NO default-deny)
- [ ] Does this page need a permission? If yes, call `await igrpAssertAuthorize("<perm>")` at the top.
- [ ] Forgetting it leaves the page **open** — the menu hiding it is not enforcement.
- [ ] Permission name: pass the **bare suffix** (`"manage_access"`) — it's auto-qualified with the active department; pass a `dept.suffix` string for a cross-department check.

## Preview mode
`IGRP_PREVIEW_MODE=true` / `AUTH_PROVIDER=none` → claims = **super-admin**, so every gate passes. To see a *denied* state or the 403, run with preview **off** against a real backend (or a non-super-admin user).
