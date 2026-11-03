# DS requests — 05 IGRPButtonLink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `IGRPButtonLink`, a button-shaped `next/link` with a navigation pending spinner, a real disabled state, and an optional tooltip that becomes the label for icon-only sizes. Also ship `IGRPLinkPendingIcon`, the indicator on its own.

**Architecture:** One new leaf, `src/components/horizon/button-link.tsx`. Enabled: `<Button asChild><Link>…</Link></Button>`. Disabled: `<Button type="button" disabled>` with the same content, so no `<a>` exists. The spinner comes from `useLinkStatus()` inside `IGRPLinkPendingIcon`, which is always rendered as a child of `Link`. The tooltip is plan 02's `IGRPTooltip`. Icon-only detection is plan 02's `isIconOnlySize`.

**Tech Stack:** React 19, Next.js `next/link` (`useLinkStatus`, Next >= 15.3), Radix Tooltip through `IGRPTooltip`, Vitest + Testing Library.

**Spec:** `packages/design-system/docs/design-system-requests/02-igrp-button-link.md` §2.1–§2.5 (§2.0 is plan 01, Task 1) and `03-igrp-button-link-tooltip.md` §3.1–§3.4. Roadmap: `docs/superpowers/plans/2026-11-03-ds-requests-roadmap.md`.

**Depends on:** plan 02 (`2026-11-03-ds-requests-02-shared.md`) Task 1 (`IGRPTooltip`, `IGRPTooltipProvider`) and Task 2 (`isIconOnlySize`). Do not start Task 3 here before both are merged.

## Global Constraints

- All paths are relative to `packages/design-system/` unless they start with `docs/`, `plugins/` or `packages/`.
- Relative imports carry a `.js` extension. `button-link.tsx` uses hooks, so it starts with `"use client"`; `src/__tests__/client-boundaries.test.ts` checks it.
- Every re-export in `src/index.ts` is explicit (no `export *`, no `as` aliasing).
- No `dark:` and no raw palette colours in Horizon (`igrp/token-policy` lint rule).
- No user-visible literal strings in the component. The dev-only `console.warn` is not user-visible (same as `IGRPButton`, `button.tsx:74`).
- Rest props pass through `igrpOmitNonDomProps` (`src/lib/dom-props.ts`) before they reach `Link`.
- Peer `next` floor goes from `^15.0.0` to `^15.3.0` (`package.json:63`). No feature detection for `useLinkStatus`. `templates/demo-v1/package.json:35` pins `next` `15.5.28`, the storybook package `15.5.28`, and `framework-next`, `framework-next-ui` and `framework-next-auth` already peer `^15.5.0`, so no workspace consumer is affected.
- Changesets are `patch`, package `@igrp/igrp-framework-react-design-system`. Commit messages have no `Co-Authored-By` trailer.
- Test command: `pnpm exec vitest run <file>` from `packages/design-system/`.
- Lint/format: ESLint + Prettier (`pnpm exec eslint <files>`, `pnpm exec prettier --write <files>`).

## Review Focus

1. Link-only props (`prefetch`, `replace`, `scroll`, `target`, `onNavigate`) on a **disabled** link must not reach the `<button>` (React warns on unknown props, and `target` on a button is meaningless). Task 2 test "drops link props when disabled".
2. `iconPlacement="end"` while pending: the spinner must sit where the icon was (`data-icon="inline-end"`) so the label does not shift. Task 1 test "spinner keeps the icon's slot".
3. A non-icon size with no `tooltip` must render the `<a>` as the root element, no wrapper span, or button groups lose their layout. Task 3 test "no tooltip, no wrapper".
4. Icon-only with `tooltip` but no `label`: the tooltip text becomes the accessible name and no warning fires. Task 3 test "tooltip alone names an icon-only link".
5. `size="xs"` / `"icon-xs"` while pending: the spinner must shrink like `IGRPButton`'s (`size-3`), not keep `Spinner`'s literal `size-4`. Task 1 test "spinner follows the button size".

Not covered, by decision: an ancestor that is the raw primitive `TooltipProvider` rather than `IGRPTooltipProvider`. `IGRPTooltipContext` cannot see it, so `IGRPTooltip` mounts its own provider inside. That is harmless (Radix providers nest) and §3.4 is tested against `IGRPTooltipProvider`; the skill reference tells consumers to use that one.

---

### Task 1: `IGRPLinkPendingIcon` and the peer floor

