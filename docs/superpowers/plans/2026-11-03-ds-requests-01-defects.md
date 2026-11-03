# DS requests — 01 Defects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two defects reported alongside the component requests: a disabled `IGRPDataTableButtonLink` with an `href` still navigates, and `IGRPDataTable` keys expanded rows by index.

**Architecture:** Two independent edits in `packages/design-system/src/components/horizon/data-table/`. No new exports beyond one prop.

**Tech Stack:** React 19, TanStack Table 8, Vitest + Testing Library.

**Spec:** `packages/design-system/docs/design-system-requests/02-igrp-button-link.md` §2.0, `01-igrp-server-data-table.md` §1.4. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

## Global Constraints

- All paths below are relative to `packages/design-system/` unless they start with `docs/` or `plugins/`.
- Relative imports carry a `.js` extension.
- Changesets are `patch`, package `@igrp/igrp-framework-react-design-system`.
- Lint/format: ESLint + Prettier (`pnpm exec eslint <files>`, `pnpm exec prettier --write <files>`).
- Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`.

## Review Focus

1. A disabled link that is also given an `action` — must render one disabled button, not call `action` on click.
2. `getRowId` returning a number-like string (`"1"`) — must still be used as the key, not fall back to index.
3. Paging (not only sorting) with an expanded row — the expansion must follow the record. Covered in Task 2 by a re-sort; paging uses the same row-id state, so one test is enough.
4. Existing callers that pass no `getRowId` and no `renderSubComponent` — no warning.
5. The dev warning firing once per table, not on every render.

---

### Task 1: Disabled `IGRPDataTableButtonLink` with `href` renders no link

**Files:**
- Modify: `src/components/horizon/data-table/action-button-icon.tsx:185` (the `href ?` branch of `IGRPDataTableButtonLink`)
- Test: `src/components/horizon/data-table/__tests__/button-link.test.tsx` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: no API change.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IGRPDataTableButtonLink } from "../action-button-icon.js"

describe("IGRPDataTableButtonLink", () => {
  it("renders a link when enabled", () => {
    render(<IGRPDataTableButtonLink href="/x" labelTrigger="Ver" />)
    expect(screen.getByRole("link", { name: "Ver" })).toHaveAttribute("href", "/x")
  })

  it("renders a disabled button and no link when disabled with href", async () => {
    const action = vi.fn()
    render(<IGRPDataTableButtonLink href="/x" labelTrigger="Ver" action={action} disabled />)
    expect(screen.queryByRole("link")).toBeNull()
    const button = screen.getByRole("button", { name: "Ver" })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(action).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/button-link.test.tsx`
Expected: the second test FAILS — a `link` is found.

- [ ] **Step 3: Change the branch condition to `href && !disabled ? (link) : (IGRPButton)`**

The button branch is unchanged; it already passes `disabled`.

- [ ] **Step 4: Run the test and confirm it passes**

Same command. Expected: 2 passed.

- [ ] **Step 5: Changeset and commit**

`.changeset/ds-button-link-disabled.md`:

```md
---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTableButtonLink`: with `href` and `disabled`, it now renders a disabled button instead of a link that still navigated.
```

```bash
git add packages/design-system/src/components/horizon/data-table .changeset/ds-button-link-disabled.md
git commit -m "fix(design-system): disabled IGRPDataTableButtonLink with href no longer navigates"
```

---

### Task 2: `getRowId` on `IGRPDataTable`

**Files:**
- Modify: `src/components/horizon/data-table/index.tsx` — props interface near line 109, destructuring near line 200, `useReactTable` options near line 315
- Test: `src/components/horizon/data-table/__tests__/row-id.test.tsx` (create)
- Docs: `plugins/igrp/skills/design-system/references/data-table.md` — add `getRowId` next to `getRowCanExpand`

**Interfaces:**
- Consumes: nothing.
- Produces: `IGRPDataTableProps.getRowId?: TableOptions<TData>["getRowId"]`. Plan 08 (server table) reuses this prop name and type.

- [ ] **Step 1: Write the failing tests**

```tsx
type Row = { id: string; name: string }
const data: Row[] = [{ id: "b", name: "Bruno" }, { id: "a", name: "Ana" }]
// columns: an expander display column using IGRPDataTableCellExpander,
// plus col.accessor("name", { header: ({ column }) => <IGRPDataTableHeaderSortToggle column={column} title="Nome" /> })

it("keeps an expanded row bound to its record across a re-sort when getRowId is given", async () => {
  render(
    <IGRPDataTable columns={columns} data={data} getRowId={(r) => r.id}
      getRowCanExpand={() => true} renderSubComponent={(row) => <p>detalhe {row.original.name}</p>} />
  )
  await userEvent.click(screen.getAllByRole("button", { name: "Expandir detalhes" })[0]) // Bruno
  expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
  await userEvent.click(screen.getByRole("button", { name: /Nome/ })) // sort asc → Ana first
  expect(screen.getByText("detalhe Bruno")).toBeInTheDocument()
  expect(screen.queryByText("detalhe Ana")).toBeNull()
})

it("warns once in development when renderSubComponent is set without getRowId", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  const { rerender } = render(<IGRPDataTable columns={columns} data={data} renderSubComponent={() => <p />} />)
  rerender(<IGRPDataTable columns={columns} data={data} renderSubComponent={() => <p />} />)
  expect(warn).toHaveBeenCalledTimes(1)
  expect(warn.mock.calls[0][0]).toMatch(/getRowId/)
  warn.mockRestore()
})

it("does not warn without renderSubComponent", () => { /* same spy, render with neither prop, expect 0 calls */ })
```

- [ ] **Step 2: Run and confirm the first two fail**

Run: `pnpm exec vitest run src/components/horizon/data-table/__tests__/row-id.test.tsx`
Expected: test 1 fails with TypeScript/unknown prop or shows "detalhe Ana"; test 2 gets 0 warn calls.

- [ ] **Step 3: Add the prop and the warning**

Add `/** Stable row id. Required for correct expansion with sorting or pagination (default: row index). */ getRowId?: TableOptions<TData>["getRowId"]`, destructure it, pass `getRowId` to `useReactTable`. Warn in a `useEffect` with deps `[renderSubComponent, getRowId]`, skipped when `process.env.NODE_ENV === "production"`, guarded by a `useRef` flag so it fires once per table instance. Message: `IGRPDataTable: renderSubComponent without getRowId keys expanded rows by index; sorting or paging opens a different record. Pass getRowId.`

- [ ] **Step 4: Run and confirm all three pass, then the data-table suite**

Run: `pnpm exec vitest run src/components/horizon/data-table`
Expected: all pass.

- [ ] **Step 5: Docs, changeset, commit**

Add the prop to `references/data-table.md`. Changeset `.changeset/ds-data-table-row-id.md` (patch): "`IGRPDataTable`: new `getRowId` prop; without it, expanded rows followed the row index across sorting and paging. Warns in development when `renderSubComponent` is used without it."

```bash
git add packages/design-system/src/components/horizon/data-table plugins/igrp/skills/design-system/references/data-table.md .changeset/ds-data-table-row-id.md
git commit -m "fix(design-system): add getRowId to IGRPDataTable so expansion follows the record"
```
