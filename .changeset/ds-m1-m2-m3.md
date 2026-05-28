---
"@igrp/igrp-framework-react-design-system": patch
---

Design-system robustness pass — M1 (a11y), M2 (i18n + type safety), M3 (test breadth + side-effect hygiene). No breaking public API changes.

**M1 — Accessibility / Slot forwarding**

- `IGRPInputText` (form-context branch) and `IGRPInputSearch` (both branches) — fix shadcn `FormControl` Slot wiring: the `id` from `useFormField()` now lands on the `<input>` element instead of the positioning wrapper div, so the `<FormLabel htmlFor>` association is correct, screen readers announce labels, and clicking the label focuses the input. The positioning wrapper still exists as a sibling for icon overlays.
- New a11y assertions in the IGRPForm test suite: clicking `<FormLabel>` focuses the underlying input, and after validation failure the input carries `aria-invalid="true"` plus `aria-describedby` pointing at the form message id.

**M2 — i18n provider + IGRPForm type tightening**

- New `IGRPI18nProvider` + `useIGRPi18n()` hook + `IGRPI18nStrings` / `IGRPI18nStringsOverride` types under the new `i18n/` module. pt-PT defaults are exported as `IGRP_I18N_DEFAULTS_PT_PT`. Provider performs per-group shallow merge; missing keys fall back to defaults.
- Wired into `IGRPDataTable` (`clientClearLabel`, `notFoundLabel`), `IGRPInputPhone` (placeholder, country selector label, default option), `IGRPInputPassword` (toggle aria-label), `IGRPInputNumber` (increment/decrement labels, invalid-value message), `IGRPForm` (submission error toast title + fallback message). Component-level props still override the provider value when supplied.
- Removed file-level `eslint-disable @typescript-eslint/no-explicit-any` from `IGRPForm`. The remaining `any` is bounded to a single-line type alias (`type AnyZod = z.ZodType<Record<string, any>, any, any>`) that mirrors react-hook-form's `FieldValues` constraint — the `any`s exist to thread through to a third-party generic, not to weaken the public surface. Internal `useForm` / `Resolver` / `UseFormReturn` middle generics tightened from `any` → `unknown`.

**M3 — Test breadth + side-effect hygiene**

- New tests: `input-password.test.tsx`, `input-number.test.tsx`, `input-search.test.tsx`, `i18n/__tests__/context.test.tsx`, `scripts/side-effects.test.mjs`. Coverage now includes stepper math, visibility toggle, search submit/Enter, i18n provider merge semantics, and tree-shake hygiene. Suite: 85 tests across 10 files, all green.
- `scripts/side-effects.test.mjs` is a regression guard: every `.ts`/`.tsx` source file must be free of top-level CSS imports and bare top-level function calls. Catches patterns that would silently defeat consumer tree-shaking with `sideEffects: ["*.css"]`.
- `form-list.tsx`: replaced `Object.assign(IGRPFormList, { displayName: … })` with direct `IGRPFormList.displayName = …` assignment — equivalent behavior, doesn't trip the side-effect guard, more idiomatic.