**Files:**
- Create: `src/components/horizon/button-link.tsx`
- Modify: `src/components/horizon/button.tsx:69` (lift the spinner-size ternary into an exported helper)
- Modify: `src/index.ts` — after `export { IGRPButton, type IGRPButtonProps } …` (line 435)
- Modify: `package.json:63` — peer `"next": "^15.3.0"`
- Test: `src/components/horizon/__tests__/button-link-pending.test.tsx` (create)

**Interfaces:**
- Consumes: `Spinner` (`../primitives/spinner.js`), `IGRPIcon` (`./icon/index.js`), `useLinkStatus` (`next/link`), `cn` (`cn`).
- Produces:

```ts
// button.tsx — module export, not re-exported from src/index.ts
function igrpSpinnerSizeClassName(size: IGRPButtonProps["size"]): string | undefined
// "xs" | "icon-xs" → "size-3", "sm" → "size-3.5", otherwise undefined (today's button.tsx:69 rule)

// button-link.tsx
interface IGRPLinkPendingIconProps {
  /** Empty string, null or undefined means no icon; the spinner still shows while pending. */
  iconName?: IGRPIconName | string | null
  iconClassName?: string
  /** Sets data-icon="inline-start" | "inline-end" on whatever renders. Default "start". */
  iconPlacement?: "start" | "end"
  /** Button size, only to size the spinner. */
  size?: IGRPButtonProps["size"]
  /** Default true. */
  showPendingIndicator?: boolean
}
function IGRPLinkPendingIcon(props: IGRPLinkPendingIconProps): React.ReactElement | null
```

- [ ] **Step 1: Write the failing tests**

The file mocks `next/link` so a test can drive `pending`. Keep the real `Link`; replace only the hook:

```tsx
const linkStatus = vi.hoisted(() => ({ pending: false }))
vi.mock("next/link", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/link")>()
  return { ...actual, useLinkStatus: () => linkStatus }
})
beforeEach(() => { linkStatus.pending = false })

it("renders the icon when idle", async () => {
  const { container } = render(<IGRPLinkPendingIcon iconName="Eye" />)
  await waitFor(() => expect(container.querySelector("svg.lucide-eye")).not.toBeNull())
  expect(container.querySelector('[data-slot="spinner"]')).toBeNull()
})

it("replaces the icon with a spinner while pending", () => {
  linkStatus.pending = true
  const { container } = render(<IGRPLinkPendingIcon iconName="Eye" />)
  expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute("aria-hidden", "true")
  expect(container.querySelector("svg.lucide-eye")).toBeNull()
})

it("shows the spinner while pending even with no icon", () => {
  linkStatus.pending = true
  for (const iconName of ["", null, undefined]) {
    const { container, unmount } = render(<IGRPLinkPendingIcon iconName={iconName} />)
    expect(container.querySelector('[data-slot="spinner"]')).not.toBeNull()
    unmount()
  }
})

it("renders nothing with no icon when idle", () => {
  const { container } = render(<IGRPLinkPendingIcon iconName="" />)
  expect(container).toBeEmptyDOMElement()
})

it("spinner keeps the icon's slot", () => {
  linkStatus.pending = true
  const { container } = render(<IGRPLinkPendingIcon iconName="Eye" iconPlacement="end" />)
  expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute("data-icon", "inline-end")
})

it.each([["xs", "size-3"], ["icon-xs", "size-3"], ["sm", "size-3.5"]])(
  "spinner follows the button size (%s)", (size, cls) => {
    linkStatus.pending = true
    const { container } = render(<IGRPLinkPendingIcon iconName="Eye" size={size as never} />)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveClass(cls)
  })

it("never shows the spinner with showPendingIndicator={false}", async () => {
  linkStatus.pending = true
  const { container } = render(<IGRPLinkPendingIcon iconName="Eye" showPendingIndicator={false} />)
  await waitFor(() => expect(container.querySelector("svg.lucide-eye")).not.toBeNull())
  expect(container.querySelector('[data-slot="spinner"]')).toBeNull()
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/button-link-pending.test.tsx`
Expected: FAIL, `../button-link.js` does not exist.

- [ ] **Step 3: Add `igrpSpinnerSizeClassName` to `button.tsx` and use it at line 69**

`IGRPButton` behaviour is unchanged; the existing button tests prove it.

