---
"@igrp/igrp-framework-react-design-system": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next": patch
---

Second review pass: fix packaging, input plumbing and three broken component behaviours.

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

In form mode it rendered through `IGRPFormField`, which is a *layout* wrapper: an
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
nothing at all. For `dd-MM-yyyy` the padded form *is* the format, so nothing is loosened.

`maskDateInput` no longer zero-pads a four-digit year when a separator closes it early.
Padding `26` to `0026` turned a half-typed year into a well-formed date in the year 26 — with
`yyyy-MM-dd`, entering `26-08-2026` was silently accepted as `0026-08-20`.

Typing is unchanged: the mask still rewrites keystrokes into `dateFormat`, so `1-8-2026` in a
`dd-MM-yyyy` field still becomes `01-08-2026` and commits. What now gets rejected is text the
mask cannot bring into shape — a pasted `2026-08-26` in a day-first field, a short year, a
named month in the wrong case.
