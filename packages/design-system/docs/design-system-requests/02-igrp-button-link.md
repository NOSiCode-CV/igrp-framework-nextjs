# §2. `IGRPButtonLink` — a button-shaped `next/link` with built-in pending state

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§2`.

**Local workaround.** `src/app/(myapp)/_components/button-link.tsx`
(`SimpleButtonLink`, plus the private `SimpleLinkLoadingIndicator`).

**Status — read this first.** The component is **currently unreferenced** in
SIGOVP, and the only importer of `button-link.tsx` is its own tooltip wrapper
(§3). It is filed as a *design request*, not as a migration that unblocks
screens. If you decline it, the correct follow-up in this app is to **delete**
`button-link.tsx` and `button-link-tooltip.tsx`, not to start using them.

What we do instead is worth knowing, because it is the real cost of the gap: all
43 of our row-navigation controls are `IGRPDataTableButtonLink` with an `action`
callback that calls `router.push()` — **not** an `href`. So none of our list rows
contains an actual anchor. Middle-click, ⌘/Ctrl-click, "open in new tab" and
"copy link address" do nothing on any row in the application, and there is no
navigation feedback between click and paint. We did not choose that; it is where
the available components led.

---

## §2.0 A defect we found while writing this

While checking what you already ship, we read
`horizon/data-table/action-button-icon.js`. With an `href`,
`IGRPDataTableButtonLink` renders:

```jsx
<Button variant={variant} size="icon-sm" className={cn("size-8", className)}
        asChild disabled={disabled}>
  <Link href={href} aria-label={labelTrigger}>…</Link>
</Button>
```

`asChild` makes `Button` render *as* the `<Link>`, so `disabled` is spread onto
an `<a>`. That means a disabled `IGRPDataTableButtonLink` with an `href`:

- **still navigates** — `disabled` is not a valid attribute on an anchor and has
  no effect on activation;
- **is not even dimmed or click-blocked by the styling**, because
  `buttonVariants` guards with `disabled:pointer-events-none disabled:opacity-50`
  and the CSS `:disabled` pseudo-class matches only form controls, never `<a>`.

The `action` branch (no `href`) is fine — it renders a real `IGRPButton`.

This is a source reading, not a runtime reproduction: we do not hit it
ourselves, because every one of our 43 `IGRPDataTableButtonLink` call sites uses
the `action` branch and none passes `href`. Worth confirming on your side, and
worth fixing independently of everything else in this document — it is a
disabled control that silently still works.

It is also the exact trap §2.1.2 describes, which is why our local component
branches to a real `<button>` instead.

---

## §2.1 Why it exists

`IGRPDataTableButtonLink` (`horizon/data-table/action-button-icon.d.ts`) covers
the icon-button-in-a-row case and takes
`{ labelTrigger, action, icon, variant, href, className, disabled, tooltip* }`.
You also ship `IGRPLink` (`horizon/typography/link`) — a Next.js link with icon,
size, underline and colour-role variants. Neither is a button-shaped navigation
control: `IGRPLink` has no button chrome, no disabled handling and no pending
state; `IGRPDataTableButtonLink` is fixed at `size="icon-sm" className="size-8"`
and is scoped to table row actions. Two gaps against a general-purpose
navigation button:

1. **No navigation pending state.** Next.js 15 exposes
   [`useLinkStatus()`](https://nextjs.org/docs/app/api-reference/functions/use-link-status),
   which reports `pending` while a `<Link>`'s target route is being fetched.
   `SimpleButtonLink` swaps the button's icon for a spinning `LoaderCircle` for
   exactly that window. Without it, a click on a link to a server-rendered
   route looks like nothing happened until the new page paints — which on the
   SIGOVP detail routes is several hundred ms.
2. **`disabled` on an `<a>` is not a thing.** `disabled` is not valid on an
   anchor and does not stop navigation. The local component branches: when
   `disable` is set it renders a real `<button type="button" disabled>` with the
   same content instead of a `<Link>`. A DS component should encode that branch
   rather than leaving each app to discover it.

`useLinkStatus()` must be called from a component **rendered inside** the
`<Link>` subtree — that is the only reason `SimpleLinkLoadingIndicator` is a
separate component, and it is the part most worth having in the DS, because it
is easy to get wrong (called outside a `Link`, it just always returns
`pending: false` and the feature silently does nothing).

---

## §2.2 Current props

```ts
export interface SimpleButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;                              // cast to next `Route` internally
  label?: string;
  icon: IGRPIconProps["iconName"];           // required, but "" is tolerated
  iconClassName?: string;
  customIcon?: React.ReactNode;              // declared, currently unused
  variant?: ButtonProps["variant"];          // default "default"
  btnClassName?: string;
  size?: ButtonProps["size"];
  disable?: boolean;                         // default false
}
```

Known rough edges to fix while lifting, not to reproduce:

- `customIcon` is declared and never read — drop it or wire it.
- `icon` is typed required but the runtime treats `""` / `null` / `undefined`
  as "no icon". Make it optional and keep the runtime guard.
- `disable` should be `disabled`, matching every other DS control.
- `btnClassName` vs `className`: since the root *is* the button, `className`
  should style the button and a separate `linkClassName` (if needed) the anchor.

---

## §2.3 Behaviour to reproduce

1. Renders `<Button asChild>` wrapping `<Link href>`, so the anchor keeps the
   button's variant/size classes and stays a real link (middle-click, "open in
   new tab", copy address all work).
2. While `useLinkStatus().pending` is true, the leading icon is replaced by
   `LoaderCircle` with `animate-spin`; the label does not move.
3. With no icon and a pending navigation, the spinner still appears (the
   indicator renders it even when `iconName` is empty).
4. `disabled` renders a `<button type="button" disabled>` — never a link with a
   click-blocking handler.
5. `strokeWidth={2}` on the icon, matching the rest of the Horizon buttons.

---

## §2.4 Proposed API

```ts
export interface IGRPButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href">,
    Pick<IGRPButtonProps, "variant" | "size" | "iconName" | "iconClassName" | "iconPlacement"> {
  href: string;
  label?: string;
  disabled?: boolean;
  /** Spinner while the target route loads. Default true; set false for
   *  same-page anchors and external hrefs where `useLinkStatus` never fires. */
  showPendingIndicator?: boolean;
  className?: string;
}
```

Reuse `IGRPButton`'s icon props verbatim (`iconName`, `iconPlacement`,
`iconClassName`) rather than inventing `icon`/`btnClassName`, so the two
components read the same at a call site.

Worth exporting alongside it: the indicator itself, e.g.
`IGRPLinkPendingIcon` — apps that build their own link-shaped controls need the
"must be inside `<Link>`" packaging just as much as the button does.

---

## §2.5 Acceptance criteria

- [ ] `<IGRPButtonLink href="/x" label="Abrir" iconName="Eye" />` renders an
      `<a>` carrying the button classes; `href` is present in the DOM.
- [ ] Navigating to a slow route shows the spinner from click until the new
      route commits, then restores the original icon.
- [ ] `disabled` renders a `<button disabled>`, no `<a>` in the tree, and a
      click does not navigate.
- [ ] With `showPendingIndicator={false}` the icon never changes.
- [ ] Rendering the component outside a Next.js app router (no `Link` context)
      does not throw.

---

## §2.6 Reference implementation

Verbatim, as it ships today. `Button`, `cn`, `IGRPIcon` and `IGRPIconProps` are
your exports; `useLinkStatus` is `next/link` (Next 15).

### `src/app/(myapp)/_components/button-link.tsx`

```tsx
"use client";