- [ ] **Step 4: Implement `IGRPLinkPendingIcon` in `button-link.tsx`**

`pending && showPendingIndicator` → `<Spinner aria-hidden="true" data-icon={…} className={cn(igrpSpinnerSizeClassName(size), iconClassName)} />`. Otherwise a non-empty `iconName` → `<IGRPIcon iconName data-icon aria-hidden="true" className={iconClassName} />`, else `null`. `Spinner` is the same glyph as the spec's `LoaderCircle` (lucide `Loader2` = `LoaderCircle`) and is what `IGRPButton` uses. Lucide's default stroke width is already 2 (§2.3.5); pass nothing. JSDoc must say the component only reports pending when rendered inside a `next/link` `Link`, and is idle anywhere else.

- [ ] **Step 5: Export and raise the peer floor**

`src/index.ts`: `export { IGRPLinkPendingIcon, type IGRPLinkPendingIconProps } from "./components/horizon/button-link.js"` after line 435. `package.json:63`: `"next": "^15.3.0"`. Run `pnpm install` from the repo root; commit `pnpm-lock.yaml` only if it changed.

- [ ] **Step 6: Run the new tests, the horizon suite and the boundary test**

Run: `pnpm exec vitest run src/components/horizon/__tests__ src/__tests__/client-boundaries.test.ts`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add packages/design-system/src packages/design-system/package.json pnpm-lock.yaml
git commit -m "feat(design-system): add IGRPLinkPendingIcon, raise next peer to ^15.3.0"
```

---

### Task 2: `IGRPButtonLink` (§2.5)

**Files:**
- Modify: `src/components/horizon/button-link.tsx`
- Modify: `src/index.ts` (same export line as Task 1)
- Test: `src/components/horizon/__tests__/button-link.test.tsx` (create; real `next/link`, no mock)
- Test: `src/components/horizon/__tests__/button-link-pending.test.tsx` (add the pending-through-the-button test)

**Interfaces:**
- Consumes: `IGRPLinkPendingIcon` (Task 1), `Button` (`../primitives/button.js`), `type IGRPButtonProps` (`./button.js`), `Link` (`next/link`).
- Produces (Task 3 extends it):

```ts
interface IGRPButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href">,
    Pick<IGRPButtonProps, "variant" | "size" | "iconName" | "iconClassName" | "iconPlacement"> {
  href: string
  label?: string
  disabled?: boolean
  /** Default true. Set false for same-page anchors and external hrefs, where useLinkStatus never fires. */
  showPendingIndicator?: boolean
  /** Styles the button, which is the <a> when enabled. */
  className?: string
}
function IGRPButtonLink(props: IGRPButtonLinkProps): React.ReactElement
```

Defaults: `variant="default"`, `iconPlacement="start"`, `showPendingIndicator=true`. No `customIcon`, no `btnClassName`, no `linkClassName` (§2.2: the root is the button). `iconName` has no default (unlike `IGRPButton`'s `"ArrowLeft"`): no icon unless asked.

- [ ] **Step 1: Write the failing tests**

`button-link.test.tsx`:

```tsx
it("renders an <a> carrying the button classes", async () => {
  render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
  const link = screen.getByRole("link", { name: "Abrir" })
  expect(link).toHaveAttribute("href", "/x")
  expect(link).toHaveAttribute("data-slot", "button")
  expect(link).toHaveClass("bg-primary") // variant default
  await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
})

it("renders a disabled <button> and no <a> when disabled", async () => {
  const onClick = vi.fn()
  render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" disabled onClick={onClick} />)
  expect(screen.queryByRole("link")).toBeNull()
  const button = screen.getByRole("button", { name: "Abrir" })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute("type", "button")
  await userEvent.click(button)
  expect(onClick).not.toHaveBeenCalled()
})

it("drops link props when disabled", () => {
  render(<IGRPButtonLink href="/x" label="Abrir" disabled target="_blank" prefetch={false} replace />)
  const button = screen.getByRole("button", { name: "Abrir" })
  expect(button).not.toHaveAttribute("target")
  expect(button).not.toHaveAttribute("href")
})

it("does not throw outside a Next.js app router", () => {
  // jsdom render with no router context is the "outside the app router" case
  expect(() => render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)).not.toThrow()
  expect(() => render(<IGRPLinkPendingIcon iconName="Eye" />)).not.toThrow() // outside a Link: idle
})

