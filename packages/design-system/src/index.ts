/*
 * IMPORTANT: this barrel must NOT carry "use client".
 *
 * A "use client" barrel is ONE client module: every server component that
 * imports anything from it registers the whole barrel as its client reference,
 * so every page shipped every component (phone input, flags, charts, tables,
 * date pickers…) — ~340 KB gzipped even on /login. It also silently broke
 * server reads of plain values (`IGRP_META_THEME_COLORS.light` was a client
 * reference stub, so `undefined`).
 *
 * The directive lives on each leaf that needs it instead (hooks, context,
 * event handlers, browser APIs, or a third-party import that lacks its own
 * directive). A leaf WITHOUT the directive is evaluated on the server when the
 * barrel is imported there, so it must be server-safe: no module-scope
 * `createContext`, no hooks, no handlers. `src/__tests__/client-boundaries.test.ts`
 * enforces both halves.
 */
/* IMPORTANT: keep exports explicit (no wildcards) and do _not_ alias them — optimizePackageImports maps each name to its leaf module by name */

/* custom components */

export { IGRPStatsCardMini, type IGRPStatsCardMiniProps } from "./components/custom/stats-card-mini.js"
export {
  IGRPStatsCardTopBorderColored,
  type IGRPStatsCardTopBorderColoredProps,
} from "./components/custom/stats-card-top-border-colored.js"
export { IGRPStatusBanner, type IGRPStatusBannerProps } from "./components/custom/status-banner.js"
export { IGRPUserAvatar, type IGRPUserAvatarProps } from "./components/custom/user-avatar.js"

/* primitives components */

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  type AccordionTriggerProps,
  type AccordionTriggerArgs,
} from "./components/primitives/accordion.js"

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/primitives/alert-dialog.js"

export { Alert, AlertTitle, AlertDescription, AlertAction } from "./components/primitives/alert.js"

export { AspectRatio } from "./components/primitives/aspect-ratio.js"

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "./components/primitives/avatar.js"

export { Badge, badgeVariants } from "./components/primitives/badge.js"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./components/primitives/breadcrumb.js"

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
} from "./components/primitives/button-group.js"

export { Button, buttonVariants } from "./components/primitives/button.js"

export { Calendar, CalendarDayButton } from "./components/primitives/calendar.js"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./components/primitives/card.js"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
} from "./components/primitives/carousel.js"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "./components/primitives/chart.js"

export { Checkbox } from "./components/primitives/checkbox.js"

export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./components/primitives/collapsible.js"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./components/primitives/command.js"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "./components/primitives/context-menu.js"

export { Cropper, CropperDescription, CropperImage, CropperCropArea } from "./components/primitives/cropper.js"

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/primitives/dialog.js"

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./components/primitives/drawer.js"

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./components/primitives/dropdown-menu.js"

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "./components/primitives/empty.js"

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from "./components/primitives/field.js"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./components/primitives/form.js"

export { HoverCard, HoverCardTrigger, HoverCardContent } from "./components/primitives/hover-card.js"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from "./components/primitives/input-group.js"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "./components/primitives/input-otp.js"

export { Input } from "./components/primitives/input.js"

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
} from "./components/primitives/item.js"

export { Kbd, KbdGroup } from "./components/primitives/kbd.js"

export { Label } from "./components/primitives/label.js"

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "./components/primitives/menubar.js"

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./components/primitives/native-select.js"

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./components/primitives/navigation-menu.js"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/primitives/pagination.js"

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./components/primitives/popover.js"

export { Progress } from "./components/primitives/progress.js"

export { RadioGroup, RadioGroupItem } from "./components/primitives/radio-group.js"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./components/primitives/resizable.js"

export { ScrollArea, ScrollBar } from "./components/primitives/scroll-area.js"

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/primitives/select.js"

export { Separator } from "./components/primitives/separator.js"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/primitives/sheet.js"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./components/primitives/sidebar.js"

export { Skeleton } from "./components/primitives/skeleton.js"

export { Slider } from "./components/primitives/slider.js"

export { Spinner } from "./components/primitives/spinner.js"

export {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "./components/primitives/stepper.js"

export { Switch } from "./components/primitives/switch.js"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./components/primitives/table.js"

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./components/primitives/tabs.js"

export { Textarea } from "./components/primitives/textarea.js"

export { Toaster } from "./components/primitives/sonner.js"

export { ToggleGroup, ToggleGroupItem } from "./components/primitives/toggle-group.js"

export { Toggle, toggleVariants } from "./components/primitives/toggle.js"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/primitives/tooltip.js"

// horizon components

export { IGRPAlert, type IGRPAlertProps } from "./components/horizon/alert.js"

export { IGRPAccordion, type IGRPAccordionProps, type IGRPAccordionItem } from "./components/horizon/accordion.js"

export { IGRPAlertDialog, type IGRPAlertDialogProps } from "./components/horizon/alert-dialog.js"

export { IGRPAvatar, type IGRPAvatarProps } from "./components/horizon/avatar.js"

export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants } from "./components/horizon/badge.js"

