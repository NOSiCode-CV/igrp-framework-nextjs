# Horizon layer (`IGRP*`): catalog

The default layer. The form fields are in `forms.md`, the data table in `data-table.md` and the charts in `charts.md`. Everything else is here.

Shared vocab: `IGRPColorRole` = `"solid" | "outline" | "soft"` (prop `variant`) and `IGRPColorVariants` = `"primary" | "secondary" | "success" | "destructive" | "warning" | "info" | "indigo"` (prop `color`). Icons use lucide PascalCase names (`iconName="Pencil"`). **On most components an icon renders only when `showIcon` is set** (the defaults are listed per component).

## Actions

**`IGRPButton`**. Variants: `default | outline | secondary | ghost | destructive | link`. Sizes: `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`.
- `type` defaults to `"button"`, so pass `type="submit"` explicitly in forms.
- `loading` shows a spinner and swaps the children for `loadingText` (an i18n default). Inside `IGRPForm` you still set `loading` yourself, from the form handle or a transition, because the button isn't wired to the form.
- Text sizes need `showIcon` + `iconName` (+ `iconPlacement: "start" | "end"`). `iconName` alone renders nothing.
- Icon sizes always render the icon. **Give them an `aria-label`**; otherwise they fall back to the icon name and warn in dev.
- `asChild` (e.g. wrapping `IGRPLink` or next `Link`) skips both the icon and the spinner.
- `iconSize` is deprecated and does nothing.

**`IGRPLink`**: next/link, or `<a target="_blank">` for external URLs. Props: `href`, `variant`, `color`, `size: default | sm | lg`, `underline: none | hover | always`. **`showIcon` defaults to true** and shows an `ArrowRight`, so pass `showIcon={false}` for a plain link. `IGRPLinkVariants` is exported for CVA reuse.

**`IGRPCopyTo`**: a copy icon button with a tooltip and a toast. Props: `value` (required), `successMessage`, `errorMessage`, `tooltipMessage`, `onCopySuccess`, `onCopyError`, `toastDuration` and `tooltipDelayDuration`.

## Surfaces

**`IGRPCard`** is composable: `IGRPCard` > `IGRPCardHeader` (`IGRPCardTitle`, `IGRPCardDescription`, `IGRPCardAction`) + `IGRPCardContent` + `IGRPCardFooter`. These are separate named exports; there's no `IGRPCard.Header`. `size?: "default" | "sm"`.

**`IGRPCardDetails`**: a label/value list inside a card. Props: `items: { label; content: ReactNode; showCopyTo? }[]` (required), `title`, `description` and `contentClassName`. It renders nothing when `items` is empty. Keys come from the label's letters only, so make labels distinct.

**`IGRPInfoCard`**: grouped icon + label + text rows. Props:
- `sections: { items: IGRPInfoItem[] }[]` (required), where `IGRPInfoItem = { label; text: string; icon?; showIcon?; iconClassName?; colorItem? }`.
- `title`, `columns: 1 | 2 | 3`, `orientation: "horizontal" | "vertical"`, `variantSection` / `colorSection`.

**`IGRPStatsCard`**: the configurable KPI tile. It has **no trend/delta prop**.
- Content: `title`, `value`, `titleSize`, `valueSize` (up to `4xl`), `titleColored` / `valueColored`.
- Card: `cardVariant`, `cardBorder` (radius), `cardBorderPosition: none | top | bottom | left | right`.
- Icon: `showIcon` (default true), `iconName` (`Box`), `iconPlacement`, `iconSize: sm | md | lg | xl`, `showIconBackground`, `iconBackground: none | rounded | square`, `showIconBorder`, `iconVariant`.
- Also: `image` / `imageAlt` (next/image), `itemPlacement`, and `onClick`, which makes the card a keyboard-accessible button.
- For fixed presets see `IGRPStatsCardMini` / `IGRPStatsCardTopBorderColored` in `custom.md`.

**`IGRPBadge`**. Props: `variant` (default `"solid"`), `color` (default `"primary"`), `size: sm | md | lg` (default `sm`), `dot`, `showIcon` + `iconName` + `iconPlacement`, `badgeClassName`. Icon-only or number-only children render as a circle.

**`IGRPAlert`**: an inline message.
- `children` (required), `variant` (`"solid"`), `color` (`"primary"`).
- `showIcon` (default true; the icon follows `color`).
- `textColored` / `borderColored` / `bgColored` (all default true), `alignment`.
- An optional link: `showLink`, `linkUrl`, `linkIcon`, with **`label` as the link text** (`linkLabel` is unused).
- It gets `role="alert"` for destructive and `role="status"` otherwise.

