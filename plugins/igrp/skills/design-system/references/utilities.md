# Utilities, hooks, i18n and types

Everything here comes from the package root, except `cn` in server code.

## `cn(...)` — class merging

```ts
// client file
import { cn } from "@igrp/igrp-framework-react-design-system"
// server component, layout.tsx, or src/lib code a server file reaches
import { cn } from "@igrp/igrp-framework-react-design-system/cn"
```

It re-exports the `cn` npm package, which does clsx + tailwind-merge in one call. Import it from the DS every time, not from `clsx`, `classnames` or `cn` directly, so the merge stays consistent with the DS's variants. `/cn` is guaranteed never to evaluate the rest of the package. On DS ≤ 0.1.0-beta.146, the error "Attempted to call cn() from the server but cn is on the client" means you should switch to `/cn`.

## `IGRPColors` — token class strings by role

The shape is `IGRPColors[role][variant][slot]` and every leaf is a class string built from semantic tokens.

- **role** (`IGRPColorRole`): `"solid" | "outline" | "soft"`
- **variant** (`IGRPColorVariants`): `"primary" | "secondary" | "success" | "destructive" | "warning" | "info" | "indigo"`
- **slot**: `bg`, `bgStatic`, `text`, `border`, `bgForeground`, `badge`, `textCard`, `bgCardIcon`, `borderCard`, `alert`

```ts
IGRPColors.solid.success.bg        // "bg-success hover:bg-success/90"
IGRPColors.soft.warning.badge
IGRPColors.outline.destructive.alert
```

Most Horizon components take `variant` + `color` props and read this map themselves, so you rarely index it by hand. Reach for it when a custom surface has to match a badge or alert. `IGRPColorObjectRole` and `IGRPColorObjectVariants` are the same two lists as runtime arrays (handy for building option lists). `igrpColorText(variant)` returns `IGRPColors.solid[variant].text`: the **on-fill foreground** (`"text-success-foreground"`), not a plain text colour.

`igrpAlertIconMappings: Record<IGRPColorVariants, IGRPIconName>` gives the default icon per variant (success → `CircleCheck`, destructive → `CircleAlert`, warning → `TriangleAlert`, info/primary → `Info`, secondary → `Star`, indigo → `Sparkles`).

## Semantic tokens (from `/tokens`)

Use them as Tailwind utilities (`bg-success`, `text-warning-foreground`, `border-input`):

