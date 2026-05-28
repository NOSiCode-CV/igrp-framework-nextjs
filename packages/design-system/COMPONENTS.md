# IGRP Design System — Component Map

> Reference for the three-layer model. **Always prefer the Horizon layer.** Drop to Primitives only when Horizon is too opinionated for the use case. Use Custom for IGRP-specific compositions.

## Quick rules

- `IGRP*` from the public root (`@igrp/igrp-framework-react-design-system`) is **always client-side** — files importing it need `'use client'`.
- Forms are always `IGRPForm` + Zod. Never raw `<form>` or direct `react-hook-form`.
- Use semantic tokens (`bg-background`, `text-foreground`, …). Never raw Tailwind colors.
- `cn()` for class merging; `size-*` for equal w/h; `flex gap-*` for spacing.

## Layer map

| Need | Horizon (default) | Primitive (escape hatch) | Custom |
| --- | --- | --- | --- |
| Form root + Zod validation + submit handling | `IGRPForm` | `Form` (RHF context only) | — |
| Text input | `IGRPInputText`, `IGRPInputNumber`, `IGRPInputPassword`, `IGRPInputUrl`, `IGRPInputSearch` | `Input` | — |
| Textarea | `IGRPTextarea` | `Textarea` | — |
| Select | `IGRPSelect` | `Select` + `SelectGroup` + `SelectItem` | — |
| Combobox (typeahead) | `IGRPCombobox` | `Command` inside `Popover` | — |
| Checkbox | `IGRPCheckbox` | `Checkbox` | — |
| Switch | `IGRPSwitch` | `Switch` | — |
| Radio group | `IGRPRadioGroup` | `RadioGroup` + `RadioGroupItem` | — |
| Date / time / range | `IGRPCalendarSingle`, `IGRPCalendarRange`, `IGRPCalendarMultiple`, `IGRPDateTimeInput`, `IGRPInputTime` | `Calendar` | — |
| Phone | `IGRPInputPhone` | — | — |
| Color | `IGRPInputColor` | — | — |
| File upload | `IGRPInputFile` | — | — |
| Input with addons (icon, button, prefix) | `IGRPInputAddOn` | `InputGroup` + `InputGroupInput` + `InputGroupAddon` | — |
| Data table | `IGRPDataTable` | `Table` | — |
| Charts (area / bar / line / pie / radar / radial) | `IGRPAreaChart`, `IGRPHorizontalBarChart`, `IGRPVerticalBarChart`, `IGRPLineChart`, `IGRPPieChart`, `IGRPRadarChart`, `IGRPRadialBarChart` | `ChartContainer` + `ChartTooltip` + raw Recharts | — |
| Card | `IGRPCard`, `IGRPCardDetails`, `IGRPInfoCard`, `IGRPStatsCard` | `Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` + `CardFooter` | `IGRPStatsCardMini`, `IGRPStatsCardTopBorderColored` |
| Modal dialog | `IGRPModalDialog` | `Dialog` + `DialogTitle` (required) | — |
| Confirmation dialog | `IGRPAlertDialog` | `AlertDialog` | — |
| Side panel | — | `Sheet` + `SheetTitle` | — |
| Bottom sheet | — | `Drawer` + `DrawerTitle` | — |
| Tabs | `IGRPTabs` | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent` | — |
| Accordion | `IGRPAccordion` | `Accordion` + `AccordionItem` + `AccordionTrigger` + `AccordionContent` | — |
| Toast | `IGRPToaster` (`useIGRPToast`) | `Toaster` (`toast()` from `sonner`) | — |
| Alert / callout | `IGRPAlert`, `IGRPBanner` | `Alert` + `AlertTitle` + `AlertDescription` | `IGRPStatusBanner` |
| Empty state | — | `Empty` | — |
| Badge | `IGRPBadge` | `Badge` | — |
| Button | `IGRPButton` | `Button` (variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`; sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`) | — |
| Avatar | `IGRPAvatar` | `Avatar` + `AvatarImage` + `AvatarFallback` (fallback required) | `IGRPUserAvatar` |
| Menu navigation | `IGRPMenuNavigation` | `NavigationMenu` | — |
| Breadcrumb | — | `Breadcrumb` + `BreadcrumbList` + `BreadcrumbItem` + `BreadcrumbLink` + `BreadcrumbPage` + `BreadcrumbSeparator` | — |
| Pagination | — | `Pagination` | — |
| Sidebar | — | `Sidebar` + `SidebarHeader`/`SidebarContent`/`SidebarFooter`/`SidebarMenu` | — |
| Command palette | `IGRPCommand` | `Command` inside `Dialog` | — |
| Dropdown menu | `IGRPDropdownMenu` | `DropdownMenu` + `DropdownMenuGroup` + `DropdownMenuItem` | — |
| Tooltip | — | `Tooltip` + `TooltipTrigger` + `TooltipContent` | — |
| Hover card | — | `HoverCard` + `HoverCardTrigger` + `HoverCardContent` | — |
| Context menu | — | `ContextMenu` | — |
| Carousel | — | `Carousel` + `CarouselContent` + `CarouselItem` + `CarouselPrevious` + `CarouselNext` | — |
| Scroll area | — | `ScrollArea` | — |
| Resizable panels | — | `ResizablePanelGroup` + `ResizablePanel` + `ResizableHandle` | — |
| Separator | `IGRPSeparator` | `Separator` | — |
| Skeleton | — | `Skeleton` | — |
| Spinner | `IGRPLoadingSpinner` | `Spinner` | — |
| Progress | — | `Progress` | — |
| Stepper | — | `Stepper` | — |
| Image | `IGRPImage`, `IGRPImageCropper` | `Cropper` | — |
| Chat | `IGRPChat` | — | — |
| Process / timeline | `IGRPStepperProcess` | — | — |
| PDF viewer | `IGRPPdfViewer` | — | — |
| Video embed | `IGRPVideoEmbed` | — | — |
| Copy-to-clipboard | `IGRPCopyTo` | — | — |
| Notifications | `IGRPNotification` | — | — |
| Icon | `IGRPIcon` | (use `lucide-react` directly with `data-icon="inline-start"` / `inline-end"` slot) | — |
| Page header / footer / container | `IGRPPageHeader`, `IGRPPageFooter`, `IGRPContainer` | — | — |
| Typography | `IGRPText`, `IGRPHeadline`, `IGRPLink`, `IGRPTextList` | — | — |

## IGRP-specific deltas from upstream shadcn

These primitives are intentionally divergent. **Audit them when refreshing from upstream.**

- **`Button`** — adds `xs`, `icon-xs`, `icon-sm`, `icon-lg` sizes beyond the shadcn baseline. Adds `has-data-[icon=inline-end]` / `has-data-[icon=inline-start]` padding tweaks per size.
- *(Add other deltas here as they accumulate. The header comment `// IGRP CUSTOM: THIS COMPONENT IS CHANGED FROM THE ORIGINAL` marks them in source.)*

## Experimental layer

Components under `src/components/experimental/` (currently: `progress/`, `sheet/`, `timeline/`) are **excluded from the SWC build** and not exported. They are work-in-progress and may break without a changeset. Promotion criteria: stable API, tests in `design-system-storybook`, no `experimental/` imports from other layers.

## Adding a new component — decision flow

1. Does the shadcn skill component table list it? → Add as a Primitive first (copy from upstream via the shadcn CLI's `--diff` flow against a scratch directory).
2. Will every IGRP app want the same labels / icons / loading / form wiring? → Add a Horizon wrapper on top.
3. Is it IGRP-domain-specific (stats card variant, user avatar, status banner)? → Add to `custom/`.