**`IGRPBanner`**: `variant: "cookie" | "announcement"` and `message` are required.
- `cookie` is fixed to the bottom with accept/decline buttons (`acceptLabel`, `declineLabel`, `onAccept`, `onDecline`, `learnMoreHref` / `learnMoreLabel`).
- `announcement` is a primary bar with a dismiss button (`onDismiss`).
- Visibility is local state only, so persist the dismissal yourself.

**`IGRPNotification`**: a static inline notice, not a toast.
- `content`, `variant: default | error | info | success | warning`, `border: default | colored`.
- `showLink` + `lableLink` (the misspelling is the real prop name) + `actionLink`, `customActions`.
- `showClose` adds a button that hides the notice and calls `onClose`. The dismissal isn't persisted.

**`IGRPAvatar`**. Props: `src`, `alt`, `fallback` (gives 2-letter initials), `scale: sm | md | lg | xl` (`size` is deprecated), `rounded`, `hasStatus` + `status`, `showBadge` + `badgeNumber`, `hasFallbackIcon`. The type marks `status`, `badgeColor` and `iconColor` as required, so pass them even when unused.

**`IGRPSeparator`**, **`IGRPLoadingSpinner`** (`label` defaults to "A carregar…", `className`), **`IGRPContainer`** (just a `<div className="p-3">`, not a max-width container).

## Page structure

**`IGRPPageHeader`**. Props:
- `title` (required), `description`, `variant: h1 … h6`, and `children` (the right-side actions).
- `isSticky`.
- Back button: `showBackButton`, `urlBackButton`, `backButtonUseBrowserBack`, `backButtonOnClick`, plus `backButton*` styling and label props.
- It has no breadcrumbs (the framework chrome renders those). `IGRPPageHeaderBackButton` is also exported on its own.

**`IGRPPageFooter`**: `children`, `isSticky`.

**Typography**
- **`IGRPHeadline`**: `title` (required), `description`, `variant: h1 … h6` (the rendered tag, default `h3`), `showIcon` + `iconName`. It's always `text-primary`.
- **`IGRPText`**: `as: p | span | div`, `size`, `weight`, `align`, `truncate`, `maxLines`, `highlight: string[]`. **`spacing` defaults to `"tight"` (`mb-2`)**, so pass `spacing="none"` inside flex layouts. `variant` is deprecated and ignored, so use `className`.
- **`IGRPTextList`**: `type: unordered | ordered | checklist | steps | features | custom`, with items built via `igrpCreateListItem` / `igrpListItems`.

## Overlays

**`IGRPModalDialog`** family:
- Parts: `IGRPModalDialog`, `IGRPModalDialogTrigger`, `IGRPModalDialogContent`, `IGRPModalDialogHeader`, `IGRPModalDialogTitle` (required for a11y), `IGRPModalDialogDescription` (text as children), `IGRPModalDialogFooter`, `IGRPModalDialogClose`.
- `IGRPModalDialogContent` takes `size: sm | md | lg | xl | full` (default `md`), `showCloseButton` (true) and `contentClassName`.
- `stickyHeader` on the Header and `stickyFooter` on the Footer only work when those are **direct children** of Content.

```tsx
<IGRPModalDialog open={open} onOpenChange={setOpen}>
  <IGRPModalDialogContent size="lg">
    <IGRPModalDialogHeader stickyHeader>
      <IGRPModalDialogTitle>Editar utilizador</IGRPModalDialogTitle>
    </IGRPModalDialogHeader>
    {/* body */}
    <IGRPModalDialogFooter stickyFooter>
      <IGRPButton type="submit" form="user-form">Guardar</IGRPButton>
    </IGRPModalDialogFooter>
  </IGRPModalDialogContent>
</IGRPModalDialog>
```

**`IGRPAlertDialog`**: a **controlled** confirm dialog with no trigger of its own.
- `open`, `onOpenChange`, `title`, `description`, `variant: IGRPColorVariants`.
- `actionLabel` / `cancelLabel` (i18n defaults), `onAction`, `onCancel` (both close afterwards), `showCancel`.
- The icon follows `variant` unless you pass `iconName`.
- Don't put `onClick` or `className` in `actionProps`; they override the built-in handler and colour.

```tsx
<IGRPAlertDialog open={confirm} onOpenChange={setConfirm} variant="destructive" iconName="Trash2"
  title="Eliminar registo" description="Esta ação é irreversível." actionLabel="Eliminar" onAction={remove} />
```

