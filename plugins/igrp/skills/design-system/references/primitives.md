# Primitives layer (unprefixed)

shadcn-style Radix + CVA wrappers, exported from the package root. They're the **escape hatch**: no label, no helper text, no form binding, no i18n defaults. You wire all of that yourself.

## When to drop down

Use a primitive only when all three hold:

1. No Horizon or Custom component covers the need. Check `COMPONENTS.md`'s layer map / `horizon.md` first. Common primitive-only needs: `Sheet`, `Drawer`, `Tooltip`, `HoverCard`, `Popover`, `ContextMenu`, `Breadcrumb`, `Pagination`, `Skeleton`, `Progress`, `Empty`, `Carousel`, `ScrollArea`, `Resizable*`, `Stepper`, `Kbd`, `Item`.
2. It's not a form field inside `IGRPForm`. A bare `Input` / `Select` / `Checkbox` there **won't bind and won't validate**. Use the `IGRP*` field, or `IGRPFormField` for a custom widget (see `forms.md`).
3. You're composing a one-off piece (chrome, a custom composite), not a pattern repeated across screens.

Never run `npx shadcn add` in an IGRP app. If something is missing, use the DS primitive or request it in the DS.

## Catalog

| Family | Exports |
| --- | --- |
| Buttons | `Button` + `buttonVariants` (variants `default \| destructive \| outline \| secondary \| ghost \| link`; sizes `xs \| sm \| default \| lg \| icon \| icon-xs \| icon-sm \| icon-lg`), `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`, `buttonGroupVariants`, `Toggle` + `toggleVariants`, `ToggleGroup`, `ToggleGroupItem` |
| Form atoms | `Input`, `Textarea`, `Checkbox`, `Switch`, `Slider`, `Label`, `RadioGroup`, `RadioGroupItem` (`variant`, `size`), `Select` + `SelectTrigger`/`SelectValue`/`SelectContent`/`SelectGroup`/`SelectLabel`/`SelectItem`/`SelectSeparator`/`SelectScrollUpButton`/`SelectScrollDownButton`, `NativeSelect` + `NativeSelectOption`/`NativeSelectOptGroup`, `InputOTP` + `InputOTPGroup`/`InputOTPSlot`/`InputOTPSeparator`, `InputGroup` + `InputGroupAddon`/`InputGroupButton`/`InputGroupText`/`InputGroupInput`/`InputGroupTextarea` |
| Field layout | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle` |
| RHF glue | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`. These are for building a form-aware widget, not for app forms (use `IGRPForm`). |
| Surfaces | `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`, `Separator`, `AspectRatio`, `ScrollArea` + `ScrollBar`, `ResizablePanelGroup`/`ResizablePanel`/`ResizableHandle`, `Skeleton`, `Spinner`, `Item` + `ItemMedia`/`ItemContent`/`ItemTitle`/`ItemDescription`/`ItemActions`/`ItemHeader`/`ItemFooter`/`ItemGroup`/`ItemSeparator`, `Empty` + `EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent` |
| Status | `Alert` + `AlertTitle`/`AlertDescription`/`AlertAction`, `Badge` + `badgeVariants`, `Progress`, `Kbd`, `KbdGroup` |
| Avatar | `Avatar`, `AvatarImage`, `AvatarFallback` (always render a fallback), `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` |
| Navigation | `Breadcrumb*`, `NavigationMenu*` + `navigationMenuTriggerStyle`, `Pagination*`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` + `tabsListVariants`, `Sidebar*` + `SidebarProvider` + `useSidebar`, `Accordion`/`AccordionItem`/`AccordionTrigger` (`iconName`, `showIcon`, `iconPlacement`)/`AccordionContent` |
| Overlays | `Dialog*`, `AlertDialog*` (incl. `AlertDialogMedia`, `AlertDialogAction`, `AlertDialogCancel`), `Sheet*`, `Drawer*`, `Popover` + `PopoverTrigger`/`PopoverContent` (`container` prop)/`PopoverAnchor`/`PopoverHeader`/`PopoverTitle`/`PopoverDescription`, `HoverCard*`, `Tooltip*`, `ContextMenu*`, `DropdownMenu*`, `Menubar*`, `Collapsible*`, `Command` + `CommandDialog`/`CommandInput`/`CommandList`/`CommandEmpty`/`CommandGroup`/`CommandItem`/`CommandShortcut`/`CommandSeparator` |
| Date | `Calendar`, `CalendarDayButton` |
| Media | `Carousel` + `CarouselContent`/`CarouselItem`/`CarouselPrevious`/`CarouselNext`, `useCarousel`, type `CarouselApi`; `Cropper` + `CropperImage`/`CropperCropArea`/`CropperDescription` |
| Table | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption` |
| Charts | `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`. The `ChartConfig` type isn't exported. |
| Stepper | `Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator` |
| Toast | `Toaster` (sonner). The template root mounts the toaster. In feature code use `useIGRPToast` (no `toast` function is exported). |

## Rules at this layer

- **Accessible names are required:** `Dialog` needs `DialogTitle`, `Sheet` needs `SheetTitle`, `Drawer` needs `DrawerTitle` and `AlertDialog` needs `AlertDialogTitle`. Hide one visually if the design has no title, but render it.
- **Style other elements with the CVA function** rather than copying the class list: `<Link className={buttonVariants({ variant: "outline", size: "sm" })}>`.
- **Popovers inside a `Dialog` / `Drawer`** should pass `container` on `PopoverContent`, so focus management keeps working.
- **Icons inside a `Button`:** a lucide icon with `data-icon="inline-start"` / `"inline-end"` gets the right padding.
- **Tokens only** here as well. Any `dark:` you see inside DS primitives is the DS's own opacity tuning. It doesn't license `dark:` in app code.
