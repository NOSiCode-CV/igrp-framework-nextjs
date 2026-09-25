# @igrp/igrp-framework-react-design-system

## 0.2.0-beta.1

### Patch Changes

- 45d1285: Close out the remaining design-system review findings.

  - **`IGRPInputSearch` composed with `InputGroup`.** The leading icon and submit button were absolutely positioned over a `relative` wrapper, with `ps-6.5` / `pe-9` padding reserved on the control by hand. They are now `InputGroupAddon`s, and the border, focus ring and `aria-invalid` styling come from `InputGroup` instead of being re-implemented on the input.
  - **New `--ring-invalid` token.** `IGRPInputNumber` and `IGRPInputPhone` were the last two Horizon components carrying `dark:` overrides (`dark:ring-destructive/40`), which the package's own policy restricts to the Primitives layer. The light/dark alpha step now lives in `tokens.css` as `--ring-invalid` (destructive at 20% / 40%), so the components use a single `ring-ring-invalid` and the Horizon layer is free of `dark:` entirely.
  - **`space-y-*` → `gap-*`** in the three calendar time pickers, `IGRPChat` and `IGRPAlert` (16 occurrences). The remaining five are legitimate: `flex` would break list markers on `list-disc` lists, and one is an inert `space-y-0` under `display: contents`.
  - **Valid table markup.** The data table's trailing spacer was a `<tbody>` forced to `display: table-row`; it is now a `<tbody>` containing one spacer `<tr>`.
  - **`"use client"` added** to the ten Horizon/Custom components that were missing it (`dropdown-menu`, `menubar`, `sidebar`, `card`, `container`, `stats-card`, `field-description`, and the three `custom/` components). All are reached through the `"use client"` barrel today, so this changes nothing at runtime — it removes a latent break if a subpath export is ever added.

  Snapshot baselines updated for the affected components. The visual suite is 483/483 across 78 suites, verified stable over two consecutive runs.

- e84e8d6: Fix checked styling on radios, checkboxes, switches and radio-card labels.

  The primitives style checked state with `data-checked:` / `data-unchecked:`, but
  they wrap Radix, which only emits `data-state="checked" | "unchecked"` — so the
  radio fill, the checkbox fill, the switch thumb position and the `FieldLabel`
  selected surface never applied. `tokens.css` now widens both variants to also
  match `data-state` (ADR 0002). Apps that import `/tokens` pick this up on their
  next Tailwind build; no code changes needed.

- 6fc5bad: Fix `CommandItem` rendering every row as highlighted, and drop the grey fill
  from `CommandInput` in light mode.

  - cmdk 1.1 renders `data-selected="false"` on unselected items. Tailwind v4's
    bare `data-selected:` variant matches whenever the attribute is present, so
    `data-selected:bg-muted` painted every item, and highlighted and
    non-highlighted rows looked the same. The item, its icons and
    `CommandShortcut` now key on `data-[selected=true]:`. This affects every
    `Command` surface: the command palette, `IGRPInputCombobox` and the data-table
    filter.
  - `CommandInput` filled its box with `bg-input/30`. Upstream sizes that for a
    near-white `--input`, but ours is 0.64 for WCAG 1.4.11, so it read as a grey
    slab. Light mode is now transparent with a `border-border` edge. Dark mode
    keeps `InputGroup`'s `dark:bg-input/30`.

- 6fc5bad: Restore the light `--border` and `--sidebar-border` tokens to `oklch(0.929 …)`.

  The WCAG pass on 2026-09-14 darkened `--border`, `--input` and `--ring` to 0.64
  together. WCAG 1.4.11 (3:1 non-text contrast) applies to the boundaries that
  identify a control, and the form controls draw theirs with `--input` / `--ring`,
  which stay at 0.64. `--border` is decorative: separators, card edges, table rules,
  and the base `* { border-color }`. At 0.64 every divider in the app became a
  heavy dark line. Dark mode is unchanged.

- 1eadf0f: Fix the public type surface for `node16`/`nodenext` consumers, and gate it.

  Every relative specifier in the emitted declarations was extensionless — all 169
  of them in `dist/index.d.ts`, 333 across the package. The package is
  `"type": "module"`, so under `moduleResolution: "node16" | "nodenext"` those
  declarations are unresolvable, and `skipLibCheck: true` (near-universal) hides
  the resulting TS2835 while **every exported type silently degrades to `any`**.
  Measured on the real build, with `skipLibCheck: true`:

  ```ts
  import { IGRPButton } from "@igrp/igrp-framework-react-design-system"
  IGRPButton({ totallyMadeUpProp: 12345 }) // tsc exited 0
  ```

  The same probe under `moduleResolution: "bundler"` correctly raised TS2353,
  which is why this survived review: `templates/demo-v1` uses `bundler`, so the
  defect was invisible in-repo and only reached external consumers.

  The 786 source specifiers now carry `.js` (the spelling `next-ui`, `next` and
  `next-types` already used), so `tsc` emits resolvable declarations and the
  existing Babel extension plugin — idempotent for already-extensioned
  specifiers — keeps producing the same `.js` output as before.

  Three gates close behind it:

  - `check:dist` (new, mirroring the sibling packages) runs in `build` and fails
    on any extensionless relative specifier in `dist/*.d.ts`.
  - `build-pipeline.test.ts`'s "emits fully specified relative specifiers"
    assertion **was matching nothing**: the pattern had lost its backslashes
    (`/froms+"(.[^"]*)"/`), so it searched for the literal text `froms`, collected
    zero specifiers and passed unconditionally. Repaired, and it now also asserts
    it inspected something, so it can no longer pass vacuously.
  - `release` now runs `lint`, `typecheck` and `test` before publishing. This was
    the only package in the repo with a test suite _and_ an ESLint config that
    gated on neither, and it had no `typecheck` script at all — so root
    `pnpm -r run typecheck` silently skipped it.

  No runtime or API change: `dist/*.js` is byte-equivalent in behaviour.

- e84e8d6: Fix field defects in `IGRPCombobox` and the required marker on form-bound
  fields.

  - **`IGRPCombobox` now becomes touched.** The field is marked touched when its
    popover closes. Before, it never was, so under `validationMode="onTouched"`
    an error set on it never cleared by itself. **Behaviour change:** in
    `onTouched` forms, opening and closing a required combobox without picking
    now shows its required error straight away, as `onTouched` intends.
  - **`IGRPCombobox` popover is no longer modal.** Radix's modal mode
    scroll-locked the page and hid the rest of the form from assistive
    technology. In scroll containers it could also close the popover shortly
    after it opened.
  - **`IGRPCombobox` `disabled` is real.** It used to be `pointer-events-none`
    styling only, so the trigger could still be opened from the keyboard. It now
    sets `disabled` on the trigger.
  - **`errorText` is honoured when form-bound.** `IGRPFormField` accepts
    `errorText`, which replaces the form's own message and is always shown when
    set. `IGRPCombobox` and `IGRPMultiSelect` pass it through.
  - **Required asterisk restored** on `IGRPFormField` (every form-bound field),
    `IGRPInputText`, `IGRPInputSearch`, `IGRPSelect` and the date pickers. Their
    labels used `after:content-["*"]`. Babel re-emits that as
    `after:content-[\"*\"]`, and Tailwind scanning `dist/` generated a class with
    the backslashes in its name, so it never matched. They now use
    `after:content-['*']`, and a unit test rejects the double-quoted form.

- 55d4edf: Stop shipping the whole design system — and every lucide icon — on every page.

  **The root barrel no longer carries `"use client"`.** With it, `dist/index.js` was a single client module: any server component that imported anything from the package registered the entire barrel as its client reference, so every page of every app shipped every component. Measured on the demo template, `/login` and a 13-line dashboard page each referenced ~2.7 MB of minified JS (phone input, country flags, charts, data table, date pickers). The directive now lives on each leaf that needs it; seven leaves that relied on the barrel's directive gained their own (`data-table` pagination hook, column-visibility toggle and tooltip context, `form-field`, and the `input-group`, `sonner` and `cropper` primitives). `src/__tests__/client-boundaries.test.ts` fails if the barrel regains the directive or a directive-free module picks up hooks, context, handlers, or a client-only dependency.

  **`IGRPIcon` loads icons one at a time.** It indexed lucide's full `icons` object, which put all ~1,700 icons (~146 KB gzipped) in every bundle. It now resolves the name against lucide's per-icon lazy loaders, caches each loaded icon for the session, and renders it through lucide's `Icon` with the same SVG and class names as before. The first use of an icon renders a same-sized empty `<svg>` (also on the server, so hydration matches) until its chunk arrives; later renders are synchronous. Names may now be kebab-case as well as PascalCase; an unknown name still renders the destructive `AlertCircle` immediately. `IGRPIconObject` is now committed data (`src/components/horizon/icon/names.ts`, regenerated with `pnpm generate:icon-names`; a test fails when it drifts from lucide), so listing icon names loads no icon code — a Storybook story that only used it for a control fetched ~1,700 chunks before this. `IGRPIconList` (the full component map) moved to its own module. Trade-off: because each icon is now also a lazy-load target, bundlers emit one chunk per icon, so a screen that renders _every_ icon (a gallery or icon picker via `IGRPIconList`) fetches ~1,700 small chunks instead of one bundle. Ordinary pages, which show a handful of icons, save the ~146 KB.

  **`IGRP_META_THEME_COLORS` is readable from server code.** It lived in a `"use client"` module, so a server import received a client-reference stub and `IGRP_META_THEME_COLORS.light` was `undefined` — a root layout's `viewport.themeColor` silently rendered no `<meta name="theme-color">`. It now lives in a directive-free module.