export { IGRPBanner, type IGRPBannerProps } from "./components/horizon/banner.js"

export { IGRPButton, type IGRPButtonProps } from "./components/horizon/button.js"

export { IGRPCalendarSingle, type IGRPCalendarSingleProps } from "./components/horizon/calendar/single.js"

export { IGRPCalendarSingleTime, type IGRPCalendarSingleTimeProps } from "./components/horizon/calendar/single-time.js"

export { IGRPCalendarRange, type IGRPCalendarRangeProps } from "./components/horizon/calendar/range.js"

export { IGRPCalendarRangeTime, type IGRPCalendarRangeTimeProps } from "./components/horizon/calendar/range-time.js"

export { IGRPCalendarMultiple, type IGRPCalendarMultipleProps } from "./components/horizon/calendar/multiple.js"

export {
  IGRPCalendarMultipleTime,
  type IGRPCalendarMultipleTimeProps,
} from "./components/horizon/calendar/multiple-time.js"

export {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
} from "./components/horizon/card.js"

export {
  IGRPCardDetails,
  type IGRPCardDetailsProps,
  type IGRPCardDetailsItemProps,
} from "./components/horizon/card-details.js"

export { IGRPAreaChart, type IGRPAreaChartProps } from "./components/horizon/charts/area.js"

export {
  IGRPHorizontalBarChart,
  type IGRPHorizontalBarChartProps,
} from "./components/horizon/charts/bars/horizontal.js"

export { IGRPVerticalBarChart, type IGRPVerticalBarChartProps } from "./components/horizon/charts/bars/vertical.js"

export { IGRPLineChart, type LineConfig, type IGRPLineChartProps } from "./components/horizon/charts/line.js"

export { IGRPPieChart, type IGRPPieChartProps } from "./components/horizon/charts/pie.js"

export { IGRPRadarChart, type IGRPRadarChartProps } from "./components/horizon/charts/radar.js"

export { IGRPRadialBarChart, type IGRPRadialBarChartProps } from "./components/horizon/charts/radial/index.js"

export type {
  IGRPChartDataItem,
  IGRPChartSize,
  IGRPChartLegendPosition,
  IGRPTooltipIndicator,
  IGRPSeriesConfig,
  IGRPAreaConfig,
  IGRPBarConfig,
  IGRPChartFooter,
  IGRPChartProps,
  PieConfig,
  IGRPRadarConfig,
  RadialBarConfig,
} from "./components/horizon/charts/types.js"

export {
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendLayout,
  getLegendVerticalAlign,
  getLegendHorizontalAlign,
  hasNegativeValues,
  createChartConfig,
  IGRP_CHART_COLORS,
} from "./components/horizon/charts/lib.js"

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage } from "./components/horizon/chat.js"

export {
  IGRPCommand,
  IGRPCommandDialog,
  IGRPCommandInput,
  IGRPCommandList,
  IGRPCommandEmpty,
  IGRPCommandGroup,
  IGRPCommandItem,
  IGRPCommandShortcut,
  IGRPCommandSeparator,
} from "./components/horizon/command.js"

export { IGRPContainer } from "./components/horizon/container.js"

export { IGRPCopyTo, type IGRPCopyToProps } from "./components/horizon/copy-to.js"

