# Primitives layer (unprefixed)

Thin Radix UI + CVA wrappers. **Escape hatch only** — reach for these when a Horizon `IGRP*` component is too opinionated. The price you pay: no built-in label, no form-context binding, no icon scaffolding. You handle all of that yourself.

All exports are at the root of `@igrp/igrp-framework-react-design-system`. Every consuming file needs `'use client'`.

Each primitive carries a `// shadcn: YYYY-MM-DD` sync stamp in source; a quarterly `scripts/check-shadcn-drift.mjs` job flags drift.

## Catalog (grouped)

**Buttons & actions**
`Button` + `buttonVariants`, `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`, `buttonGroupVariants`, `Toggle` + `toggleVariants`, `ToggleGroup`, `ToggleGroupItem`

**Form atoms** (use ONLY outside `IGRPForm`, or inside one wrapped manually via primitive `<Form>`/`<FormField>`)
`Input`, `Textarea`, `Checkbox`, `Switch`, `Slider`, `Label`, `RadioGroup`, `RadioGroupItem` + `radioItemVariants`, `Select` (+ `SelectTrigger`/`SelectContent`/`SelectItem`/...), `InputOTP` + `InputOTPGroup`/`InputOTPSlot`/`InputOTPSeparator`, `Field`, `Form`, the form primitives (`FormControl`, `FormField`, `FormLabel`, `FormMessage`, `FormDescription`, `FormItem`)

**Surfaces & layout**
`Card` (+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`/`CardAction`), `Separator`, `AspectRatio`, `ScrollArea` + `ScrollBar`, `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle`, `Skeleton`, `Spinner`

**Status & inline**
`Alert` + `AlertTitle` + `AlertDescription`, `Badge` + `badgeVariants`, `Progress`, `Kbd`, `KbdGroup`

**Avatar**
`Avatar`, `AvatarImage`, `AvatarFallback`

**Navigation**
`Breadcrumb` (+ `BreadcrumbList`/`BreadcrumbItem`/`BreadcrumbLink`/`BreadcrumbPage`/`BreadcrumbSeparator`/`BreadcrumbEllipsis`), `NavigationMenu*`, `Pagination*`, `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`, `Sidebar*`

**Overlays**
`Dialog*` (+ Portal/Overlay/Header/Footer/Title/Description/Trigger/Close), `AlertDialog*` (matching surface), `Drawer*`, `Popover` + `PopoverTrigger`/`PopoverContent`/`PopoverAnchor`, `Sheet*`, `HoverCard` + `HoverCardTrigger`/`HoverCardContent`, `Tooltip` + `TooltipTrigger`/`TooltipContent`/`TooltipProvider`, `ContextMenu*`, `DropdownMenu*`, `Menubar*`, `Collapsible` + `CollapsibleTrigger`/`CollapsibleContent`

**Calendar**
`Calendar`, `CalendarDayButton`

**Media / interactive**
`Carousel` + `CarouselContent`/`CarouselItem`/`CarouselPrevious`/`CarouselNext`, `Cropper` + `CropperDescription`/`CropperImage`/`CropperCropArea`

**Table** (low-level — prefer `IGRPDataTable` or `IGRPTable`)
`Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`

**Charts** (used internally by `IGRP*Chart`; rarely needed directly)
`Chart*` (config, container, tooltip primitives)

**Stepper / wizards**
`Stepper`, `StepperItem`, `StepperTrigger`, ...

**Toast**
`Toaster` (sonner-based) — usually mounted by the template root, not by feature code.

## Decision: Horizon → Primitive

Drop down when ALL of the following apply:

1. You've checked `references/horizon.md` and there is no `IGRP*` component that matches.
2. You don't need form-context binding (or you're explicitly building a non-form interaction).
3. You're inside an isolated UI piece — not a screen that will be templated/repeated.

For everything else, prefer Horizon. Pre-existing Primitives usage in templates is a deliberate exception, usually for chrome (sidebars, command bars) or for one-off composition.

## Variants & CVA

Most primitives export a `<name>Variants` CVA function alongside the component:

```ts
import { Button, buttonVariants, Badge, badgeVariants } from "@igrp/igrp-framework-react-design-system"

// Used by the component, but you can also call it directly:
<a className={buttonVariants({ variant: "outline", size: "sm" })}>Read more</a>
```

This is the right way to style a non-button element with Button-equivalent appearance — *not* manually re-implementing the classes.

## Tokens, not raw colors

Even at the Primitive layer, only semantic tokens. The CVA `variants` definitions in the source all reference token classes (`bg-primary`, `border-input`, `text-destructive`, `bg-muted/30`). When extending, do the same.