import {
  Button,
  cn,
  IGRPIcon,
  type IGRPIconProps,
} from "@igrp/igrp-framework-react-design-system";
import type { Route } from "next";
import Link, { useLinkStatus } from "next/link";

type IGRPBtnProps = React.ComponentProps<typeof Button>;

export interface SimpleButtonLinkProps
  extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
  label?: string;
  icon: IGRPIconProps["iconName"];
  iconClassName?: string;
  customIcon?: React.ReactNode;
  variant?: IGRPBtnProps["variant"];
  btnClassName?: string;
  size?: IGRPBtnProps["size"];
  disable?: boolean;
}

export function SimpleButtonLink({
  label,
  icon,
  iconClassName,
  variant = "default",
  btnClassName,
  size,
  href,
  disable = false,
  ...linkProps
}: SimpleButtonLinkProps) {
  const content = (
    <>
      <SimpleLinkLoadingIndicator
        iconName={icon}
        iconClassName={iconClassName}
      />
      {label}
    </>
  );

  // `disabled` on <a> is not valid HTML and does not stop navigation; use a real button.
  if (disable) {
    return (
      <Button
        type="button"
        variant={variant}
        className={btnClassName}
        size={size}
        disabled
      >
        {content}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className={btnClassName} size={size}>
      <Link href={href as Route} {...linkProps}>
        {content}
      </Link>
    </Button>
  );
}

interface SimpleLinkLoadingIndicatorProps {
  iconName: IGRPIconProps["iconName"];
  iconClassName?: string;
  showLoader?: boolean;
}

function SimpleLinkLoadingIndicator({
  iconName,
  iconClassName,
  showLoader = true,
}: SimpleLinkLoadingIndicatorProps) {
  const { pending } = useLinkStatus();
  const isLoading = showLoader && pending;

  const valid = iconName !== null && iconName !== undefined && iconName !== "";

  return (
    <>
      {valid ? (
        <IGRPIcon
          iconName={isLoading ? "LoaderCircle" : iconName}
          strokeWidth={2}
          className={cn(iconClassName, isLoading && "animate-spin")}
        />
      ) : (
        isLoading && (
          <IGRPIcon
            iconName="LoaderCircle"
            strokeWidth={2}
            className={cn(iconClassName, "animate-spin")}
          />
        )
      )}
    </>
  );
}
```