export { IGRPDataTable, type IGRPDataTableProps } from "./components/horizon/data-table/index.js"
export {
  IGRPDataTableButtonAlert,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
} from "./components/horizon/data-table/action-button-icon.js"
export {
  type IGRPDataTableDropdownProps,
  type IGRPDataTableActionDropdown,
  type IGRPDataTableDropdownMenuDialogProps,
  type IGRPDataTableDropdownMenuLinkProps,
  type IGRPDataTableDropdownMenuProps,
  type IGRPDataTableDropdownMenuCustomProps,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenu,
} from "./components/horizon/data-table/action-dropdown-menu.js"
export {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellSwitch,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableCellLink,
  IGRPDataTableCellTooltip,
  type IGRPDataTableCellExpanderProps,
  type IGRPDataTableCellSwitchProps,
  type IGRPDataTableCellAmountProps,
  type IGRPDataTableCellBadgeProps,
  type IGRPDataTableCellDateProps,
  type IGRPDataTableCellTooltipProps,
} from "./components/horizon/data-table/cell.js"
export {
  IGRPDataTableClientFilter,
  type IGRPDataTableClientFilterListProps,
  type IGRPDataTableFilterClientProps,
} from "./components/horizon/data-table/client-filter.js"
export {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
} from "./components/horizon/data-table/filter.js"
export {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderDefault,
} from "./components/horizon/data-table/header.js"
export {
  IGRPDataTablePagination,
  IGRPDataTablePaginationNumeric,
  type IGRPDataTablePaginationProps,
} from "./components/horizon/data-table/pagination.js"
export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
} from "./components/horizon/data-table/row-actions.js"
export {
  IGRPDataTableToggleVisibility,
  type IGRPDataTableVisibilityProps,
} from "./components/horizon/data-table/toggle-visibility.js"
export {
  IGRPDataTableTooltipContext,
  IGRPDataTableTooltipProvider,
} from "./components/horizon/data-table/tooltip-provider.js"
export {
  IGRPDataTableDateRangeFilterFn,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableTextFilterFn,
} from "./components/horizon/data-table/lib/filters-utils.js"
export { createIGRPColumnHelper } from "./components/horizon/data-table/column-helper.js"
export type {
  IGRPColumnHelper,
  IGRPAccessorColumnDef,
  IGRPCellType,
  IGRPCellConfig,
} from "./components/horizon/data-table/column-helper.js"
export type {
  IGRPDataTableAction,
  IGRPDataTableActionLink,
  IGRPDataTableActionAlert,
  IGRPDataTableActionModal,
  IGRPDataTableActionCustom,
  IGRPDataTableFilterDescriptor,
  IGRPDataTableFilterType,
  IGRPDataTablePaginationConfig,
  IGRPDataTableQuery,
} from "./components/horizon/data-table/types.js"

export {
  IGRPDropdownMenu,
  IGRPDropdownMenuPortal,
  IGRPDropdownMenuTrigger,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuGroup,
  IGRPDropdownMenuLabel,
  IGRPDropdownMenuItem,
  IGRPDropdownMenuCheckboxItem,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuSeparator,
  IGRPDropdownMenuShortcut,
  IGRPDropdownMenuSub,
  IGRPDropdownMenuSubTrigger,
  IGRPDropdownMenuSubContent,
} from "./components/horizon/dropdown-menu.js"

export { IGRPFieldDescription, type IGRPFieldDescriptionProps } from "./components/horizon/field-description.js"

export {
  type IGRPFormContextValue,
  useIGRPFormContext,
  IGRPFormContext,
} from "./components/horizon/form/form-context.js"
export { IGRPFormField, type IGRPFormFieldProps } from "./components/horizon/form/form-field.js"
export { IGRPForm, type IGRPFormProps, type IGRPFormHandle } from "./components/horizon/form/index.js"
export { convertValuesToFormData } from "./components/horizon/form/lib/utils.js"
export { IGRPFormList, type IGRPFormListProps } from "./components/horizon/form/form-list.js"
export {
  IGRPRepetitiveComponent,
  type IGRPRepetitiveComponentProps,
} from "./components/horizon/repetitive-component.js"

export { IGRPIcon, type IGRPIconProps, type IGRPIconName, type LucideProps } from "./components/horizon/icon/index.js"
export { IGRPIconObject } from "./components/horizon/icon/catalog.js"
export { IGRPIconList } from "./components/horizon/icon/icon-list.js"

export { IGRPImage, type IGRPImageProps, type IGRPRatioType } from "./components/horizon/image.js"

export {
  IGRPImageCropper,
  type IGRPImageCropperProps,
  type IGRPImageCropperVariant,
} from "./components/horizon/image-cropper.js"

export {
  IGRPInfoCard,
  type IGRPInfoCardProps,
  type IGRPInfoItem,
  type IGRPInfoSection,
  type IGRPInfoCardOrientation,
  type IGRPInfoCardColumns,
} from "./components/horizon/info-card.js"

export { IGRPCheckbox, type IGRPCheckboxProps } from "./components/horizon/input/checkbox.js"

export { IGRPInputColor, type IGRPInputColorProps } from "./components/horizon/input/color.js"

export { IGRPCombobox, type IGRPComboboxProps } from "./components/horizon/input/combobox.js"
export { IGRPMultiSelect, type IGRPMultiSelectProps } from "./components/horizon/input/multi-select.js"