- e84e8d6: Add `IGRPMultiSelect`, a multi-value choice field whose value is always a
  `string[]` (consumer request §11, `docs/11-igrp-multi-select.md`).

  - **The selection survives the round trip.** An initial `["A","B"]` renders as
    two picks, and `getValues(name)` right after a click returns the new array.
    Each write starts from the form's current value, not the value at render
    time, so two edits in the same tick (removing two chips quickly) both land.
  - **Option order, not click order.** The value is always sorted in option
    order, so a reopened record shows picks in the order they were saved.
    Codes that no current option carries (options still loading, or a retired
    code) are kept after the options and shown as raw-code chips. They are never
    dropped. A bare string is read as a one-item selection.
  - **Validates like a field.** Picking marks the field dirty and touched and
    revalidates, so a required error clears as soon as something is picked.
    Closing the popover also marks the field touched.
  - **Non-modal popover** with a checkbox per option. Search appears from 8
    options up (`showSearch` overrides it). The footer shows an `x de y` tally
    and "Selecionar tudo" / "Limpar"; "select all" is not offered when
    `maxSelected` is set. Option `icon`, `description`, `status`, `color`,
    `group` and the new `IGRPOptionsProps.disabled` render when present.
  - **Chips below the trigger**, each with its own remove button, so no
    interactive control is nested inside the trigger `<button>`. Use `hideChips`
    for dense layouts.
  - Form-bound inside `IGRPForm` by `name`, or controlled with `value` /
    `onChange`. Strings come from a new `multiSelect` i18n group with pt-PT
    defaults, and each can be overridden by a prop.

  `IGRPCombobox variant="multiple"` is deprecated in favour of `IGRPMultiSelect`.
  It logs a one-time warning in development and will be removed at 0.1.0 stable.
  See `packages/design-system/docs/adr/0001-multi-select-separate-from-combobox.md`.

- e84e8d6: Fix orientation styling on separators, sliders, tabs, toggle groups, scroll
  bars, fields and button groups.

  The primitives style orientation with `data-vertical:` / `data-horizontal:`,
  but they wrap Radix, which only emits `data-orientation`, so none of those
  styles applied. Visible effects that are now fixed:

  - a vertical `Separator` was 0px wide;
  - the `Slider` track was 0px tall, so the image cropper's zoom slider was
    invisible;
  - horizontal `IGRPTabs` laid their content out beside the tab list instead of
    below it.

  `tokens.css` now widens both variants to also match `data-orientation`
  (ADR 0004). Apps that import `/tokens` pick this up on their next Tailwind
  build. `IGRPTabs` keeps its tab-list and trigger heights unchanged.

  One consequence: a plain height passed through `tabListClassName` on
  horizontal tabs (e.g. `h-12`) now loses to the primitive's orientation-scoped
  height. Use `group-data-horizontal/tabs:h-12` instead.