`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `indigo`, `highlight` (each with a `-foreground` pair), `border`, `input`, `ring`, `ring-invalid`, `chart-1` … `chart-8`, `sidebar*`, `process-completed`, `process-active`. Radius: `rounded-sm` … `rounded-4xl` off `--radius`.

Custom variants: `data-checked:`, `data-unchecked:`, `data-active:`, `data-vertical:` and `data-horizontal:`. They map Radix `data-state` / `data-orientation`, so style selected/open/oriented states with these instead of a JS flag.

When a role you need has no token, ask for one in the DS (`tokens.css`). Don't fall back to the palette.

## Helpers

| Export | Behaviour |
| --- | --- |
| `parseLocalDate(str)` | `"yyyy-mm-dd"` → local-time `Date`, which avoids `new Date("2026-01-15")` being parsed as UTC midnight. **Throws** on a non-numeric part. |
| `igrpGetInitials(name)` | First + last initial, uppercase (`"Ana Maria Lopes"` → `"AL"`). One word → one letter; empty → `"N/A"`. |
| `igrpToPascalCase(str)` | Splits on non-alphanumerics and PascalCases. |
| `igrpIsExternalUrl(url?)` | Compares against `window.location.origin`. Always `false` on the server. |
| `igrpNormalizeUrl(url)` | Leaves http(s) URLs and `/paths` unchanged and prefixes `/` otherwise. Does **not** add a protocol. `""` for empty input. |
| `detectFormat(value)` / `colorToOklch(value, format)` | `ColorFormat = "hex" \| "rgb" \| "hsl" \| "oklch"`. For theming tools; apps rarely need them. |
| `convertValuesToFormData(values)` | Top-level values → `FormData`: files stay binary (one entry per file), nested objects become JSON and dates become ISO instants. See `forms.md`. |
| `igrpCreateListItem`, `igrpListItems` | Build items for `IGRPTextList`. |
| Calendar: `formatDateToString`, `formatDateRange`, `parseStringToDate`, `parseStringToRange`, `isValidDate`, `getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek })` | Used by the date pickers. Reuse them to format or parse the same way. |
| Date masking: `maskDateInput`, `parseDateInput`, `getDateFormatParts`, `getDateFormatMaxLength` | Typed-date input masks. |
| Charts: `formatChartValue`, `IGRP_CHART_COLORS`, … | See `charts.md`. |
| Data-table filter fns: `IGRPDataTableTextFilterFn`, `IGRPDataTableFacetedFilterFn`, `IGRPDataTableDateRangeFilterFn` | See `data-table.md`. |
| `IGRPIconObject` (`string[]` of names), type `IGRPIconName`, `IGRPIconList` | Lucide icon registry. Most `iconName` props are typed `IGRPIconName \| string`, so **a typo still compiles**: an unknown name renders a red `AlertCircle` marked `data-igrp-unknown-icon`. Use the PascalCase lucide name. Don't import `IGRPIconList` in app code, because it pulls every icon into the bundle. |
| CVA functions: `igrpBadgeVariants`, `igrpHeadlineVariants`, `igrpTextVariants`, `IGRPLinkVariants`, `igrpTextlistVariants`, `igrpTextlistItemVariants`, `igrpModalDialogContentVariants`, `igrpStatsCard*Variants` | Give a non-component element the same look. |

## Hooks

| Hook | Behaviour |
| --- | --- |
| `useIsMobile()` | `true` under 768px. Returns `false` on the server **and on the first client render**, then updates after mount, so don't use it to pick markup that has to match SSR. Prefer responsive classes. |
| `useIGRPMetaColor()` | `{ metaColor, setMetaColor(color) }`, driven by next-themes `resolvedTheme` (needs the theme provider). |
| `IGRP_META_THEME_COLORS` | `{ light: "#ffffff", dark: "#09090b" }`. A server-safe value for `viewport.themeColor`. |
| `useIGRPFormContext()` | `{ form, isSubmitting, formError?, disabled? }`. **Throws** outside `IGRPForm`. Use it to build a form-aware widget. `IGRPFormContext` and the `IGRPFormContextValue` type are also exported. |
| `useIGRPToast()` | Toast API for `IGRPToaster`. See `horizon.md`. |
| `useIGRPSidebar()`, `useSidebar()`, `useIGRPMenuNavigation()`, `useCarousel()`, `useFormField()` | Context accessors for their components. |

## i18n

`IGRPI18nProvider({ strings?, base?, locale = "pt-PT", children })` supplies every built-in string and the formatting locale. The framework mounts it when its i18n is configured.

- **`strings`:** either a full catalog (`IGRP_I18N_DEFAULTS_PT` (default), `_EN`, `_FR`) or a deep-partial override (`{ dataTable: { notFound: "No records." } }`) merged over `base`.
- **`locale`:** a BCP-47 tag, always region-qualified (`pt-CV`, not `pt`). It drives `Intl`, the calendar's date-fns locale and chart tooltips.
- **Per-component label props win over the provider.** Pick a catalog or override keys instead of translating in code.
- **Hooks and helpers:** `useIGRPi18n()` returns the strings and `useIGRPLocale()` returns the tag. `igrpFormatMessage(template, values)` fills `{token}` placeholders; there are no plurals. Also exported: `igrpMergeI18nStrings`, `igrpDateFnsLocale(tag)` and `IGRP_DEFAULT_LOCALE`. Types: `IGRPI18nStrings`, `IGRPI18nStringsOverride`.
- **Deprecated:** `IGRP_I18N_DEFAULTS_PT_PT` is an alias of `_PT`.

When you format numbers or dates yourself, pass `useIGRPLocale()` to `Intl`. Never pass `undefined`, because the server and browser defaults differ and hydration mismatches.

## Types worth knowing

- Shared: `IGRPBaseAttributes`, `IGRPInputProps`, `IGRPOptionsProps` (options for every choice field), `IGRPPlacementProps`, `IGRPSize`, `IGRPRoundSize`, `IGRPCalendarProps`, `IGRPCalendarTimeProps`, `IGRPDatePickerBaseProps`.
- Colours: `IGRPColorRole`, `IGRPColorVariants`, `IGRPColorType`, `ColorFormat`.
- Re-exported so you don't import the libraries directly: from TanStack, `ColumnDef`, `Row`, `Column`, `SortingState`, `ColumnFiltersState`, `PaginationState`, `RowSelectionState`, `VisibilityState`, `ExpandedState`, `FilterFn`, `OnChangeFn`; from react-day-picker, `DateRange`.
- `IGRPMenuType` is **not** a DS type. It lives in `@igrp/framework-next-types`.