// export {
//   IGRPDatePickerInputRange,
//   type IGRPDatePickerInputRangeProps
// } from './components/horizon/input/date-picker/input-range';

export {
  IGRPDatePickerInputSingle,
  type IGRPDatePickerInputSingleProps,
} from "./components/horizon/input/date-picker/input-single.js"

export {
  IGRPDatePickerMultiple,
  type IGRPDatePickerMultipleProps,
} from "./components/horizon/input/date-picker/multiple.js"

export { IGRPDatePickerRange, type IGRPDatePickerRangeProps } from "./components/horizon/input/date-picker/range.js"

export { IGRPDatePicker, type IGRPDatePickerProps } from "./components/horizon/input/date-picker/date-picker.js"

export { IGRPDatePickerSingle, type IGRPDatePickerSingleProps } from "./components/horizon/input/date-picker/single.js"

export { IGRPDateTimeInput, type IGRPDateTimeInputProps } from "./components/horizon/input/date-time.js"
export { IGRPInputFile, type IGRPInputFileProps } from "./components/horizon/input/file.js"
export { IGRPInputHidden } from "./components/horizon/input/hidden.js"
export { IGRPInputNumber, type IGRPInputNumberProps } from "./components/horizon/input/number.js"
export { IGRPInputPassword, type IGRPInputPasswordProps } from "./components/horizon/input/password.js"
export { IGRPInputPhone, type IGRPInputPhoneProps } from "./components/horizon/input/phone.js"
export { IGRPInputSearch, type IGRPInputSearchProps } from "./components/horizon/input/search.js"
export { IGRPSelect, type IGRPSelectProps } from "./components/horizon/input/select.js"
export { IGRPSwitch, type IGRPSwitchProps } from "./components/horizon/input/switch.js"
export { IGRPInputText, type IGRPInputTextProps } from "./components/horizon/input/text.js"
export { IGRPTextarea, type IGRPTextareaProps } from "./components/horizon/input/textarea.js"
export { IGRPInputTime, type IGRPInputTimeProps } from "./components/horizon/input/time.js"
export { IGRPInputUrl, type IGRPInputUrlProps } from "./components/horizon/input/url.js"
export { IGRPRadioGroup, type IGRPRadioGroupProps, type IGRPRadioOption } from "./components/horizon/input/radio-group.js"
export { IGRPInputAddOn, type IGRPInputAddOnProps } from "./components/horizon/input/with-addons.js"

export { IGRPLabel, type IGRPLabelProps } from "./components/horizon/label.js"

export { IGRPLoadingSpinner } from "./components/horizon/loading-spinner.js"

export {
  IGRPMenuNavigationProvider,
  IGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  useIGRPMenuNavigation,
} from "./components/horizon/menu-navigation.js"

export {
  IGRPMenubar,
  IGRPMenubarPortal,
  IGRPMenubarMenu,
  IGRPMenubarTrigger,
  IGRPMenubarContent,
  IGRPMenubarGroup,
  IGRPMenubarSeparator,
  IGRPMenubarLabel,
  IGRPMenubarItem,
  IGRPMenubarShortcut,
  IGRPMenubarCheckboxItem,
  IGRPMenubarRadioGroup,
  IGRPMenubarRadioItem,
  IGRPMenubarSub,
  IGRPMenubarSubTrigger,
  IGRPMenubarSubContent,
} from "./components/horizon/menubar.js"

export {
  IGRPModalDialog,
  IGRPModalDialogClose,
  IGRPModalDialogContent,
  type IGRPModalDialogContentProps,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  type IGRPModalDialogFooterProps,
  IGRPModalDialogHeader,
  type IGRPModalDialogHeaderProps,
  IGRPModalDialogTitle,
  IGRPModalDialogTrigger,
  igrpModalDialogContentVariants,
} from "./components/horizon/modal-dialog.js"

export {
  IGRPNotification,
  type IGRPNotificationProps,
  IGRPNotificationVariants,
} from "./components/horizon/notification.js"

export { IGRPPageFooter, type IGRPPageFooterProps } from "./components/horizon/page-footer.js"
export { IGRPPageHeader, type IGRPPageHeaderProps } from "./components/horizon/page-header/index.js"
export {
  IGRPPageHeaderBackButton,
  type IGRPPageHeaderBackButtonProps,
} from "./components/horizon/page-header/back-button.js"

export { IGRPPdfViewer, type IGRPPdfViewerProps, type IGRPDocumentItem } from "./components/horizon/pdf-viewer.js"

export {
  IGRPStepperProcess,
  type IGRPStepperProcessProps,
  type IGRPStepProcessProps,
} from "./components/horizon/process/stepper.js"