it("passes variant, size and className to the anchor", () => {
  render(<IGRPButtonLink href="/x" label="Abrir" variant="outline" size="sm" className="w-full" />)
  const link = screen.getByRole("link", { name: "Abrir" })
  expect(link).toHaveAttribute("data-variant", "outline")
  expect(link).toHaveAttribute("data-size", "sm")
  expect(link).toHaveClass("w-full")
})
```

Add to `button-link-pending.test.tsx`:

```tsx
it("shows the spinner inside the link while pending, then restores the icon", async () => {
  linkStatus.pending = true
  const { rerender } = render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
  const link = screen.getByRole("link", { name: "Abrir" })
  expect(link.querySelector('[data-slot="spinner"]')).not.toBeNull() // inside the <a>, i.e. inside Link
  linkStatus.pending = false
  rerender(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />)
  await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
  expect(link.querySelector('[data-slot="spinner"]')).toBeNull()
})

it("never changes the icon with showPendingIndicator={false}", async () => {
  linkStatus.pending = true
  render(<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" showPendingIndicator={false} />)
  const link = screen.getByRole("link", { name: "Abrir" })
  await waitFor(() => expect(link.querySelector("svg.lucide-eye")).not.toBeNull())
  expect(link.querySelector('[data-slot="spinner"]')).toBeNull()
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/button-link.test.tsx src/components/horizon/__tests__/button-link-pending.test.tsx`
Expected: the new tests FAIL, `IGRPButtonLink` is not exported.

- [ ] **Step 3: Implement `IGRPButtonLink`**

Content is `IGRPLinkPendingIcon` at `iconPlacement` plus `label`, in DOM order start-icon, label, end-icon. Enabled: `<Button asChild variant size className><Link href {...igrpOmitNonDomProps(rest)}>{content}</Link></Button>`. `asChild` needs one child, which is `Link`; the content goes inside `Link`, which keeps `IGRPLinkPendingIcon` in `Link`'s subtree. Disabled: `<Button type="button" variant size className disabled>{content}</Button>`; it takes none of `rest`, which is how Review Focus 1 holds. In the disabled branch `IGRPLinkPendingIcon` sits outside any `Link` and is idle, which is correct. Do not use `IGRPButton` here: its `asChild` branch drops icons, and its icon-only branch adds an `aria-label` warning that Task 3 replaces.

- [ ] **Step 4: Export** `IGRPButtonLink, type IGRPButtonLinkProps` on the Task 1 line in `src/index.ts`.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm exec vitest run src/components/horizon/__tests__ src/__tests__/client-boundaries.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add packages/design-system/src
git commit -m "feat(design-system): add IGRPButtonLink"
```

---

### Task 3: Tooltip and icon-only sizes (§3.4)

**Files:**
- Modify: `src/components/horizon/button-link.tsx`
- Test: `src/components/horizon/__tests__/button-link-tooltip.test.tsx` (create; real `next/link`)

**Interfaces:**
- Consumes (plan 02): `IGRPTooltip` and `IGRPTooltipProvider` from `./tooltip.js` (`IGRPTooltip` props `{ label?, children, side?, align?, sideOffset?, delayDuration?, className? }`; empty `label` renders the child unchanged; opens over a disabled child on hover and keyboard focus). `isIconOnlySize(size): boolean` from `./button.js`.
- Produces, added to `IGRPButtonLinkProps`:

```ts
  /** Tooltip text. With an icon-only size, `label` is the tooltip when this is unset, and is never rendered as text. */
  tooltip?: string
  tooltipSide?: "top" | "right" | "bottom" | "left"   // passed to IGRPTooltip side
  tooltipAlign?: "start" | "center" | "end"           // passed to IGRPTooltip align
```

Derivation, both branches (link and disabled button):
`iconOnly = isIconOnlySize(size)`; `tooltipText = tooltip ?? (iconOnly ? label : undefined)`; the visible label is `iconOnly ? undefined : label`; with `iconOnly`, `aria-label = label ?? tooltip` on the `<a>` / `<button>` unless the caller passed `aria-label`. Wrap the control in `<IGRPTooltip label={tooltipText} side={tooltipSide} align={tooltipAlign}>` always; it is a pass-through when `tooltipText` is empty. Dev warning, guarded by `process.env.NODE_ENV !== "production"`, when `iconOnly` and none of `label`, `tooltip`, `aria-label`, `aria-labelledby`: `` `IGRPButtonLink: icon-only link (href="${href}") has no accessible name. Pass "label" or "tooltip".` ``

- [ ] **Step 1: Write the failing tests**

Spy on the primitive provider the way plan 02 Task 1 test 4 does:

```tsx
const providerSpy = vi.hoisted(() => vi.fn())
vi.mock("../../primitives/tooltip.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../primitives/tooltip.js")>()
  return { ...actual, TooltipProvider: (p: React.ComponentProps<typeof actual.TooltipProvider>) => { providerSpy(); return <actual.TooltipProvider {...p} /> } }
})
beforeEach(() => providerSpy.mockClear())

it.each(["icon", "icon-xs", "icon-sm", "icon-lg"])(
  "size=%s: no visible text, tooltip and accessible name from label", async (size) => {
    render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size={size as never} />)
    const link = screen.getByRole("link", { name: "Editar" })
    expect(link).not.toHaveTextContent("Editar")
    await userEvent.hover(link)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
  })

it("a disabled icon-only link opens its tooltip on hover and on focus", async () => {
  const { unmount } = render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size="icon" disabled />)
  await userEvent.hover(screen.getByRole("button", { name: "Editar" }))
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
  unmount()
  render(<IGRPButtonLink href="/x" label="Editar" iconName="Pencil" size="icon" disabled />)
  await userEvent.tab()
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Editar")
})

it("does not mount a second provider inside IGRPTooltipProvider", () => {
  render(<IGRPTooltipProvider><IGRPButtonLink href="/x" label="Editar" size="icon" /></IGRPTooltipProvider>)
  expect(providerSpy).toHaveBeenCalledTimes(1)
})

it("non-icon size: label in the button, tooltip shows the tooltip text", async () => {
  render(<IGRPButtonLink href="/x" label="Abrir" tooltip="Abre o processo" />)
  const link = screen.getByRole("link", { name: "Abrir" })
  expect(link).toHaveTextContent("Abrir")
  await userEvent.hover(link)
  const tip = await screen.findByRole("tooltip")
  expect(tip).toHaveTextContent("Abre o processo")
  expect(tip).not.toHaveTextContent("Abrir")
})

it("no tooltip, no wrapper", () => {
  const { container } = render(<IGRPButtonLink href="/x" label="Abrir" />)
  expect(container.firstElementChild?.tagName).toBe("A")
})

it("tooltip alone names an icon-only link", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  render(<IGRPButtonLink href="/x" tooltip="Editar" size="icon" iconName="Pencil" />)
  expect(screen.getByRole("link", { name: "Editar" })).toBeInTheDocument()
  expect(warn).not.toHaveBeenCalled()
  warn.mockRestore()
})

it("warns in development when icon-only has neither label nor tooltip", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
  render(<IGRPButtonLink href="/x" size="icon" iconName="Pencil" />)
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("IGRPButtonLink: icon-only link"))
  warn.mockRestore()
})
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm exec vitest run src/components/horizon/__tests__/button-link-tooltip.test.tsx`
Expected: FAIL: icon sizes render "Editar" as text, no tooltip opens, no warning.

- [ ] **Step 3: Implement the derivation above in `IGRPButtonLink`**

- [ ] **Step 4: Run the tooltip tests, the Task 1–2 tests and the boundary test**

Run: `pnpm exec vitest run src/components/horizon/__tests__ src/__tests__/client-boundaries.test.ts`
Expected: all pass, including the unchanged Task 1 and Task 2 tests.

- [ ] **Step 5: Lint, typecheck, commit**

Run: `pnpm exec eslint src/components/horizon/button-link.tsx src/components/horizon/button.tsx src/components/horizon/__tests__/button-link*.tsx && pnpm typecheck`
Expected: no errors.

```bash
git add packages/design-system/src
git commit -m "feat(design-system): tooltip and icon-only sizes on IGRPButtonLink"
```

---

### Task 4: Story, skill reference, changeset, request status

**Files:**
- Create: `packages/design-system-storybook/src/stories/button-link.stories.tsx`
- Create: `packages/design-system-storybook/src/stories/__snapshots__/button-link.stories.tsx.snap` (generated)
- Modify: `plugins/igrp/skills/design-system/references/horizon.md` — `## Actions`, after the `IGRPLink` paragraph (line 17)
- Modify: `plugins/igrp/skills/design-system/SKILL.md:72` (the `IGRPButton` icons gotcha)
- Modify: `docs/design-system-requests/02-igrp-button-link.md`, `docs/design-system-requests/03-igrp-button-link-tooltip.md` (status line)
- Create: `.changeset/ds-igrp-button-link.md` (repo root)

**Interfaces:**
- Consumes: `IGRPButtonLink`, `IGRPLinkPendingIcon`, `IGRPTooltipProvider` from the package barrel.
- Produces: nothing code-facing.

- [ ] **Step 1: Write the story**

Same shape as `button.stories.tsx` (`Meta`/`StoryObj` from `@storybook/nextjs-vite`, `title: 'Components/ButtonLink'`, `component: IGRPButtonLink`, controls for `variant`, `size` with all eight sizes, `iconName`, `iconPlacement`, `disabled`, `showPendingIndicator`, `tooltip`). Stories: `Default` (`href="/processos"`, `label="Abrir"`, `iconName="Eye"`), `IconOnly` (`size="icon"`, `label="Editar"`, `iconName="Pencil"`), `DisabledWithTooltip` (`disabled`, `size="icon"`, `label="Sem permissão"`), `InTooltipProvider` (three icon-only links inside one `IGRPTooltipProvider`). Do not copy `button.stories.tsx`'s `a11y: { test: 'todo' }`; this story is gated at `error`.

- [ ] **Step 2: Build the DS and the storybook**

Run: `pnpm build:ds && pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook`
Expected: build succeeds; `ButtonLink` appears in `storybook-static/index.json`.

- [ ] **Step 3: Write the snapshot**

With `pnpm storybook` running: `pnpm --filter @igrp/igrp-framework-react-design-system-storybook test-storybook:update-snapshots`
Expected: `button-link.stories.tsx.snap` is created, existing snapshots unchanged (`git status` shows only the new file), no a11y failures.

- [ ] **Step 4: Skill reference**

`horizon.md`, after the `IGRPLink` paragraph: one paragraph for **`IGRPButtonLink`**: button-shaped next/link; props `href`, `label`, `variant`, `size`, `iconName`, `iconPlacement`, `iconClassName`, `disabled`, `showPendingIndicator` (default true; off for `#anchors` and external URLs), `tooltip`, `tooltipSide`, `tooltipAlign`. State: `disabled` renders a `<button>`, not a link; icon sizes show no text and use `label` as tooltip and accessible name; spinner while the route loads; needs Next >= 15.3; wrap a list of them in `IGRPTooltipProvider` (not the raw `TooltipProvider`) to share one provider. One sentence for `IGRPLinkPendingIcon`: put it inside your own `Link` to get the same spinner; outside a `Link` it never spins. Add `IGRPButtonLink` to the `next/*` sentence at line 146. `SKILL.md:72`: add "For navigation use `IGRPButtonLink`, not `IGRPButton asChild` around a `Link`."

- [ ] **Step 5: Status lines**

Insert, directly under the `> Part of the SIGOVP…` blockquote of each request file, above the existing SIGOVP status paragraph (keep that paragraph):
- 02: `**Status:** Implemented as \`IGRPButtonLink\` and \`IGRPLinkPendingIcon\` (plan \`docs/superpowers/plans/2026-11-03-ds-requests-05-button-link.md\`); §2.0 fixed by plan 01. Requires Next >= 15.3.`
- 03: `**Status:** Implemented as the \`tooltip\`, \`tooltipSide\` and \`tooltipAlign\` props on \`IGRPButtonLink\` (plan 05), on top of \`IGRPTooltip\` and \`isIconOnlySize\` (plan 02).`

- [ ] **Step 6: Changeset**

`.changeset/ds-igrp-button-link.md`:

```md
---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPButtonLink`: a button-shaped `next/link` that shows a spinner while the target route loads, renders a real disabled `<button>` when `disabled`, and takes `tooltip`, `tooltipSide` and `tooltipAlign`. With an icon size, `label` becomes the tooltip and accessible name instead of visible text. New `IGRPLinkPendingIcon` exposes the spinner for custom link controls. The `next` peer dependency is now `^15.3.0`, the first version with `useLinkStatus`.
```

- [ ] **Step 7: Commit**

```bash
git add packages/design-system-storybook/src/stories plugins/igrp/skills/design-system packages/design-system/docs/design-system-requests .changeset/ds-igrp-button-link.md
git commit -m "docs(design-system): IGRPButtonLink story, skill reference and changeset"
```