- e84e8d6: Add `IGRPRadioGroup variant="card"` — single choice as option cards (consumer
  request §12, `docs/12-igrp-card-radio-group.md`) — and fix the field around it.

  - **Option cards.** Each option is a clickable card with its `icon`, `label`,
    `badge` and `description`; the selected look comes from the radio's own
    state, never from a prop. `orientation` picks a responsive 1/2/3-column grid
    (default) or a single column; cards in a row are equal height.
  - **Options take `IGRPOptionsProps`.** `IGRPRadioOption` is now a deprecated
    alias of it. `IGRPOptionsProps` gains `badge`, rendered only by option cards.
  - **Form writes validate, dirty and touch** (both variants), so a required
    error clears as soon as an option is picked — same as `IGRPMultiSelect`.
  - **Grouped as a field set.** The label is a `<legend>` that names the radio
    group; the message is a `FieldError` (`role="alert"`); `data-invalid` is on
    the set and `aria-invalid` on the group.
  - **`emptyLabel`** is shown when `options` is empty (pt-PT default "Sem opções
    disponíveis.", overridable via `IGRPI18nProvider` `radioGroup.empty`).
  - **`errorText`** now works in controlled mode too; `error` is deprecated.
  - Fixed: `className` landed on both the wrapper and the group; option ids
    collided between two groups with the same `name`; a disabled option dimmed
    its whole row including the radio instead of just its text.

- e84e8d6: Add `IGRPRichTextEditor` and `IGRPRichTextView`, exported from a new
  `@igrp/igrp-framework-react-design-system/rich-text` entry (consumer requests
  §9 and §10). They are not in the root entry, so an app that never imports
  `/rich-text` never bundles TipTap. See
  `packages/design-system/docs/adr/0003-rich-text-subpath-single-schema.md`.

  - **One schema for both.** The editor writes, and the view renders, only what
    a single DS-owned TipTap schema declares, so the two cannot disagree. The
    view re-parses stored HTML through that schema instead of using
    `dangerouslySetInnerHTML`: `<script>`, `<iframe>`, `<img onerror>`, inline
    handlers and `javascript:` links never reach the DOM. It protects the DOM
    only. It is not a sanitiser, and the stored HTML is unchanged.
  - **Editor.** Form-bound inside `IGRPForm` by `name` (dirty on edit, touched
    on blur, Zod error under the field), or controlled with `value` /
    `onChange`. An empty body is `""`, so `required` rules fail. The
    contenteditable itself carries `role="textbox"`, the label,
    `aria-describedby`, `aria-invalid` and `aria-required`. `readOnly` and
    `disabled` hide the toolbar and template variables without dirtying the
    form. Pick the toolbar with `preset` (`"full"` default, or `"email"`, which
    drops every control a strict e-mail allow-list strips: strike, highlight,
    rule, alignment, colour, font size) or an explicit `controls` list, never
    both. Template `variables` insert `{{…}}` tokens at the caret. `colors` and
    `fontSizes` override the pickers. Deliberately no images and no raw-HTML
    view.
  - **View.** Blank HTML renders `emptyLabel` (default `"—"`) without mounting
    an editor. `maxHeight` clips a long body with a "Ver mais" / "Ver menos"
    toggle, which also expands when keyboard focus moves into the clipped part.
  - All strings come from a new `richText` i18n group with pt-PT defaults.
  - Typography (headings, lists, blockquote, links, tables, highlight) is
    built from the DS's own token classes. It needs no Tailwind plugin and no
    app setup beyond the existing `@source` over the package's `dist`, and dark
    mode follows `.dark`.
  - TipTap 3.31.3 is pinned as a regular dependency.

- 23343a3: Add `@igrp/igrp-framework-react-design-system/cn` — a server-safe entry point for
  `cn`.

  `src/index.ts` opens with `"use client"`, so the entire root barrel is a client
  boundary. That is right for components, but it also captured `cn`, a pure string
  function with no React in it. Server code importing `cn` from the root failed at
  build time:

  ```
  Error: Attempted to call cn() from the server but cn is on the client.
  > Build error occurred
  [Error: Failed to collect page data for /admin/users]
  ```

  Until now the package had **no way at all** to hand `cn` to a server module, so
  the consuming rule ("always take `cn` from the design system") was unsatisfiable
  in exactly the place it mattered. Consumers worked around it by depending on the
  `cn` package directly, which then floated out of sync with the version pinned
  here — `templates/demo-v1` carried `^0.3.0` against this package's exact `0.3.0`.

  `./cn` is the same function, re-exported from the same `cn` package, emitted as
  its own module with no directive. Client components can keep importing from the
  root; nothing about the existing surface changes.

  **Why this needed a build-level guard.** The failure is invisible to every check
  short of a real `next build`: `tsc --noEmit` passes, lint passes, and the error
  only appears during Next's page-data collection — _after_ "Compiled successfully"
  and _after_ types validate. It is then attributed to whichever route pulled the
  root layout in first, never to the file at fault. A CI gate built from typecheck
  plus lint reports green.

  So `src/server-safe-entries.test.ts` asserts on the **built output**: that
  `dist/cn.js` carries no `"use client"` directive, that it does not reach the
  client barrel, and — because a guard that can pass while reading nothing is not a
  guard — that it actually found the files it claims to check, plus that the root
  barrel really is still a client boundary (otherwise the whole test distinguishes
  nothing). Same shape as `build-pipeline.test.ts`, which was itself a silent
  no-op until 2026-09-22.

  Add any future server-safe entry to `SERVER_SAFE_ENTRIES` in that test.

- 6fc5bad: Ship `@keyframes igrp-text-fade-in` in `/tokens` so `IGRPText`'s `animate` prop
  works in consuming apps.

  The keyframes lived in `index.css`, which is only the Storybook root stylesheet.
  Consumers import `/tokens` alone, so Tailwind generated the
  `animate-[igrp-text-fade-in_…]` utility from the scanned `dist/` but emitted no
  keyframes for it. The animation silently did nothing outside Storybook. The
  keyframes now live in `tokens.css`. Consumers don't need to change anything.

- 4b5338f: Second review pass: fix packaging, input plumbing and three broken component behaviours.

  **Packaging — the published `dist` was not loadable by Node (all three packages)**

  Each package declares `"type": "module"`, so Node applies ESM resolution to `dist`,
  which requires fully specified paths. Babel copied relative specifiers through
  untouched, so `./components/horizon/button` stayed extensionless and a native
  `import()` failed with `ERR_MODULE_NOT_FOUND` — 165 such specifiers in the design
  system's `index.js`, and 167 in the published `0.1.0-beta.147` tarball. Bundlers
  probe extensions themselves, which is why it went unnoticed. A new Babel plugin
  (`scripts/babel-plugin-add-import-extension.cjs`) resolves each specifier against
  the source tree and appends `.js` (or `/index.js` for a directory), and
  `build-pipeline.test.ts` now fails if any slip through.

  **`IGRPInputSearch` — the debounce never debounced**

  `isDebouncedCallback` was called during render, so every render produced a new
  closure with a new `timeout` binding and `clearTimeout` never had anything to
  cancel. Typing five characters fired `onSearch` five times, each delayed by
  `debounceMs` (default 2000), so a handler wired to a request issued one request
  per keystroke, all landing later and out of order. It is now a `useDebouncedCallback`
  hook holding the timer in a ref, with cleanup on unmount.

  **`IGRPSelect` — three defects**

  - The `value` prop only seeded a reducer, so it was write-once: changing it after
    mount did nothing despite being documented as controlled.
  - In form mode the trigger label came from `formContext.getValues()` inside a
    `useMemo` that did not depend on the form value. `getValues` is not reactive, so
    `form.setValue()` moved the field on while the trigger kept the previous label.
    (`form.reset()` happened to work.) It now derives from `field.value`.
  - `showSearch` rendered a text input inside Radix's `SelectContent`, whose typeahead
    intercepts printable keys and pulls focus back to the matching item — only the
    first character ever landed. Typing "min" left "m" in the box. The input now stops
    propagation for typing keys while letting Escape/Tab/Enter/arrows reach Radix.
  - Group headings were derived from the unfiltered options, so a group whose options
    were all filtered out still rendered an empty heading.
  - Dropped a hand-rolled `aria-expanded` on the trigger that duplicated (and could
    contradict) the one Radix manages.

  **Inputs — IGRP-only props leaked to the DOM, and `inputClassName` did nothing**

  `IGRPInputProps` unions `IGRPBaseAttributes` with `React.ComponentProps<"input">`, so
  components forwarding rest props rendered `iconname`, `iconsize`, `inputclassname`
  and friends as invalid DOM attributes. Affected `IGRPTextarea`, `IGRPInputTime`,
  `IGRPInputHidden`, `IGRPInputPassword`, `IGRPInputUrl` and `IGRPInputPhone`.
  A new `igrpOmitNonDomProps` helper strips them. Along the way `inputClassName` —
  advertised by every input's public type but implemented only in `IGRPInputText` and
  `IGRPInputColor` — now works in textarea, time, password, url and phone, and
  `className` no longer doubles as the label's class in textarea, time and phone.
  `IGRPTextarea` gains `labelClassName` / `inputClassName`, which its `Pick` omitted.

  **`IGRPPdfViewer`**

  - **Default viewer changed from `"google"` to `"native"`.** The previous default sent
    every document URL to `https://docs.google.com/viewer?url=…`, so Google received —
    and had to be able to fetch — the URL. That is the wrong default for a government
    framework, and it was also the least robust: `"google"` has no fallback, while the
    nested components already defaulted to `"auto"`. Pass `viewerPreference="google"`
    explicitly to restore the old behaviour.
  - Removed a hardcoded 1-second `setTimeout` that hid the document list behind a
    spinner on mount regardless of whether anything was loading.
  - The `document` prop shadowed the global in four components; it is now aliased on
    destructuring. The public prop name is unchanged.

  **Removed `src/components/theme-provider.tsx`**

  Dead code: exported from nothing, imported by nothing. It was a second theme system
  that wrote `html.light/dark` and `localStorage["theme"]` directly — the keys
  `next-themes` owns — read `localStorage` in a `useState` initialiser (a `ReferenceError`
  on any server render), bound a global unmodified `d` keypress to toggle the theme with
  no opt-out, and removed its transition-suppressing `<style>` inside nested
  `requestAnimationFrame`, so switching theme in a background tab left every CSS
  transition on the page disabled. Theming goes through `next-themes` via
  `IGRPThemeProvider`, which is unaffected.

  **Lint**

  `igrp/token-policy` now also runs on `src/lib/**`. It was scoped to components only,
  so a raw palette colour added to `IGRPColors` — the map every badge, alert, card and
  stats-card pulls classes from — passed `pnpm lint` and shipped to every consumer of
  that slot.

  **`IGRPInputHidden` emitted visible layout**

  In form mode it rendered through `IGRPFormField`, which is a _layout_ wrapper: an
  outer div, a `FormItem` (`flex flex-col gap-2`) and an inner flex row around the
  control. The input is `display:none`, but those three divs are not — inside a form
  laid out with `gap-*`, every hidden field consumed a gap and left a visible blank
  band. It now uses `Controller` directly and emits the input alone, with no wrapper
  markup. It also renders a bare `<input>` instead of the `Input` primitive (whose
  forty-odd sizing and border utilities are inert on a hidden element; `data-slot="input"`
  is preserved), and no longer forwards `required`, which is not a valid attribute on
  `type="hidden"`.

  Note: a validation error on a hidden field no longer renders a `FormMessage`. It had
  nowhere sensible to appear and the user cannot act on it; surface such errors through
  the form's global error instead.

  **Prop leaks: completing the round-two fix (14 more components)**

  The earlier pass fixed the components that had been found leaking and added a
  regression test covering exactly those — which made a partial fix look complete.
  Sweeping the whole surface found fourteen more forwarding IGRP-only props to the
  DOM: `IGRPDateTimeInput`, `IGRPInputSearch`, `IGRPInputFile`, `IGRPInputNumber`,
  `IGRPCheckbox`, `IGRPSwitch`, `IGRPRadioGroup`, `IGRPInputAddOn`, `IGRPButton`,
  `IGRPBadge`, `IGRPAvatar`, `IGRPStatsCard`, `IGRPHeadline` and `IGRPLink` — landing
  attributes such as `iconname` and `inputclassname` on `button`, `div`, `span` and
  `a` elements.

  The regression test is now exhaustive by construction: alongside the per-component
  assertions it walks `src/components`, collects every file whose props type mentions
  `IGRPBaseAttributes` or `IGRPInputProps`, and fails if any of them is missing from
  the sweep. A new component that forgets the guard cannot pass CI.

  Also fixed while there: `className` was reaching the label instead of the wrapper in
  `IGRPDateTimeInput` and `IGRPInputFile` (both now take `labelClassName`), and in
  `IGRPDateTimeInput` `className` was not applied to the field at all, so the
  documented prop did nothing.

  **Date inputs only accept a value written in `dateFormat`**

  `parseDateInput` (public API, and what `IGRPDatePickerInputSingle` parses typed text with)
  was strict about separators and year width but lenient about day and month width: with
  `dateFormat="dd-MM-yyyy"` it accepted `1-8-2026` and `26-8-2026`, which are not what that
  format renders. The rule is now a round trip — parse the text, re-render it with the same
  `dateFormat`, and require a match — so a value is accepted only when it is written the way
  the format writes it. This also replaces a string-length heuristic that stood in for
  validation on formats with named months, so `dd MMM yyyy` now takes `26 Aug 2026` and
  rejects `26 aug 2026` and `26 August 2026`.

  A format whose tokens are single letters (`d-M-yyyy`) additionally accepts the zero-padded
  spelling, because `maskDateInput` has to commit to a width while the user is still typing and
  pads to two; without that the mask would fight the parser and such a field would accept
  nothing at all. For `dd-MM-yyyy` the padded form _is_ the format, so nothing is loosened.

  `maskDateInput` no longer zero-pads a four-digit year when a separator closes it early.
  Padding `26` to `0026` turned a half-typed year into a well-formed date in the year 26 — with
  `yyyy-MM-dd`, entering `26-08-2026` was silently accepted as `0026-08-20`.

  Typing is unchanged: the mask still rewrites keystrokes into `dateFormat`, so `1-8-2026` in a
  `dd-MM-yyyy` field still becomes `01-08-2026` and commits. What now gets rejected is text the
  mask cannot bring into shape — a pasted `2026-08-26` in a day-first field, a short year, a
  named month in the wrong case.

  **Dependency updates**

  `cn` 0.2.6 → 0.3.0 and `react-dropzone` 20.1.1 → 20.1.2 (runtime), plus `vitest`,
  `zod`, `react-hook-form` and `eslint-plugin-react-refresh` on the dev side, aligned
  across the workspace.

  `cn` is the class merger behind all 85 of its call sites, so it was diffed against
  0.2.6 rather than assumed: 1 624 cases built from the design system's own 712 class
  strings (single, base-plus-override and conditional forms) plus 31 Tailwind conflict
  pairs produced zero differences, and the export surface is unchanged. Its one real
  break is dropping `./package.json` from the exports map, which nothing here imports.

  **`@babel/*` is deliberately NOT updated to 8.x.** Re-tested against the current
  releases — `@babel/core` 8.0.5 with `babel-plugin-react-compiler` 1.0.0 — and it still
  fails exactly as before: the compiler cannot lower a destructured parameter with a
  default value, and `@babel/preset-react` 8 emits `react/jsx-dev-runtime` under the env
  the build scripts run in. See the header of `scripts/react-compiler-babel-config.cjs`.

- 7b437c3: Fix `IGRPButton` icon wiring and chart `className` merging.

  **`IGRPButton`**

  - Emit `data-icon="inline-start"` / `data-icon="inline-end"` on leading and trailing icons so the button primitive's `has-data-[icon=...]` padding compensation applies. Icon buttons previously rendered with uncompensated horizontal padding.
  - Remove the hand-maintained icon size map and let the primitive size icons via its own `[&_svg:not([class*='size-'])]` rules. The map had drifted from the primitive for `lg`, `icon-sm` and `icon-lg`, rendering those icons at the wrong size.
  - Use the `Spinner` primitive for the loading state instead of a hand-rolled spinning `IGRPIcon`.
  - `asChild` now honours `loading`: the button is disabled, marked `aria-disabled` and made inert while loading. Previously `<IGRPButton asChild loading>` stayed fully interactive.

  **Charts**

  - `IGRPBarChartHorizontal`, `IGRPBarChartVertical`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart` and `IGRPRadialChart` now merge the consumer `className` through `cn()` instead of string interpolation, so passed utilities can override the component's own defaults.

- 7b437c3: Compose `IGRPInputPassword` and `IGRPInputUrl` with `InputGroup`, and clean up assorted markup.

  - `IGRPInputPassword` now uses `InputGroup` / `InputGroupInput` / `InputGroupAddon` / `InputGroupButton` instead of a `relative` wrapper with an absolutely-positioned toggle and a `pr-10` reservation on the input. The focus ring, invalid border and disabled state now come from `InputGroup` rather than being re-implemented.
  - `IGRPInputUrl` composes the protocol `Select` as an `inline-start` addon. This removes the hand-joined border hacks (`rounded-l-2xl rounded-none` on the trigger against `rounded-s-none` on the input — the `2xl` radius was almost certainly unintended).
  - Both now apply `className` to the field root rather than to the label _and_ the input.
  - Chart lazy-loading fallbacks use `Skeleton` and forward `className`, so a chart with a custom height no longer flashes a fixed 200px placeholder and shifts layout.
  - `SelectItem`s are wrapped in `SelectGroup` in the data-table filter, data-table pagination and url inputs.
  - `w-N h-N` → `size-N` in the data-table filter, combobox and typography list.
  - Removed duplicated `buttonVariants({ variant: "outline" })` classes (and their `dark:` adjustments) from the date-picker triggers, and the meaningless `aria-invalid` styling from `IGRPBadge`.
  - Fixed the package's lint errors: a complex `useMemo` dependency in the data-table faceted filter, two write-then-overwrite locals in the pie chart, and four `react-refresh/only-export-components` violations (documented file-scoped disables, matching the convention already used in `primitives/button.tsx` and `i18n/context.tsx`). `eslint src` is now clean.

- 913ff18: Fix typing, clearing and format handling in the single date pickers.

  **`IGRPDatePickerInputSingle`**

  - **Editing an existing date wiped the field.** Every keystroke was pushed into the form and read back, so the first backspace on `26-08-2026` parsed as invalid, wrote `undefined`, and the sync effect blanked the input. Typing is now held in a local draft and only committed when it parses; a half-typed date no longer touches the form value, and blurring an unfinished edit restores the committed date.
  - **The calendar became unreachable once a date was picked.** The popover trigger was rendered only while the field was empty, leaving `PopoverTrigger asChild` with no child, the popover with no anchor, and no way back into the calendar but an undiscoverable ArrowDown. The calendar button is now always rendered, alongside the clear button.
  - **Typing only worked for one exact spelling.** Input is masked to `dateFormat` as it is typed: `26082026` and `1-8-2026` both become `26-08-2026` / `01-08-2026`. Parsing tolerates the widths people actually type while still rejecting half-typed input and impossible days.
  - `onDateChange` fired **twice per keystroke** — both the handler and the callback it was given invoked it. It now fires once per committed change.
  - The input gained `autoComplete="off"`, `inputMode="numeric"` and `maxLength`, so browser form-history suggestions no longer shadow the calendar with text that cannot match the format.
  - `aria-invalid` / `aria-describedby` now land on the `input` itself rather than the wrapper, the calendar no longer duplicates the input's DOM id, and the calendar button's accessible name comes from the i18n catalog instead of a hardcoded string.

  **`IGRPDatePickerSingle`**

  - **Clearing emptied the value but kept displaying the old date.** Clearing wrote `undefined`, which react-hook-form reads as "no value set" — `useWatch` then hands back the field's _default_, so the picker immediately re-rendered the date it had just dropped. Cleared fields now write `null`.
  - The popover stays open after picking a date — fixed; it now closes on select, matching `IGRPDatePickerInputSingle`.
  - The default placeholder is the pt-PT `datePicker.placeholder` string instead of the hardcoded English `"Pick a date"`, the clear button honours `disabled` as well as `disabledPicker`, and `z-100` (not a generated Tailwind utility) is now `z-[100]`.

  **`IGRPCalendarSingle`**

  - `date ?? ownDate` could not express a cleared selection: once an internal selection existed, a parent passing `date={undefined}` could never deselect the day. Controlled mode is now decided by whether `date` was passed, not by whether it is defined. The same conflation is fixed in both single date pickers.

  **Utilities**

  - `formatDateToString` uses `format` instead of `lightFormat`, which understood only numeric tokens and silently rendered the rest as digits — `dd MMM yyyy` came out as `26 08 2026` while the matching `parse` read it as a month name, so the two single pickers disagreed on the same `dateFormat`.
  - `formatDateRange` formatted `range.from` twice, so every range rendered its start date on both sides.
  - `parseStringToDate` / `parseStringToRange` no longer reject on an exact-length check; they delegate to the new tolerant `parseDateInput`.
  - New exports: `parseDateInput`, `maskDateInput`, `getDateFormatParts`, `getDateFormatMaxLength`.

  Note for consumers: a cleared date picker now writes `null` into react-hook-form rather than `undefined`. Schemas that accept only `Date | undefined` (e.g. `z.date().optional()`) should accept `null` as well — `z.date().nullish()`.

- 7b437c3: Unblock the Storybook snapshot runner and refresh the baselines.

  `@storybook/test-runner` (0.24.5, the latest release, whose peer range claims `^10.6.0-0`) could not run against `storybook@10.6.0`: `getTestRunnerConfig()` loads `.storybook/test-runner.ts` through Storybook's `serverRequire` → `importModule`, which unconditionally calls `module.register()` to install a TypeScript loader hook. Jest 30 rejects that, so all 78 suites failed during setup and **zero** tests executed — the visual suite had been silently dead.

  `patches/storybook@10.6.0.patch` wraps that single `register()` call in a try/catch. The dynamic import immediately below is then transformed by the host runtime (Jest's own pipeline) instead, which handles the TypeScript config fine. Pinned via `patchedDependencies` in `pnpm-workspace.yaml`. Remove the patch once the incompatibility is fixed upstream.

  With the runner working, 483 tests now execute (481 pass) and the 402 snapshots have been regenerated against the current design system. Also removed the orphaned `NumberInput.stories.tsx.snap` (its story was renamed to `number-input.stories.tsx`, so the baseline had been stranded and its replacement never captured).

  Two failures remain, both pre-existing and unrelated to the design system — verified by rebuilding the affected component from `HEAD` and reproducing them:

  - `Components/Icons › IconGallery › smoke-test` — exceeds the runner's 15s per-test timeout while rendering the full lucide gallery (~23s).
  - `Components/Input/DatePicker/Single › DatePickerErrorA11y › play-test` — queries the trigger by `name: /pick a date/i`, but `FormLabel htmlFor` + `FormControl id` make the accessible name the field label ("Date of Birth"). A `<button>` is a labelable element, so the label wins over the contents in the accname algorithm. Either the query or the labelling needs to change.

- 7b437c3: Migrate the Horizon input layer onto the `Field` primitives and fix helper-text accessibility.

  Every `IGRPInput*` (and `IGRPFieldDescription`) previously rendered its own field scaffolding — a `div` with `*:not-first:mt-2` or `space-y-*`, plus raw `<p>` elements for helper text and errors. The exported `Field`, `FieldDescription` and `FieldError` primitives are now used instead, so IGRP inputs and hand-composed `Field` forms produce the same markup and spacing.

  **Accessibility fix (behavioural):** static helper text was rendered as `<p role="region" aria-live="polite">` in 22 places (and `role="note" aria-live="polite"` in two more). `region` declared a landmark with no accessible name, and `aria-live` caused screen readers to re-announce unchanged helper text on re-render. Helper text is now a plain `FieldDescription`; error text keeps `role="alert"` via `FieldError`.

  Affected: `IGRPInputText`, `IGRPInputPassword`, `IGRPInputNumber`, `IGRPInputTextarea`, `IGRPInputFile`, `IGRPInputTime`, `IGRPInputDateTime`, `IGRPInputUrl`, `IGRPInputPhone`, `IGRPInputColor`, `IGRPInputCheckbox`, `IGRPInputSwitch`, `IGRPInputSelect`, `IGRPInputRadioGroup`, `IGRPInputSearch`, `IGRPCombobox`, `IGRPInputWithAddons`, the date-picker inputs, `IGRPFieldDescription` and `IGRPFormField`.

  Component props are unchanged. Consumers who targeted the old internal markup — `p[role="region"]`, the `*:not-first:mt-2` wrapper, or the `text-xs` helper/error sizing — need to retarget `[data-slot="field-description"]` / `[data-slot="field-error"]`; helper and error text now inherit the `Field` type scale (`text-sm`).

- 2c09827: fix(info-card): wire up `orientation` and the color variants; drop the no-op `variantItem`

  `IGRPInfoCard` declared several props that were never read — the destructures
  sat commented out in the component, so passing them did nothing.

  - `orientation` now works. `vertical` (the default, unchanged) stacks the label
    above the value; `horizontal` places them side by side.
  - New `columns` prop (`1` | `2` | `3`, default `1`) flows a section's items into
    a responsive grid instead of a single column.
  - Both responsive behaviours key off the **card's own width** via a container
    query, not the viewport. An info card is routinely placed in a narrow grid
    cell or sidebar, where a viewport breakpoint reports far more room than the
    card actually has.
  - `variantSection` / `colorSection` applied only the background class, so the
    card kept the `text-card-foreground` it inherits from the `Card` primitive.
    `solid` therefore painted dark text on a filled background — a contrast
    failure — while `outline` rendered as a plain card because its border and
    accent were dropped. All three variants now apply their full slot.
  - Sections render as a description list (`dl` / `dt` / `dd`), so assistive
    technology reads each value as the value _of_ its label instead of as loose
    adjacent text. **This changes the rendered markup**: each section is now a
    `dl`, and each field a `div` wrapping a `dt` and `dd` rather than nested
    `div`/`span`. Selectors or snapshots targeting the old structure need updating.
  - Labels use `text-muted-foreground` for hierarchy, dimming to `opacity-80` on
    solid fills where a second color token would not read.
  - The header is no longer rendered when no `title` is given, instead of leaving
    an empty heading block.

  **Removed:** `variantItem` on `IGRPInfoItem`. Every role in `IGRPColors` maps to
  the same `textCard` class, so the prop could not affect rendering no matter what
  it was set to. Per-item accenting is now `colorItem` alone; drop `variantItem`
  from any call site. It is ignored under `variantSection="solid"`, where a
  per-item color cannot contrast against the filled background.

  **Added:** a `bgStatic` slot on every `IGRPColors` entry — the background with
  interactive state variants removed, for non-interactive surfaces. The `solid`
  backgrounds carry a `hover:` class intended for buttons, which an info card
  should never apply. `colors.test.ts` asserts `bgStatic` stays in sync with `bg`.

  `orientation` and `columns` default to the previous behaviour, so existing usage
  is unaffected apart from the markup change noted above.

- 913ff18: Rework the `Carousel` primitive's can-scroll state as an external store subscription instead of an effect.

  The previous shape (inherited from upstream shadcn) kept `canScrollPrev` / `canScrollNext` in `useState` and seeded them by calling the `select` handler synchronously inside the subscribing effect. That trips React's `set-state-in-effect` rule — a synchronous `setState` in an effect body forces a second render pass on every mount and on every embla re-init. Its cleanup also only detached `select`, leaving a stale `reInit` handler attached each time the effect re-ran.

  Both values now come from `useSyncExternalStore`, subscribed to embla's `reInit` and `select` events, reading `api.canScrollPrev()` / `api.canScrollNext()` as the snapshot and `false` as the server snapshot. The initial value is read during render rather than patched in afterwards, there is no cascading render, and both events are detached on unsubscribe.

  This deviates from upstream shadcn, which still has the effect-based version — `pnpm drift:shadcn` will report `carousel` as changed on the next sync. Keep the local version.

- 913ff18: Fix the Babel build and a batch of design-system component defects found in review.

  **Build pipeline (affects all three React packages)**

  - Pin the Babel toolchain back to 7.x. `babel-plugin-react-compiler` is built against
    the Babel 7 AST; under `@babel/core` 8 its HIR lowering fails on every destructured
    parameter carrying a default value, and the compiler swallows those errors per
    function and emits the original code. The build stayed green while memoization
    silently disappeared — 443 bailouts across 71 design-system files, with only 67 of
    184 emitted modules keeping a memo cache. Now 8 bailouts across 6 files (genuine
    per-component limitations) and 110 memoized modules.
  - Bump `babel-plugin-react-compiler` to the 1.0.0 stable release.
  - Pin `development: false` on `@babel/preset-react`. On 8 the flag follows
    `api.env()`, and the build scripts set no `NODE_ENV`, so every package emitted
    `react/jsx-dev-runtime` imports in place of `react/jsx-runtime`.
  - Drop the unused `@babel/preset-env` / `@types/babel__preset-env` dev dependencies;
    the shared config deliberately never used them.
  - Add `src/build-pipeline.test.ts`, which asserts on emitted output so neither
    failure can recur unnoticed.

  **Packaging**

  - Move `shadcn` from `dependencies` to `devDependencies`. It is an authoring-time
    CLI that nothing under `src/` imports, and every consuming app was installing it.
  - Pin `cn` and `radix-ui` to exact versions, matching their neighbours.

  **i18n**

  - Add `formList`, `inputFile` and `copyTo` string groups, plus `chat.errorMessage`
    and four `dataTable` filter placeholders. `IGRPFormList`, `IGRPInputFile`,
    `IGRPCopyTo` and the data-table filters hardcoded Portuguese with no override path.
  - Add a `locale` prop to `IGRPI18nProvider` (default `pt-PT`) with a `useIGRPLocale`
    hook and the `IGRP_DEFAULT_LOCALE` constant. `IGRPInputNumber`, the data-table date
    filter and `IGRPPdfViewer` formatted with `Intl`'s runtime-default locale, which
    resolves differently on the server and in the browser and hydrated mismatched.
  - Export `igrpFormatMessage` for catalog strings with `{token}` placeholders.

  **Components**

  - `IGRPFormList`: the first item could not be collapsed — collapsing was
    indistinguishable from "not yet chosen", so it sprang back open. The remove button
    rendered on the last item of a list that refuses to go empty, where clicking it did
    nothing. Standalone mode keyed rows by index, so removing a row re-keyed every row
    after it and lost focus and local state inside `renderItem`. Also drops `forwardRef`
    for React 19 ref-as-prop, removing a cast and a `@ts-expect-error`.
  - `IGRPInputNumber`: `className` was applied to the label as well as the root; it now
    reads the existing `labelClassName` prop. `onChange` now fires with `undefined` when
    the field is cleared — clearing was previously unobservable, and the `onChange` type
    widened to `(value: number | undefined) => void` to match. The `Intl.NumberFormat`
    instance is memoized instead of rebuilt every render, and locale separators are
    cached rather than recomputed per keystroke.
  - `IGRPInputFile`: remove buttons in the dropzone all shared the accessible name
    "Remover"; they now name their file. File rows are keyed by file identity rather
    than index. `maxSize={0}` / `maxFiles={0}` rendered a literal `0`. The dropzone's
    file list now clears on `form.reset()`.
  - `IGRPChat`: a rejected `fetch` escaped as an unhandled rejection and left the
    composer disabled permanently; every exit path now clears the loading state. The
    user avatar icon uses `text-primary-foreground` against its `bg-primary` backdrop.
  - `IGRPTextList`: the staggered reveal leaked one `setTimeout` per item, firing after
    unmount and landing stale indices on a changed list.
  - `IGRPIcon`: an unknown icon name no longer warns during render, and the fallback
    glyph keeps the caller's `size`, `className` and `id` instead of collapsing layout.
  - `IGRPStatsCard`: `{...props}` was spread before the interactive handlers, so a
    caller's `onClick` was silently discarded.
  - Data-table date filter: controlled open state instead of remounting the whole
    popover via `key` to close it.
  - Add `"use client"` to `primitives/carousel`, `primitives/form`, `primitives/sidebar`
    and `theme-provider`, which upstream shadcn ships with it.

  **Lint**

  `pnpm lint` was failing on two upstream shadcn files. The rules they don't satisfy are
  now scoped off in `eslint.config.js` rather than the files being edited, which would
  create permanent drift on every shadcn release.

- e0015f2: Close out a WCAG 2.1 AA audit of the design system.

  **Tokens (`tokens.css`)** — every pair below was measured in OKLCH and now meets
  4.5:1 for text / 3:1 for UI boundaries in both themes:

  - Light `--warning` was 2.15:1 as text on the page background; darkened to match the
    lightness of `--success` / `--info`, and `--warning-foreground` flipped to near-white
    so solid warning fills still pass.
  - Dark `--destructive-foreground`, `--info-foreground` and `--indigo-foreground` were
    near-white on light fills (2.7-3.6:1); they are now dark, as `--warning-foreground`
    already was. `--info` lightened so its soft tint clears 4.5:1.
  - Light `--border` / `--input` / `--ring` (and their sidebar twins) were 1.2-2.6:1
    against the page — below the 3:1 needed to identify a control. Dark `--border`
    went 10% -> 20%.
  - `--muted-foreground` and light `--destructive` nudged to clear 4.5:1 on every surface.
  - `IGRPColors.soft.*` tints drop from `/10` to `/5`: a same-hue tint at 10% pulled the
    surface toward the text and held several variants just under 4.5:1.

  **Components**

  - `IGRPInputPassword`: the show/hide toggle was `tabIndex={-1}`, so keyboard-only users
    could never reveal what they typed.
  - `IGRPDataTable`: `aria-sort` moved from a wrapper `<div>` to the `<th>`. It is only
    honoured on a `columnheader`, so sort state was never announced.
  - `IGRPTextList`: adds `aria-expanded` for collapsible items and `aria-disabled` for
    disabled ones (which are no longer focusable); items render as `<li>` so the `<ul>`
    has valid children; the colour variant now uses the `outline` slot, since the `solid`
    slot's foreground is meant for a filled surface, not the page background.
  - `IGRPMenuNavigation`: `role="listitem"` moved off the `<button>` onto a wrapping row.
    On the button it replaced the button role and the item stopped announcing as clickable.
  - `IGRPPdfViewerCard`: focusable when clickable but had no focus indicator.
  - `IGRPAlert`: solid variants no longer override their paired `*-foreground` with the
    page background colour.
  - `IGRPIcon`: falls back to `useId()` rather than the icon name, which emitted duplicate
    DOM ids for every repeat of an icon.
  - `IGRPInputSelect`: the option thumbnail is marked decorative instead of repeating the
    option label to screen readers.

  **Gates** — `eslint-plugin-jsx-a11y` in the package lint config (relaxed in
  `primitives/` only for rules that fire on unmodified upstream shadcn markup), and a
  `tokens-contrast.test.ts` that recomputes every token pair and fails on a regression.

- 7b437c3: Build with a single Babel pass over `src/`, and fix the React Compiler gate.

  **The bug.** The React Compiler step gated on a literal `'use client'`
  (single-quoted) substring. `design-system` formats with Prettier
  `singleQuote: false`, so its output emits `"use client"` and the gate matched
  nothing — the compiler was a silent no-op across the entire package while the
  build still exited 0. The check is now quote-agnostic.

  **The cause.** The compiler ran as a second Babel pass over `dist/`, so it was
  analysing generated output rather than the code as written — which is both why
  the bug was invisible and why coverage was poor even where the gate did match.
  SWC, `.swcrc`, `dist_optimized` and `swap-dist.mjs` are gone; `build:js` now
  runs Babel once over `src/` (TypeScript strip, JSX, React Compiler) and
  `build:types` emits declarations. Output is unchanged in shape — file-per-module
  ESM at esnext, no bundling, no minification, no `@babel/preset-env` — because
  `templates/demo-v1` consumes `dist/` directly.

  Verified identical across all three packages: same emitted file list, same
  `use client` / `use server` boundaries (zero lost). Memoized modules rose from
  22 to 69 in `design-system` and 11 to 24 in `framework-next-ui`.

  **Also.** The compiler's skip rule tested substrings (`context`, `provider`,
  `index`, ...) against the whole file _path_, excluding every barrel and
  everything under a `providers/` directory regardless of content; it now tests
  the contents for `createContext`. `"use no memo"` remains the per-file opt-out.
  Compiled tests and their `.d.ts` no longer ship in the published tarballs.

- 913ff18: Fix `InputGroupAddon` click-to-focus.

  - **A consumer `onClick` silently disabled click-to-focus.** The internal handler was declared before `{...props}`, so `<InputGroupAddon onClick={…}>` overwrote it wholesale. `onClick` is now destructured and composed — the consumer handler runs first, and `e.defaultPrevented` gives it an opt-out.
  - **Textarea groups never focused.** The handler looked for `querySelector("input")`, so clicking an addon in an `InputGroupTextarea` group focused nothing. It now targets `[data-slot="input-group-control"]`, which both controls render, and which cannot match an unrelated `<input>` nested in a different addon.
  - **The interactive-element guard escaped the addon.** `closest("button")` walks past `currentTarget`, so every addon click bailed out when the whole group sat inside a button (a combobox trigger, a toolbar toggle). The match must now be contained by the addon.
  - **Only `<button>` counted as interactive.** Clicking a link, checkbox, select or `[role="button"]` inside an addon stole focus to the control. The guard now covers the standard interactive set plus focusable `[tabindex]`.

  The first and third items are deliberate divergence from upstream shadcn; `scripts/check-shadcn-drift.mjs` will report them on its next run.

- 7b437c3: Route the remaining hardcoded UI strings through the i18n catalog.

  The design system shipped a mixed-language UI: ~34 `aria-label`/`placeholder` literals and a dozen default prop values were English, while neighbouring strings in the same files were already pt-PT (`data-table/filter.tsx` had an English `notFoundText` default and a pt-PT `aria-label` in one file). `i18n/strings.ts` states the rule — never hardcode a user-visible string in a component — so this brings the components in line with it.

  `IGRPI18nStrings` gains groups for `button`, `datePicker`, `inputSelect`, `inputUrl`, `combobox`, `alertDialog`, `banner`, `notification`, `avatar`, `chat`, `imageCropper`, `stepper`, `tabs`, `pageHeader`, `pdfViewer`, and `dataTable` is extended with sorting, selection, pagination and column-visibility strings. All are overridable through `IGRPI18nProvider`.

  **Behavioural:** components that previously rendered English now render pt-PT by default — the data-table pagination and sorting controls, the column-visibility menu, the password/date-picker/select/url/stepper/tabs aria-labels, `IGRPButton`'s loading text, and the `IGRPAlertDialog` / `IGRPBanner` / `IGRPImageCropper` / `IGRPPdfViewer` / `IGRPCombobox` default labels. Props that previously carried an English default (`actionLabel`, `cancelLabel`, `loadingText`, `notFoundText`, `selectLabel`, `searchText`, `optionsLabel`, `ariaLabel`, `loadErrorLabel`, `notFoundLabel`, `cropLabel`, …) still exist and still win when passed; their defaults now resolve from the catalog. Wrap the app in `IGRPI18nProvider` to restore English.

- 2c09827: fix(input-color): bind to the form value, and fix disabled / a11y / parsing

  `IGRPInputColor` kept the selected color in component state and never read the
  field value, so `defaultValues`, `setValue()` and `reset()` never reached the
  swatch or the value field — an untouched field could submit a value that did not
  match what was on screen.

  - The committed color now comes from the field value (or `value` when
    controlled); only the in-progress text edit is local state.
  - The displayed format follows the format the stored value declares, so a saved
    `#3b82f6` is no longer rewritten as `oklch(…)` before the user touches it.
    `defaultFormat` applies when the value declares none.
  - `disabled` now disables the value field and the format selector too — both
    stayed keyboard-reachable and editable behind a `pointer-events-none` wrapper.
  - The visible label is associated with the picker, and `aria-describedby` /
    `aria-invalid` reach the controls instead of the wrapper element.
  - User-facing strings moved to the i18n catalog (new `inputColor` group,
    pt-PT defaults) — they were hardcoded in English.
  - The value field accepts the full CSS syntax (`rgb(255 0 0 / 50%)`,
    `hsl(210 40% 50%)`, `oklch(62.8% 0.25 29)`, `#rgba` / `#rrggbbaa`, `deg` and
    `%` units; alpha is discarded) and an unparseable entry now shows a message
    instead of silently reverting. Override it with `invalidValueMessage`.
  - Unparseable text is published as typed instead of being held back, so the
    field value and the value on screen never disagree and the consumer schema
    decides whether to reject it; the swatch keeps the last color that parsed. The
    built-in message is suppressed when the field already carries an error, so a
    schema message is not doubled up.
  - Props declared by the type (`placeholder`, `readOnly`, `inputClassName`, …)
    are forwarded to the value field instead of being dropped.

- 02bc0a8: fix(input-number): make decimal input actually typable

  `IGRPInputNumber` re-parsed the field on every keystroke and wrote the parsed
  number straight back to the input, which dropped the decimal separator ("3." ->
  3, so "3.14" became 31) and, for formatted fields, stripped the locale group /
  decimal separators ("12,55" + "5" -> 12555).

  - The text being typed is now kept as-is until the field is left; the parsed
    value is still published on every keystroke.
  - Focusing a formatted field swaps the formatted text for an editable,
    unformatted one (percent fields are edited in percent units) and re-formats
    on blur, so a displayed value can be edited in place.
  - Formatted input is parsed with the same locale separators used to display it.
  - `min` / `max` are applied on blur instead of per keystroke, so values such as
    15 stay reachable in a field whose `min` is 10.
  - Stepper results are rounded to the precision of the step, removing floating
    point drift (12.50 + five 0.01 steps is 12.55, not 12.549999999999999).

## 0.2.0-beta.0

### Minor Changes

- Start the `0.2.0-beta` pre-release line (from `0.1.0-beta.*`). No code changes relative to the last `0.1.0-beta` build on this branch.

## 0.1.0-beta.146

### Patch Changes

- fd98d4c: - `cn()` is now backed by the official `cn` package instead of `clsx` + `tailwind-merge`; the exported API is unchanged for consumers.
  - Resizable primitives updated to the react-resizable-panels v4 API (`Group`/`Separator`, `aria-orientation` variants); the drag handle grip icon is replaced by a slimmer bar.
  - Build configuration fixes for `next-auth` (TypeScript deprecation flag) and `template-migrator` (explicit `node` types).
- - Default `IGRPCalendarSingle` month navigation to 5 years before and after today via DayPicker `startMonth` / `endMonth`, while still allowing consumers to override those props.
- - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.
- fix(date-picker): render date-only ISO form values on the correct day west of Greenwich

  The date pickers declare their value as `Date | undefined`, but react-hook-form hands over
  whatever the API put in the form — typically a date-only ISO string such as `"2026-08-26"`.
  ECMAScript reads a date-only string as UTC midnight, so date-fns formatted it as the
  previous day in any UTC-N zone: `Atlantic/Cape_Verde` showed `26-08-2026` as `25-08-2026`.
  The calendar received the same value and highlighted the wrong day, so clicking the
  highlighted day wrote that wrong date back to the form.

  All four components were affected — `IGRPDatePickerSingle`, `IGRPDatePickerInputSingle`,
  `IGRPDatePickerRange` and `IGRPDatePickerMultiple`. Each now coerces the form value at the
  `field.value` boundary via the new `toLocalDate` / `toLocalDateRange` / `toLocalDates`
  helpers in `calendar-utils`. Strings that carry a time denote an instant and are passed
  through unshifted; `Date` values are untouched.

  Regression tests are pinned to a UTC-N zone, since these assertions pass in UTC and east of
  Greenwich with or without the fix.

- fix(form-list): stop `IGRPFormList` from seeding two rows instead of one

  `IGRPFormList` in form mode seeds one row when the array is empty and `allowEmpty` is
  off. The guard read the `fields` snapshot closed over by its own render, and `fields` is
  React state that lags the underlying array — so any second invocation of the effect
  against that same snapshot (React StrictMode's dev double-invoke, or a re-run before the
  field-array state flushed) still saw an empty list and appended a duplicate. Consumers
  saw two rows where exactly one was expected. The guard now reads the live form value,
  which reflects the append immediately.

  `IGRPForm` also no longer re-applies `defaultValues` that `useForm` already consumed on
  the first render. That mount-time `reset()` ran after child effects and wiped the row
  `IGRPFormList` had just seeded, leaving a list that rendered zero rows and never
  re-seeded. `isDirty` is now read during render so its subscription is registered on every
  run, not only on the runs that reach the guard.

- Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

- fix(stepper): render `IGRPStepperProcess` separators as a single-apex chevron

  The arrow between steps was drawn with two skewed pseudo-elements, each `h-4.25` (17px) and
  skewed about its own centre (y=8.5 and y=15.5) rather than the row's middle. On the `h-6`
  (24px) row this put the widest points at y=7 and y=17 with a dip at y=12, and pulled the top
  and bottom corners ~4.5px inward — a blunt, jogged, asymmetric separator (the mismatched
  `28deg`/`30deg` angles added to it). Any row taller than 34px also left a bald band across
  the middle, since two 17px halves cannot cover it.

  The shape is now a single `clip-path` polygon with its apex at `50%`, painted on a dedicated
  background layer inside each step, so it is symmetric, correct at any row height, and
  identical in light and dark. Rounded end caps moved to that layer; keeping the shape off the
  step itself means a focus ring on the step trigger is no longer clipped by the chevron.

  Step title behaviour is unchanged.

## 0.1.0-beta.145

### Patch Changes

- 7ffc339: fix(date-picker): render date-only ISO form values on the correct day west of Greenwich

  The date pickers declare their value as `Date | undefined`, but react-hook-form hands over
  whatever the API put in the form — typically a date-only ISO string such as `"2026-08-26"`.
  ECMAScript reads a date-only string as UTC midnight, so date-fns formatted it as the
  previous day in any UTC-N zone: `Atlantic/Cape_Verde` showed `26-08-2026` as `25-08-2026`.
  The calendar received the same value and highlighted the wrong day, so clicking the
  highlighted day wrote that wrong date back to the form.

  All four components were affected — `IGRPDatePickerSingle`, `IGRPDatePickerInputSingle`,
  `IGRPDatePickerRange` and `IGRPDatePickerMultiple`. Each now coerces the form value at the
  `field.value` boundary via the new `toLocalDate` / `toLocalDateRange` / `toLocalDates`
  helpers in `calendar-utils`. Strings that carry a time denote an instant and are passed
  through unshifted; `Date` values are untouched.

  Regression tests are pinned to a UTC-N zone, since these assertions pass in UTC and east of
  Greenwich with or without the fix.

- 928c46b: fix(form-list): stop `IGRPFormList` from seeding two rows instead of one

  `IGRPFormList` in form mode seeds one row when the array is empty and `allowEmpty` is
  off. The guard read the `fields` snapshot closed over by its own render, and `fields` is
  React state that lags the underlying array — so any second invocation of the effect
  against that same snapshot (React StrictMode's dev double-invoke, or a re-run before the
  field-array state flushed) still saw an empty list and appended a duplicate. Consumers
  saw two rows where exactly one was expected. The guard now reads the live form value,
  which reflects the append immediately.

  `IGRPForm` also no longer re-applies `defaultValues` that `useForm` already consumed on
  the first render. That mount-time `reset()` ran after child effects and wiped the row
  `IGRPFormList` had just seeded, leaving a list that rendered zero rows and never
  re-seeded. `isDirty` is now read during render so its subscription is registered on every
  run, not only on the runs that reach the guard.

## 0.1.0-beta.144

### Patch Changes

- 93cb0dd: fix(stepper): render `IGRPStepperProcess` separators as a single-apex chevron

  The arrow between steps was drawn with two skewed pseudo-elements, each `h-4.25` (17px) and
  skewed about its own centre (y=8.5 and y=15.5) rather than the row's middle. On the `h-6`
  (24px) row this put the widest points at y=7 and y=17 with a dip at y=12, and pulled the top
  and bottom corners ~4.5px inward — a blunt, jogged, asymmetric separator (the mismatched
  `28deg`/`30deg` angles added to it). Any row taller than 34px also left a bald band across
  the middle, since two 17px halves cannot cover it.

  The shape is now a single `clip-path` polygon with its apex at `50%`, painted on a dedicated
  background layer inside each step, so it is symmetric, correct at any row height, and
  identical in light and dark. Rounded end caps moved to that layer; keeping the shape off the
  step itself means a focus ring on the step trigger is no longer clipped by the chevron.

  Step title behaviour is unchanged.

## 0.1.0-beta.143

### Patch Changes

- 5a4ec99: - The design system now requires `zod` `^4.5.0` instead of `^4.4.0`, matching the range `@igrp/framework-next` already declares. Apps on zod `4.4.x` must upgrade to `4.5.x`.
  - `@igrp/framework-next-ui` pins `react`, `react-dom` and `next-auth` as devDependencies so it builds and typechecks against the same versions every other framework package uses, instead of whatever the workspace happened to hoist.
  - `@igrp/template-migrator` gains a typecheck config for its `scripts/` folder; no change to the published CLI or migration set.

## 0.1.0-beta.142

### Patch Changes

- b501876: - Default `IGRPCalendarSingle` month navigation to 5 years before and after today via DayPicker `startMonth` / `endMonth`, while still allowing consumers to override those props.
- f3e0c00: Library packaging hygiene across all published packages:

  - `@igrp/framework-next`: `next`, `react`, `react-dom` moved from `dependencies` to `peerDependencies` (range-based) — prevents duplicate React copies in consumer apps.
  - All packages: exact-pinned `peerDependencies` relaxed to caret ranges (`react ^19.2.0`, `next ^15.5.0`, `next-auth ^4.24.0`, `zod ^4.4.0`, etc.) so consumers on newer patch/minor versions no longer get unmet-peer errors.
  - `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`: `tailwindcss` moved to `devDependencies` (Tailwind compiles in the consuming app); unused `zod` dependency removed from `next-ui`; duplicated `publishConfig.exports` removed.
  - `@igrp/framework-next-types`: added an `exports` map (blocks deep imports into `dist/`, consistent with the other packages).
  - `@igrp/framework-next`, `@igrp/template-migrator`: `types` condition now listed first in `exports`.
  - `@igrp/template-migrator`: added `license`, `author`, top-level `types`, `publishConfig.tag`/`access`; `clean` now uses cross-platform `rimraf`.
  - All packages: added `repository`/`homepage`/`bugs` metadata, normalized `engines.node` to `>=22`, added `./package.json` export.

## 0.1.0-beta.141

### Patch Changes

- 2d9bdef: - Add `IGRPRepetitiveComponent` — generic render-prop component for mapping a list of items with a key extractor, exported from the design system root
  - Fix `IGRPModalDialog` sticky header/footer layout: use `-mx-6 px-6` for true edge-to-edge spanning, correct z-index to `z-10`, and add `max-h-[95vh]` on the full-size variant; simplify `IGRPModalDialogDescription` to accept standard `children` instead of a `name` shorthand prop
  - Add template-migrator migration 24: resync `demo-v1` `(igrp)/layout.tsx` (hoists `IGRPQueryProvider`) and `.env.example` to beta.159, bumping all `@igrp/*` framework deps

## 0.1.0-beta.140

### Patch Changes

- 9e8e240: `IGRPCombobox`: default `value` to `undefined` instead of `""` so standalone
  uncontrolled usage persists the selection (previously the `localValue` path was
  dead and the selection never displayed).
- 781f753: `IGRPDataTable` client filter: derive `isFiltered` from the live column-filter
  state each render instead of memoizing on the stable `table` reference, so the
  Clear-filters button appears after a filter is applied.
- aca828e: DataTable date-range filter guards invalid/unparseable dates instead of
  silently dropping every row; `formatChartValue` abbreviates negative
  magnitudes (`-2.5M`); `getChartHeight`/`getChartWidth` honor an explicit `0`
  and drop their no-op ternaries.
- 1da77de: Memoize `IGRPDataTable`'s column helper, derived `allColumns`, and
  `filterDescriptors` (keyed on `columns`/`actions`). The component opts out of
  the React Compiler (`"use no memo"`, required by `useReactTable`), so these
  were rebuilt on every render and forced TanStack to reset its column model on
  any unrelated parent re-render. Documents in `IGRPDataTableProps` that callers
  must keep `data` and `columns` referentially stable.
- 6467e14: `IGRPDataTableButtonModal` no longer hosts its body inside
  `<DialogDescription asChild>`. That cloned arbitrary content (typically a whole
  form) onto Radix's `Slot`, which announced the entire subtree as the dialog's
  `aria-describedby` description and threw `React.Children.only` for any
  multi-root `render()`. The body now renders in a plain `<div>`, with a separate
  short visually-hidden `DialogDescription` satisfying the `aria-describedby`
  contract. `DialogTitle` is unchanged.
- d8daf50: `IGRPDataTableButtonAlert` no longer renders an empty `AlertDialogDescription`
  when the action has no description. The description is now guarded on `children`,
  so Radix gets no dangling `aria-describedby` and screen readers aren't handed an
  empty description node. (`IGRPAlertDialog` already guards on `description`.)
- 8cb2fc5: Default chart grid/axis/reference colors to semantic tokens instead of hardcoded
  hex (`#e5e7eb`/`#d1d5db`). `gridColor`/`referenceLineColor` now default to
  `var(--border)` and `axisColor` to `var(--muted-foreground)` across area, line,
  radar, radial, and bar charts, so gridlines and axes adapt to dark mode without
  per-chart overrides. The color props remain overridable.
- 6cb1cec: `src/index.css` (the Storybook root stylesheet) now `@import`s `./tokens.css`
  instead of carrying a hand-maintained duplicate of the `@theme inline` / `:root`
  / `.dark` token blocks. The duplicate had drifted — it lacked
  `--destructive-foreground`, `--indigo*`, and `--sidebar-active*` (which
  `lib/colors.ts` emits), so Storybook rendered those variants with undefined
  custom properties. `tokens.css` is now the single source of truth.

## 0.1.0-beta.139

### Patch Changes

- 0850757: charts: migrate to recharts 3. The chart primitives (`ChartContainer`/`ChartTooltipContent`/`ChartLegendContent`) are re-synced with upstream shadcn for the recharts 3 type surface (`DefaultTooltipContentProps`/`DefaultLegendContentProps`, `ResponsiveContainer` `initialDimension`). Horizon chart fixes for recharts 3 breaking changes: pie drops the removed `Pie.activeIndex` prop (interactive active segment is now driven by hover/tooltip state); pie and radial manual legends move from the removed `<Legend payload>` prop to the `content` render prop via a shared `ChartCustomLegend`; radial `LabelList.formatter` is rewritten for the new `(value) => …` signature (previously received `{ payload }`). `recharts` peer dependency is now `3.8.1`.

## 0.1.0-beta.138

### Patch Changes

- fc2fe20: - `next-auth`: add `console.error` diagnostics when introspection marks the refresh token inactive or when `refreshOidcAccessToken` returns an error flag or throws — makes login-loop root causes visible in server logs
  - `next`: replace `unstable_cache` with `React.cache()` in `use-user` — prevents stale 401s caused by rotating access tokens being embedded in the `unstable_cache` key

## 0.1.0-beta.137

### Patch Changes

- af28e9a: feat(ds): add asChild prop to IGRPButton for Slot-based rendering

## 0.1.0-beta.136

### Patch Changes

- 033e1d7: `IGRPDataTable`: disable TanStack's `autoResetPageIndex`/`autoResetExpanded` — their microtask-based reset dispatches state updates before the component mounts under React 19 concurrent rendering ("Can't perform a React state update on a component that hasn't mounted yet"). The page-index reset on filter/sort changes is now handled synchronously in `tableReducer` instead, preserving the previous UX.

## 0.1.0-beta.135

### Patch Changes

- 0eb0323: - `IGRPText`: deprecate the `variant` color prop and stop applying a hard-coded solid color class, so text color now inherits from `className` / semantic tokens instead of being forced to `primary`.
  - `IGRPStatusBanner`: drop redundant `cn()` wrappers around static className strings.

## 0.1.0-beta.134

### Patch Changes

- 6b42572: - Coordinated maintenance release: bump all framework packages to the next beta to keep versions aligned across the framework.

## 0.1.0-beta.133

### Patch Changes

- 1829701: refactor(ds): streamline imports and formatting in Horizon inputs, form, and i18n

  Non-functional readability pass — no API or runtime behavior change:
  - Consolidate multi-line imports/exports onto single lines in `input/search.tsx`, `input/text.tsx`, `i18n/context.tsx`, and `i18n/index.ts`.
  - Reformat the `IGRPForm` `useEffect` dependency array (same dependencies) and collapse a wrapper `div` className in `IGRPInputText`.

## 0.1.0-beta.132

### Patch Changes

- 62faea7: Design-system audit follow-ups (no public API breaks):
  - **`src/lib/colors.ts`**: replace raw Tailwind palette references (`text-emerald-700 dark:text-emerald-400`, `bg-red-500`, etc.) with semantic tokens (`text-success`, `bg-destructive`, …). Dark mode is now driven entirely by token theming. The `IGRPColors` shape and all exported types are unchanged.
  - **`tokens.css`**: add `--destructive-foreground`, `--indigo`, `--indigo-foreground` light and dark values plus their `@theme inline` entries, so `colors.ts` (and downstream consumers) can express the full destructive/indigo roles via semantic tokens.
  - **`IGRPForm`**: the `defaultValues` sync effect now skips reset when the form is dirty, so a parent re-rendering with a new `defaultValues` object reference no longer clobbers user input. Consumers that _want_ to overwrite dirty state should bump `resetKey` or call `formRef.current?.reset()` explicitly.
  - **`IGRPDataTable`**: extract `IGRPDataTableRowActions` to a separate file (`data-table/row-actions-cell.tsx`) without the `"use no memo"` directive, so the React Compiler can memoize per-row renders. The parent table file still opts out (required for `useReactTable`).
  - **Docs**: document the shadcn drift-checker script and the primitives-layer `dark:` policy in the package CLAUDE.md + README.
  - **Tests**: add a Vitest + React Testing Library setup (jsdom) with focused unit tests for `IGRPForm` (submit/validation/global error/dirty guard/pristine sync), `IGRPInputText` (label, helper, error, required), and `IGRPDataTable` (smoke + empty-state).

- 773b8b0: Design-system robustness pass — M1 (a11y), M2 (i18n + type safety), M3 (test breadth + side-effect hygiene). No breaking public API changes.

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

- b88c4b1: Add dedicated `--sidebar-active` / `--sidebar-active-foreground` tokens (light + dark, registered in `@theme inline`) for the selected sidebar menu item. Defaults to a `color-mix` tint of `--sidebar-primary` so the highlight tracks the active theme, while remaining independently overridable by consumers.

## 0.1.0-beta.131

### Patch Changes

- 48d2818: Web Interface Guidelines a11y pass: fix dead expander button and inverted theme-color constants; default `aria-hidden` on `IGRPIcon` and enforce an accessible name on icon-only `IGRPButton`; standardize input `aria-describedby`/label wiring and password hardening; add live regions to alert/notification/chat/form; scope `transition-all` and add reduced-motion guards; correct invalid ARIA on stepper/menu-navigation; locale-aware date formatting via `Intl.DateTimeFormat`. Note: `IGRPDataTableCellDate` props change from `dateFormat` to `language`/`dateOptions`.
- 48dd45c: - Use `move-cli` instead of the cmd.exe `move` builtin in the `build:babel` step so the build runs on non-Windows platforms.
- 3377f52: chore(design-system): close-out Bundle A — finish /styles removal, catalogue deltas, add IGRPMenubar, harden drift script
  - Remove the deprecated `/styles` export entirely: dropped from `publishConfig.exports`, the `tailwind:build` script and its build-chain invocation are gone, the generated `src/styles.css` is deleted, `@tailwindcss/cli` dropped from devDependencies. Templates import `/tokens` only and compile Tailwind in the app. README and CLAUDE.md updated to reflect the removal.
  - Catalogue the four remaining IGRP-custom primitive deltas in `COMPONENTS.md` (Accordion, Form, Popover, RadioGroup) alongside the existing Button entry. Combined with Button, this is the complete intentional-divergence baseline the drift detector compares against.
  - Drift detector hardening: spawn options now use `shell: process.platform === "win32"` so `npx`/`npm` shims resolve on Windows; removed the `#!/usr/bin/env node` shebang from the `.mjs` so vitest 4.1.x can import it without a parser error.
  - `drift-baseline-2026-05.md`: first end-to-end run captured. The run revealed two further structural defects in the script (non-interactive `init` blocks on a prompt → no `components.json`; `hasDrift` swallows non-zero CLI exits as `ok`). No actionable baseline this cycle; the next baseline will be the first real one after those fixes land in a follow-up.
  - Add `IGRPMenubar` Horizon wrapper — pure re-export of all 16 primitive `Menubar*` sub-components under `IGRP*` aliases, mirroring the `IGRPDropdownMenu` pattern. Closes the Horizon-layer Menubar gap.

- db24347: Replace raw color utilities with semantic tokens: add a `--highlight` / `--highlight-foreground` token (used by `IGRPText` highlighting) and drop manual `dark:bg-zinc-900/60` overrides on `IGRPModalDialog` sticky header/footer. Reconcile the legacy `index.css` theme with `tokens.css` by adding the previously missing `success`/`warning`/`info` tokens so the `/styles` build matches the `/tokens` export.
- c412311: refactor(design-system): peer-dep heavy libs, deprecate /styles export, add COMPONENTS.md + shadcn-drift detector
  - Move `react-hook-form`, `zod`, `recharts`, `@tanstack/react-table`, `date-fns`, and `lucide-react` from `dependencies` to `peerDependencies` so consumers can upgrade them independently and avoid duplicate copies. Loosened semver ranges; mirrored as `devDependencies` so the DS still builds standalone.
  - Deprecate the `/styles` export. Removed from the dev `exports` map; kept in `publishConfig.exports` for one more beta as a soft-deprecation window. Scheduled for removal in the next beta. Templates must import `/tokens` only and compile Tailwind in the app.
  - Add `packages/design-system/COMPONENTS.md` — three-layer (Horizon / Primitive / Custom) reference map with IGRP deltas from upstream shadcn and the experimental-layer promotion criteria.
  - Add `pnpm drift:shadcn` — periodic-maintenance script that compares each primitive against upstream shadcn via the CLI `--diff` flow. Not wired into CI.

- 55b7077: design-system: define the missing `--chart-6/7/8` tokens (violet/red/lime, light + dark) that `IGRP_CHART_COLORS` already referenced, so charts with 6–8 series render correct fills instead of blanks. Replace the hardcoded `dark:border-slate-800/60` on the data-table header row with the semantic `border-border` token. Make the data-table input-filter accessible label configurable via a new `ariaLabel` prop (and matching `ariaLabel` on the filter descriptor); pt-PT default labels are unchanged.

  template: extend the theme variants (blue/green/amber/default/mono) beyond `--primary` to also re-theme `--ring`, `--sidebar-primary`, and (for the colored themes) the primary `--chart-1` series, so a selected theme expresses brand identity across focus rings, the active sidebar item, and charts.

## 0.1.0-beta.130

### Patch Changes

- 2a06c02: fix(design-system): add Spinner primitive; announce IGRPLoadingSpinner via role=status; next/image for cropper preview; autocomplete/inputmode on phone & url inputs; replace raw tailwind colors with semantic tokens; narrow transition-all in horizon layer; honor prefers-reduced-motion on animations
- a1fbb7c: - Raise the minimum supported Node.js engine from `>=20.x.x` to `>=22.x.x` to match the rest of the monorepo.

## 0.1.0-beta.129

### Patch Changes

- ac94a9c: Promote experimental components to Horizon: IGRPBreadcrumb (with size/color variants and dropdown collapsing), IGRPBanner (cookie and announcement variants), IGRPImageCropper (basic/circular/zoom/preview variants); add dropzone variant to IGRPInputFile with all UI strings configurable as props
- a4ef1fe: Add success, warning, info as first-class semantic tokens; replace all raw Tailwind colors in IGRPStatsCard with semantic tokens; fix proportional icon sizing in IGRPStatsCard; standardize IGRPButton icon sizes to Tailwind scale and gap to gap-1.5
- 9a0dd9b: fix(data-table): fix filter state desync, date range picker, clear-all button, select rendering, and a11y issues
- 9f9ee3d: Add createIGRPColumnHelper with cellType shortcuts, unified actions prop, declarative filter descriptors, onQueryChange server-side callback, and pagination config prop to IGRPDataTable
- 72268fd: a11y/polish pass: focus rings, motion-safe animations, tabular-nums, text-balance, onError callback, remove stale iconSize prop
- ba86302: Remove dead experimental components (timeline, sheet, progress, appointment-picker); remove IGRPStandaloneList and IGRPRepetitiveComponent; fix sidebar cookie restore on mount; add shadcn audit date tracking to all primitives

## 0.1.0-beta.128

### Patch Changes

- fe2ed3d: - Update `@types/node` to v25.7.0 across all framework packages
  - Bump `typescript-eslint` and `vitest` to latest versions

## 0.1.0-beta.116

### Patch Changes

- beta.116 — template migrator CLI, lock file relocation, and release tooling fixes.

  @igrp/template-migrator
  - New CLI package that automates IGRP template upgrades via `pnpm dlx @igrp/template-migrator@latest`.
  - Bundles all 6 demo-v1 migration guides (01–06) as a cumulative manifest with embedded payloads.
  - Commands: status, plan, apply (--yes / --to), list, rollback, check (CI gate).
  - Lock file moved from root `.igrpmigrations.lock.json` → `.igrpmigrations/lock.json`; backward-compat read of old path on first run.
  - Prebuild pack script cleans payload output on every run to prevent stale files.
  - tsup config: shims disabled (no \_\_dirname polyfill injection before shebang), banner removed (shebang lives in src/cli.ts line 1).

  @igrp/framework-next-template (templates/demo-v1)
  - `.igrpmigrations/lock.json` pre-seeded to mark all 6 migrations as applied.
  - `create-zip-template.ps1` updated to strip migration guides and payloads from the published zip — only `lock.json` is included so consumers start fully up-to-date.
  - `MIGRATING.md` added: end-user upgrade guide (status → plan → apply workflow).

## 0.1.0-beta.115

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.114

### Patch Changes

- Edge-safe auth refactor + App Router error-handling overhaul.

  @igrp/framework-next-auth
  - Split withIGRPAuth() into Edge-safe shell + lazy Node helpers; next-auth (main) and next/headers are no longer static imports. Fixes TypeError reading 'custom' from openid-client leaking into the Edge middleware bundle under Next.js 15.5.15.
  - interopDefault() helper normalizes CJS/ESM default-import mismatch against next-auth v4 (KeycloakProvider, NextAuth).
  - tsup is now the single producer of dist/; added ./oidc and ./providers subpath exports; trimmed root barrel to Edge-safe modules only.
  - Tolerates AUTH_PROVIDER=none by returning a stub instance (404 on auth routes) instead of crashing NextAuth with an empty providers array.

  @igrp/framework-next
  - New ./errors subpath with typed IgrpError hierarchy (IgrpConfigError, IgrpAuthConfigError, IgrpLayoutDataError) and isIgrpError structural guard — designed to survive production error.message redaction via stable error.name.
  - Access-management config validation moved from IGRPLayout into igrpBuildConfig so throws fire at root-segment render where global-error.tsx can catch them.
  - IGRPLayout and fetchLayoutData now throw typed errors instead of raw Error.

  @igrp/framework-next-ui
  - New IGRPSegmentError component for segment-level error.tsx boundaries — renders inside layout chrome, offers reset + go-home actions, accepts resolveCopy(error) for i18n.

  @igrp/framework-next-template (templates/demo-v1)
  - New isAuthBypass() helper unifies IGRP_PREVIEW_MODE=true and AUTH_PROVIDER=none; /login, /logout, /api/auth/\* are all 302'd to / when bypassed.
  - Full App Router error boundary coverage: global-error.tsx, root error.tsx, (auth)/error.tsx, rewritten (igrp)/error.tsx to use IGRPSegmentError.
  - New reportError() hook and error-messages.ts Portuguese copy keyed by IgrpError.code.
  - serverSession() no longer swallows typed errors; logout page hardened with .catch + fallback redirect + 3 s safety timeout.

  See templates/demo-v1/.igrpmigrations/05.MIGRATIONS-23042026.md and 06.MIGRATIONS-23042026.md for the full migration guides.

## 0.1.0-beta.102

- Initial changelog. Future releases will be documented via [Changesets](https://github.com/changesets/changesets).
