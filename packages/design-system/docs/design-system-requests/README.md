# Component requests for `@igrp/igrp-framework-react-design-system`

**From:** the SIGOVP team (`simple-autorizacao-ui`) · **To:** the IGRP design-system maintainers
**Written against DS version:** `0.1.0-beta.145`

---

## Read this first

You do not have access to the application these requests come from, so **every
file in this folder is self-contained.** Each one carries:

- what the component does and why the existing DS surface does not cover it,
  quoting the DS `.d.ts` we checked against;
- the behaviours that must be reproduced, including the non-obvious ones that
  were bugs first;
- a proposed API;
- acceptance criteria you can test against;
- **the complete reference implementation, verbatim**, at the bottom — so you can
  port it directly rather than re-deriving it.

File paths such as `src/app/(myapp)/_components/lookup-field.tsx` appear only as
*provenance* for the code quoted below them. They are not links you need to
follow, and nothing in these documents depends on reading our repository.

Source comments are a mix of English and Portuguese (the app is Portuguese
language, for Cabo Verde). We left them as written rather than translating —
several of them record *why* a line exists, which is the part worth keeping.

## What the application is

**SIGOVP** — *SIMple | Gestão de Ocupação de Via Pública* — a municipal
public-space occupation authorization system: categories of occupation, zones
and locations, fees, required documents, licences, inspections and
notifications. It is a standalone Next.js app built on the IGRP Framework, with
`@igrp/*` consumed as ordinary registry dependencies.

Its shape matters for two of these requests: it is a **back-office CRUD
application**, so it is dominated by paginated server-side lists (§1), long
validated forms (§5, §6, §8), multi-step wizards (§7) and two
template editors (§9, §10). Nothing here is bespoke to our domain — these are
the generic pieces every IGRP back-office will need.

## Environment these were built and tested against

| Package | Version |
|---|---|
| `@igrp/igrp-framework-react-design-system` | `0.1.0-beta.145` |
| `@igrp/framework-next` | `0.1.0-beta.171` |
| `next` | `15.5.25` (App Router, Turbopack) |
| `react` | `19.2.8` |
| `@tanstack/react-table` | `8.21.3` |
| `react-hook-form` + `zod` | via `IGRPForm` |
| `@tiptap/*` | `3.31.3` (§9, §10 only) |
| `motion` | `13.2.0` (§7 only) |
| Tailwind | v4, semantic tokens only |

House rules the reference implementations follow, so they should read like DS
code already: Horizon (`IGRP*`) components first and primitives only when
Horizon is too opinionated; forms always `IGRPForm` + Zod; semantic tokens
only, never raw palette colours and never `dark:` overrides; `cn()` for class
merging; `'use client'` on every file importing from the DS.

## We checked what you already ship

Before filing anything we audited the published `dist` of
`0.1.0-beta.145` — the full export list, the `.d.ts` of every plausible
candidate, and the compiled `.js` where the types did not settle it. Two
requests changed shape as a result, and two defects fell out of it. The claim
"the DS has no X" appears in these documents only where we verified it.

| § | Nearest thing you already ship | Verdict |
|---|---|---|
| 1 | `IGRPDataTable` (has a server mode) | **Still needed.** `manualPagination`/`manualSorting`/`manualFiltering` are all set from `!!onQueryChange` — one switch. All table state is internal. `getRowId` is neither passed nor exposed. |
| 2 | `IGRPLink`, `IGRPDataTableButtonLink` | **Still needed** — neither is a button-shaped link, and nothing in `dist` uses `useLinkStatus`. **Plus a defect: see §2.0.** |
| 3 | `IGRPDataTableActionTooltip` (internal), raw Radix `Tooltip*` | **Still needed**, but reframed: you have the pattern inside `data-table`; the ask is to generalise it. No `IGRPTooltip` export exists. |
| 4 | **`IGRPAccordion`** | **Substantially reframed.** It hardcodes `type: "single"` and `Omit`s `type` from its props, so N independently-open sections are not expressible. Now filed as *props on `IGRPAccordion`*, not a new component. |
| 5 | `IGRPTextarea` | **Still needed.** No counter logic in either the Horizon or primitive textarea; `maxLength` only passes through to the DOM. |
| 6 | `IGRPInputSearch`, `IGRPInputAddOn`, `InputGroup*` | **Still needed**, reframed: you ship the layout primitives, and our reference implementation should have used them. The gap is the form-bound Horizon component and the §6.4 two-field pairing. |
| 7 | `Stepper*` primitives, `IGRPStepperProcess` | **Still needed.** Both are presentational; neither gates a step on validation. |
| 8 | `IGRPInputNumber` | **Defect report, not a component request** — it already exists and is richer than ours. |
| 9 | — | **Still needed.** No `tiptap`, `ProseMirror`, `contentEditable` or `execCommand` anywhere in `dist`. |
| 10 | — | **Still needed.** No HTML renderer — and, to your credit, no `dangerouslySetInnerHTML` in the package either. |

### Two defects, independent of every request below

1. **`IGRPDataTableButtonLink` with an `href` ignores `disabled`** (§2.0). It
   renders `<Button asChild disabled><Link/></Button>`, so `disabled` lands on
   an `<a>`, where it neither blocks navigation nor triggers the
   `disabled:pointer-events-none disabled:opacity-50` styling — CSS `:disabled`
   does not match anchors. A disabled control that still works.