export { IGRPSeparator } from "./components/horizon/separator.js"

export {
  IGRPSidebarProvider,
  IGRPSidebar,
  IGRPSidebarTrigger,
  IGRPSidebarRail,
  IGRPSidebarInset,
  IGRPSidebarInput,
  IGRPSidebarHeader,
  IGRPSidebarFooter,
  IGRPSidebarSeparator,
  IGRPSidebarContent,
  IGRPSidebarGroup,
  IGRPSidebarGroupLabel,
  IGRPSidebarGroupAction,
  IGRPSidebarGroupContent,
  IGRPSidebarMenu,
  IGRPSidebarMenuItem,
  IGRPSidebarMenuButton,
  IGRPSidebarMenuAction,
  IGRPSidebarMenuBadge,
  IGRPSidebarMenuSkeleton,
  IGRPSidebarMenuSub,
  IGRPSidebarMenuSubItem,
  IGRPSidebarMenuSubButton,
  useIGRPSidebar,
} from "./components/horizon/sidebar.js"

export {
  IGRPStatsCard,
  type IGRPStatsCardProps,
  igrpStatsCardVariants,
  igrpStatsCardTitleVariants,
  igrpStatsCardValueVariants,
  igrpStstaCardIconVariants,
} from "./components/horizon/stats-card.js"
export { IGRPTable, type IGRPTableProps } from "./components/horizon/table.js"
export { IGRPTabs, type IGRPTabsProps, type IGRPTabItem } from "./components/horizon/tabs.js"
export {
  type IGRPPromiseToastProps,
  type PlainToastProps,
  useIGRPToast,
  IGRPToaster,
} from "./components/horizon/toaster.js"

export { IGRPHeadline, type IGRPHeadlineProps, igrpHeadlineVariants } from "./components/horizon/typography/headline.js"

export { IGRPLink, IGRPLinkVariants, type IGRPLinkProps } from "./components/horizon/typography/link.js"

export {
  IGRPTextList,
  type IGRPTextListProps,
  type IGRPTextListType,
  type IGRPTextListItem,
  igrpTextlistVariants,
  igrpTextlistItemVariants,
  igrpCreateListItem,
  igrpListItems,
} from "./components/horizon/typography/list.js"

export { IGRPText, type IGRPTextProps, igrpTextVariants } from "./components/horizon/typography/text.js"

export {
  IGRPVideoEmbed,
  type IGRPVideoEmbedProps,
  type IGRPVideoEmbedAllowFeature,
} from "./components/horizon/video-embed.js"

// types

export type {
  IGRPPlacementProps,
  IGRPBaseAttributes,
  IGRPInputProps,
  IGRPOptionsProps,
  IGRPGridSize,
  IGRPCalendarProps,
  IGRPCalendarTimeProps,
  IGRPDatePickerBaseProps,
  IGRPSize,
  IGRPRoundSize,
} from "./types.js"

// hooks

export { useIGRPMetaColor } from "./hooks/use-meta-color.js"
export { IGRP_META_THEME_COLORS } from "./lib/meta-theme-colors.js"
export { useIsMobile } from "./hooks/use-mobile.js"

// libs

export {
  formatDateRange,
  formatDateToString,
  getDisabledDays,
  isValidDate,
  parseStringToDate,
  parseStringToRange,
} from "./lib/calendar-utils.js"
export { getDateFormatMaxLength, getDateFormatParts, maskDateInput, parseDateInput } from "./lib/date-input-format.js"
export {
  IGRPColors,
  type IGRPColorType,
  type IGRPColorRole,
  type IGRPColorVariants,
  IGRPColorObjectVariants,
  IGRPColorObjectRole,
  igrpColorText,
} from "./lib/colors.js"
export {
  igrpGridSizeClasses,
  igrpAlertIconMappings,
  igrpGetInitials,
  igrpToPascalCase,
  igrpIsExternalUrl,
  igrpNormalizeUrl,
  parseLocalDate,
} from "./lib/utilities.js"
export { cn } from "cn"
export { colorToOklch, detectFormat, type ColorFormat } from "./lib/color-utils.js"

// i18n

export {
  IGRPI18nProvider,
  useIGRPi18n,
  useIGRPLocale,
  igrpFormatMessage,
  IGRP_DEFAULT_LOCALE,
  IGRP_I18N_DEFAULTS_PT_PT,
  type IGRPI18nStrings,
  type IGRPI18nStringsOverride,
} from "./i18n/index.js"

// external dependencies

export type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  FilterFn,
  PaginationState,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"

export type { DateRange } from "react-day-picker"