For row deletes in a table, use the `alert` row action instead (`data-table.md`).

**Re-exports under IGRP names** (same API as the primitive, nothing added): `IGRPCommand*`, `IGRPDropdownMenu*`, `IGRPMenubar*`, `IGRPSidebar*` + `IGRPSidebarProvider` + `useIGRPSidebar`.

**Toasts**: `const { success, error, info, warning, loading, dismiss, igrpToast } = useIGRPToast()`. `igrpToast` takes either `{ type, title, description }` or `{ promise, loading, success, error }`. The promise labels default to the catalog, so pass them only for specific copy. The template already mounts `IGRPToaster`, so don't mount a second one.

## Navigation and process

**`IGRPTabs`**:
- `items: IGRPTabItem[]`, where `IGRPTabItem = { value; label; content; icon?; disabled?; keepMounted?; badgeContent?; badgeVariant?; badgeColor? }`.
- `variant: default | outline | pills | underline | cards`, `fullWidth`, `orientation`, and `value` / `defaultValue` / `onValueChange`.
- `showIcon` and `showBadge` default to false, so set them to show the item icons and badges.

**`IGRPAccordion`**:
- `items: { title; content; iconName?; showIcon? }[]`. It's always single + collapsible, and the first item opens by default.
- Controlled `value` uses `item-<title letters lowercased>` (e.g. `"item-dadospessoais"`).
- Titles that differ only in digits or accents collide ("Passo 1" vs "Passo 2"), so make titles distinct by their letters.

**`IGRPMenuNavigation`**: an **in-page section nav** that scrolls to sections; it is not the app menu.
- `sections: { id; label; icon; disabled? }[]`, `activeSection`, `onSectionChange`, `title`, `isStickyTop`.
- Wrap the nav and the sections in `IGRPMenuNavigationProvider`, and register each section with `ref={getSectionRef(id)}` from `useIGRPMenuNavigation()`. Outside the provider it silently does nothing.

**`IGRPStepperProcess`**: a wizard/timeline.
- `steps: { step; stepKey; title; description?; isCompleted; isActive }[]`, `currentStep` (required).
- `children: (step) => ReactNode` (a render prop, so the file must be a client file).
- `onStepChange(step, data)`, `isLoading`.

## Data and media

- **`IGRPTable<T>`**: a lightweight static table without TanStack. Props: `content: T[]`, `columns: { header; accessorKey: keyof T; render? }[]`, `actions?: (row) => ReactNode`, `isStriped`, `isHeaderSticky`, `showFooter` + `footerContent`. Use `IGRPDataTable` once you need sorting, filtering or paging.
- **`IGRPRepetitiveComponent<T>`**: `items`, `keyExtractor` (required), `children: (item) => ReactNode`.
- **`IGRPImage`**: next/image + `ratio: "1/1" | "4/3" | "16/9" | "21/9"` (applies when no width/height is given) + `rounded`.
- **`IGRPImageCropper`**: `src`, `variant: basic | circular | zoom | preview`, `onCrop(blob)` (JPEG), `cropLabel`. Cross-origin images need CORS.
- **`IGRPPdfViewer`**: one `document: { id; title; description; author; date?; fileUrl }`, `displayMode: "modal" | "inline"`, `viewerPreference: "native" | "google" | "auto"` (default native; **`google`/`auto` send `fileUrl` to Google**, so avoid them for private documents), `inlineHeight`, `labelButtonCancel` / `labelButtonNewTab`.
- **`IGRPVideoEmbed`**: `src` (an **embed** URL, not a watch URL) + `title` (both required), `aspectRatio`, `autoplay`, `muted`, `controls`, `loop`, `start`.
- **`IGRPChat`**: `apiEndpoint` (required) and `labelDescription`. It POSTs `{ messages }` and expects `{ messages: IGRPChatMessage[] }` back, and manages its own state.
- **`IGRPIcon`**: `iconName` + lucide props (`size` defaults to 16). Icons lazy-load, and an unknown name renders a red alert icon.

`IGRPLink`, `IGRPImage`, `IGRPStatsCard` (image), `IGRPPageHeader` and `IGRPChat` import `next/*`, so they only work in Next.js apps.

## Default copy

Built-in labels come from the `IGRPI18nProvider` catalog (pt by default). Components that show *content* have no default: `IGRPNotification` (`content`) and `IGRPStatusBanner` (`text`, plus `badgeText`, which renders the badge only when set).
