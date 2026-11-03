# DS requests §1–§7 — roadmap

Index for the per-subsystem implementation plans covering
`packages/design-system/docs/design-system-requests/01`–`07`. Written 2026-11-03 against
`@igrp/igrp-framework-react-design-system` `0.2.0-beta.10`. §8–§12 are done or look fixed and are out of
scope.

Each plan stands alone and produces working, tested software. Execute them in phase order. Plans in the same
phase touch different files and can run in parallel sessions.

| Phase | Plan | Request | Depends on |
| --- | --- | --- | --- |
| 0 | [01 Defects](2026-11-03-ds-requests-01-defects.md) | §2.0, §1.4 | — |
| 1 | [02 Shared pieces](2026-11-03-ds-requests-02-shared.md): `IGRPTooltip`, `isIconOnlySize`, step tokens | README cross-cutting | — |
| 2 | [03 Accordion](2026-11-03-ds-requests-03-accordion.md) | §4 | — |
| 2 | [04 Textarea counter](2026-11-03-ds-requests-04-textarea-counter.md) | §5 | — |
| 3 | [05 Button link](2026-11-03-ds-requests-05-button-link.md) | §2, §3 | 02 |
| 3 | [06 Lookup field](2026-11-03-ds-requests-06-lookup-field.md) | §6 | 02 |
| 3 | [07 Stepper + multi-step form](2026-11-03-ds-requests-07-multi-step-form.md) | §7 | 02 |
| 4 | [08 Server data table](2026-11-03-ds-requests-08-server-data-table.md) | §1 | 01 |

Not in any plan:

- §1 `paginationFromApiPage` and `useServerPaginatedResource`: declined, app-shaped.
- §5 `formatCounter`, §4 `as` heading level: skipped (YAGNI); add on request.
- §7 `motion` dependency: declined; CSS transitions instead.
- `IGRPDataTable` row selection (KNOWN-ISSUES): API still to be decided.

Open decisions for the maintainers:

1. §2/§3: ship `IGRPButtonLink` (plan 05), or decline since the requesters don't use it?
2. Raising the `next` peer floor to `^15.3.0` for `useLinkStatus` (plan 05). No workspace package is affected:
   demo-v1 pins 15.5.28 and the other framework packages already peer `^15.5.0`.
3. Row selection: design it with plan 08, or leave it in KNOWN-ISSUES?
4. Plan 08 detects the actions column by `meta.isActionsColumn` only, not by an id ending in `actions` (that
   also matches `transactions`). Migrating apps must set `meta` on their own actions columns.
5. Plan 03 adds a `headerAction` prop to the `AccordionTrigger` primitive, a local divergence from shadcn.
6. Plan 04 joins a caller's `aria-describedby` with the helper/error/counter ids instead of replacing them,
   and an over-long record loaded with `reset` becomes dirty when it is truncated.

Departures from the spec made while planning (already in the plans): `badgeColor` takes `IGRPColorVariants`
(plan 03); `action` sits after the chevron (plan 03); compound wizard parts are named exports such as
`IGRPMultiStepFormHeader`, because the package has no static-property compounds (plan 07); the stepper pulse
animation is dropped because its keyframes need raw colours (plan 07).

No plan changes `templates/demo-v1`, so none needs a template-migrator migration.