2. **`IGRPDataTable` cannot give rows a stable id** (§1.4). It accepts
   `getRowCanExpand` and `renderSubComponent` but never passes `getRowId`, so
   expansion is keyed by row index: expand a row, then sort or page, and the
   open panel shows a different record's content.

Both are source readings, not runtime reproductions — worth confirming your
side. We are not hit by the first (all 43 of our call sites use `action`, none
passes `href`).

## The requests

| § | Request | Our local component | Used in | Size |
|---|---|---|---|---|
| [1](01-igrp-server-data-table.md) | `IGRPServerDataTable` — controlled, server-paginated table | `server-paginated-data-table.tsx` | 10 list screens | L |
| [2](02-igrp-button-link.md) | `IGRPButtonLink` — button-shaped link with navigation pending state | `button-link.tsx` | **none** — see below | S |
| [3](03-igrp-button-link-tooltip.md) | …its icon-only + tooltip variant (a prop on §2, not a component) | `button-link-tooltip.tsx` | **none** — see below | XS |
| [4](04-igrp-collapsible-section.md) | Multi-open sections — filed as **props on `IGRPAccordion`** | `collapsible-section.tsx` | 3 summary screens | S |
| [5](05-igrp-textarea-counter.md) | `IGRPTextarea` — character counter + value-level cap | `limited-textarea-field.tsx` | **17 call sites** | S |
| [6](06-igrp-lookup-field.md) | `IGRPLookupField` — input whose value is picked, not typed | `lookup-field.tsx` (+3 wrappers) | request wizard | M |
| [7](07-igrp-multi-step-form.md) | `IGRPMultiStepForm` — form-aware wizard, + 2 fixes to `Stepper` | `multi-step-viewer.tsx`, `use-multi-step-viewer.tsx`, `stepper.tsx` | 2 wizards | L |
| [8](08-igrp-input-number.md) | `IGRPInputNumber` — **defect report**, not a new component | `numeric-field.tsx` | 3 fee forms | S |
| [9](09-igrp-rich-text-editor.md) | `IGRPRichTextEditor` — form-bound WYSIWYG | `rich-text-editor.tsx` | 2 template forms | XL |
| [10](10-igrp-rich-text-view.md) | `IGRPRichTextView` — render stored HTML without `dangerouslySetInnerHTML` | `rich-text-view.tsx` | 2 template forms | S |

## What we are asking for

Per entry: **adopt, decline, or counter-propose.** A decline is a useful answer —
it tells us to keep (or delete) the local component deliberately rather than by
default. Where you counter-propose a different API, we will migrate to yours;
the proposed APIs here are a starting point, not a demand, and we have tried to
name things the way the existing DS names them.

Suggested order, by cost-to-value:

0. **The two defects above**, before any of it. They affect consumers who are
   not us and who have not noticed.
1. **§8 next — it may not be a component request at all.** If
   `IGRPInputNumber`'s form binding is fixed, the entry closes and we delete our
   local component. Cheapest possible outcome; please confirm or refute the
   defect before scheduling anything else.
2. **§4 and §5** — both are props on components you already ship, not new
   components. No new dependency, no new concept. §5 alone removes a wrapper
   from 17 call sites in this one app; §4 is two additions to `IGRPAccordion`.
3. **§1** — the highest-leverage lift: ten screens here, plus a table layout
   contract that every IGRP back-office currently re-invents in app CSS.
4. **§7** — needs a decision on the `motion` dependency first. The two `Stepper`
   fixes in §7.4 are independent and could land immediately.
5. **§6** — self-contained, but its hidden-id/display-value pairing (§6.4) is
   worth designing carefully rather than quickly.
6. **§9 + §10 together, or neither.** They share one schema by construction, and
   splitting them reintroduces the bug the shared schema prevents. Gate both on
   the dependency-packaging decision in §9.5.

## Cross-cutting asks

These recur across entries and are worth treating as their own work items, even
if every component request above is declined:

- **Tooltip over a disabled control.** A Radix `TooltipTrigger asChild` on a
  disabled element never opens, because a disabled element receives no pointer
  events; a wrapping `<span className="inline-flex">` is the fix. We
  rediscovered this independently in §3, §6 and §9. A DS tooltip wrapper should
  apply it unconditionally so no app has to learn it a fourth time.
- **Semantic `warning` tokens.** `--warning` / `--warning-foreground` in the same
  family as `--destructive` / `--destructive-foreground`, plus `--step-active` /
  `--step-complete` and their foregrounds. We need both (§5, §7) and currently
  define them in app CSS, which is exactly the raw-palette leak the house rules
  are meant to prevent. The definitions we use are quoted in §5.4 and §7.4.
- **An exported `isIconOnlySize(size)` predicate.** `buttonVariants` has four
  icon sizes (`icon`, `icon-xs`, `icon-sm`, `icon-lg`) and every consumer
  hand-writes the list — our §3 component misses `icon-xs` for exactly this
  reason, and `IGRPButton` and `IGRPDataTableButtonLink` need the same check.

## A note on §2 and §3

Both are **currently unreferenced in our app** — we navigate through your
`IGRPDataTableButtonLink` instead. We are filing them for the one behaviour that
component lacks (Next.js `useLinkStatus()` pending state), not because they
unblock any screen here. If you decline them, our follow-up is to delete the two
local files rather than start using them. We would rather tell you that up front
than have you weigh them as if ten screens were waiting.
