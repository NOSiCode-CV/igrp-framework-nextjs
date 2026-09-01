# Permissions — there is NO default-deny

> Canonical. Every AI tooling bridge in this template (`AGENTS.md`, `.cursor/`,
> `.trae/`, `.github/`) points here. Edit this file, not the copies.

A page with no permission check is **fully open and deep-linkable**. Hiding a
menu item is navigation UX, not enforcement.

## For every page you add

- **Needs a permission** → gate it on the **first line** of the server
  component:

  ```tsx
  import { igrpAssertAuthorize } from "@igrp/framework-next";

  export default async function Page() {
    await igrpAssertAuthorize("manage_access"); // denied → forbidden() → 403
    …
  }
  ```

- **Does not need one** → say so in a one-line comment
  (`// open to all authenticated users`), so the next reader sees a decision
  rather than an omission.

## Server actions

`igrpAssertAuthorize` is **pages only** — an action has no `forbidden.tsx`
boundary. In a server action use `igrpAuthorize(name)` (boolean) and return
`{ ok: false, code: "forbidden" }`.

**Gate the action too whenever the control is a mutation.** A hidden or
disabled button is cosmetic; the action behind it is the real entry point.

## Client side

Wrap with `<IGRPAuthorization permission="…">` or read
`usePermissions().isAllowed(…)` from `@igrp/framework-next-ui`. Never add a
`permission` prop to a design-system component.

## Permission names

Pass the **bare suffix** (`"manage_access"`) — it is auto-qualified with the
user's active department. Use `"DEPT_X.perm"` only for an explicit
cross-department check.

Full guide, including the request lifecycle and the enforcement-strength table:
`docs/PERMISSIONS.md`.
