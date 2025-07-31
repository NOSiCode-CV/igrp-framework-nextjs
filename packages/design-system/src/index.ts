/* eslint-disable perfectionist/sort-exports */
'use client';

// IMPORTANT: this file cannot use any wildcard exports because it is wrapped in a `use client` boundary
// IMPORTANT: do _not_ alias any of the exports in this file, this will cause a mismatch between the unbundled exports

// custom components
export { IGRPStatusBanner, type IGRPStatusBannerProps } from './components/custom/status-banner';
export { IGRPStatsCardTopBorderColored } from './components/custom/stats-card-top-border-colored';
export { IGRPUserAvatar, type IGRPUserAvatarProps } from './components/custom/user-avatar';

// primitives components
export {
  Accordion as IGRPAccordionPrimitive,
  AccordionItem as IGRPAccordionItemPrimitive,
  AccordionTrigger as IGRPAccordionTriggerPrimitive,
  AccordionContent as IGRPAccordionContentPrimitive,
} from './components/primitives/accordion';

export {
  AlertDialog as IGRPAlertDialogPrimitive,
  AlertDialogPortal as IGRPAlertDialogPortalPrimitive,
  AlertDialogOverlay as IGRPAlertDialogOverlayPrimitive,
  AlertDialogTrigger as IGRPAlertDialogTriggerPrimitive,
  AlertDialogContent as IGRPAlertDialogContentPrimitive,
  AlertDialogHeader as IGRPAlertDialogHeaderPrimitive,
  AlertDialogFooter as IGRPAlertDialogFooterPrimitive,
  AlertDialogTitle as IGRPAlertDialogTitlePrimitive,
  AlertDialogDescription as IGRPAlertDialogDescriptionPrimitive,
  AlertDialogAction as IGRPAlertDialogActionPrimitive,
  AlertDialogCancel as IGRPAlertDialogCancelPrimitive,
} from './components/primitives/alert-dialog';

export {
  Alert as IGRPAlertPrimitive,
  AlertTitle as IGRPAlertTitlePrimitive,
  AlertDescription as IGRPAlertDescriptionPrimitive,
} from './components/primitives/alert';

export {
  Avatar as IGRPUserAvatarPrimitive,
  AvatarImage as IGRPUserAvatarImagePrimitive,
  AvatarFallback as IGRPUserAvatarFallbackPrimitive,
} from './components/primitives/avatar';

export {
  Badge as IGRPBadgePrimitive,
  badgeVariants as IGRPBadgeVariantPrimitive,
} from './components/primitives/badge';

export {
  Breadcrumb as IGRPBreadcrumbPrimitive,
  BreadcrumbList as IGRPBreadcrumbListPrimitive,
  BreadcrumbItem as IGRPBreadcrumbItemPrimitive,
  BreadcrumbLink as IGRPBreadcrumbLinkPrimitive,
  BreadcrumbPage as IGRPBreadcrumbPagePrimitive,
  BreadcrumbSeparator as IGRPBreadcrumbSeparatorPrimitive,
  BreadcrumbEllipsis as IGRPBreadcrumbEllipsisPrimitive,
} from './components/primitives/breadcrumb';

export {
  Button as IGRPButtonPrimitive,
  buttonVariants as IGRPButtonVariantPrimitive,
} from './components/primitives/button';

export {
  Card as IGRPCardPrimitive,
  CardHeader as IGRPCardHeaderPrimitive,
  CardFooter as IGRPCardFooterPrimitive,
  CardTitle as IGRPCardTitlePrimitive,
  CardAction as IGRPCardActionPrimitive,
  CardDescription as IGRPCardDescriptionPrimitive,
  CardContent as IGRPCardContentPrimitive,
} from './components/primitives/card';

export {
  Collapsible as IGRPCollapsiblePrimitive,
  CollapsibleTrigger as IGRPCollapsibleTriggerPrimitive,
  CollapsibleContent as IGRPCollapsibleContentPrimitive,
} from './components/primitives/collapsible';

export {
  Command as IGRPCommandPrimitive,
  CommandDialog as IGRPCommandDialogPrimitive,
  CommandInput as IGRPCommandInputPrimitive,
  CommandList as IGRPCommandListPrimitive,
  CommandEmpty as IGRPCommandEmptyPrimitive,
  CommandGroup as IGRPCommandGroupPrimitive,
  CommandItem as IGRPCommandItemPrimitive,
  CommandShortcut as IGRPCommandShortcutPrimitive,
  CommandSeparator as IGRPCommandSeparatorPrimitive,
} from './components/primitives/command';

export {
  Dialog as IGRPDialogPrimitive,
  DialogClose as IGRPDialogClosePrimitive,
  DialogContent as IGRPDialogContentPrimitive,
  DialogDescription as IGRPDialogDescriptionPrimitive,
  DialogFooter as IGRPDialogFooterPrimitive,
  DialogHeader as IGRPDialogHeaderPrimitive,
  DialogOverlay as IGRPDialogOverlayPrimitive,
  DialogPortal as IGRPDialogPortalPrimitive,
  DialogTitle as IGRPDialogTitlePrimitive,
  DialogTrigger as IGRPDialogTriggerPrimitive,
} from './components/primitives/dialog';

export {
  DropdownMenu as IGRPDropdownMenuPrimitive,
  DropdownMenuPortal as IGRPDropdownMenuPortalPrimitive,
  DropdownMenuTrigger as IGRPDropdownMenuTriggerPrimitive,
  DropdownMenuContent as IGRPDropdownMenuContentPrimitive,
  DropdownMenuGroup as IGRPDropdownMenuGroupPrimitive,
  DropdownMenuLabel as IGRPDropdownMenuLabelPrimitive,
  DropdownMenuItem as IGRPDropdownMenuItemPrimitive,
  DropdownMenuCheckboxItem as IGRPDropdownMenuCheckboxItemPrimitive,
  DropdownMenuRadioGroup as IGRPDropdownMenuRadioGroupPrimitive,
  DropdownMenuRadioItem as IGRPDropdownMenuRadioItemPrimitive,
  DropdownMenuSeparator as IGRPDropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut as IGRPDropdownMenuShortcutPrimitive,
  DropdownMenuSub as IGRPDropdownMenuSubPrimitive,
  DropdownMenuSubTrigger as IGRPDropdownMenuSubTriggerPrimitive,
  DropdownMenuSubContent as IGRPDropdownMenuSubContentPrimitive,
} from './components/primitives/dropdown-menu';

export {
  useFormField as useIGRPFormFieldPrimitive,
  Form as IGRPFormPrimitive,
  FormItem as IGRPFormItemPrimitive,
  FormLabel as IGRPFormLabelPrimitive,
  FormControl as IGRPFormControlPrimitive,
  FormDescription as IGRPFormDescriptionPrimitive,
  FormMessage as IGRPFormMessagePrimitive,
  FormField as IGRPFormFieldPrimitive,
} from './components/primitives/form';

export { Input as IGRPInputPrimitive } from './components/primitives/input';
export { Label as IGRPLabelPrimitive } from './components/primitives/label';

export {
  RadioGroup as IGRPRadioGroupPrimitive,
  RadioGroupItem as IGRPRadioGroupItemPrimitive,
  radioItemVariants as IGRPRadioGroupVariantPrimitive,
} from './components/primitives/radio-group';

export {
  ScrollArea as IGRPScrollAreaPrimitive,
  ScrollBar as IGRPScrollBarPrimitive,
} from './components/primitives/scroll-area';

export {
  Select as IGRPSelectPrimitive,
  SelectContent as IGRPSelectContentPrimitive,
  SelectGroup as IGRPSelectGroupPrimitive,
  SelectItem as IGRPSelectItemPrimitive,
  SelectLabel as IGRPSelectLabelPrimitive,
  SelectScrollDownButton as IGRPSelectScrollDownButtonPrimitive,
  SelectScrollUpButton as IGRPSelectScrollUpButtonPrimitive,
  SelectSeparator as IGRPSelectSeparatorPrimitive,
  SelectTrigger as IGRPSelectTriggerPrimitive,
  SelectValue as IGRPSelectValuePrimitive,
} from './components/primitives/select';

export { Separator as IGRPSeparatorPrimitive } from './components/primitives/separator';

export {
  Sheet as IGRPCSheetPrimitive,
  SheetTrigger as IGRPCSheetTriggerPrimitive,
  SheetClose as IGRPCSheetClosePrimitive,
  SheetContent as IGRPCSheetContentPrimitive,
  SheetHeader as IGRPCSheetHeaderPrimitive,
  SheetFooter as IGRPCSheetFooterPrimitive,
  SheetTitle as IGRPCSheetTitlePrimitive,
  SheetDescription as IGRPCSheetDescriptionPrimitive,
} from './components/primitives/sheet';

export {
  Sidebar as IGRPSidebarPrimitive,
  SidebarContent as IGRPSidebarContentPrimitive,
  SidebarFooter as IGRPSidebarFooterPrimitive,
  SidebarGroup as IGRPSidebarGroupPrimitive,
  SidebarGroupAction as IGRPSidebarGroupActionPrimitive,
  SidebarGroupContent as IGRPSidebarGroupContentPrimitive,
  SidebarGroupLabel as IGRPSidebarGroupLabelPrimitive,
  SidebarHeader as IGRPSidebarHeaderPrimitive,
  SidebarInput as IGRPSidebarInputPrimitive,
  SidebarInset as IGRPSidebarInsetPrimitive,
  SidebarMenu as IGRPSidebarMenuPrimitive,
  SidebarMenuAction as IGRPSidebarMenuActionPrimitive,
  SidebarMenuBadge as IGRPSidebarMenuBadgePrimitive,
  SidebarMenuButton as IGRPSidebarMenuButtonPrimitive,
  SidebarMenuItem as IGRPSidebarMenuItemPrimitive,
  SidebarMenuSkeleton as IGRPSidebarMenuSkeletonPrimitive,
  SidebarMenuSub as IGRPSidebarMenuSubPrimitive,
  SidebarMenuSubButton as IGRPSidebarMenuSubButtonPrimitive,
  SidebarMenuSubItem as IGRPSidebarMenuSubItemPrimitive,
  SidebarProvider as IGRPSidebarProviderPrimitive,
  SidebarRail as IGRPSidebarRailPrimitive,
  SidebarSeparator as IGRPSidebarSeparatorPrimitive,
  SidebarTrigger as IGRPSidebarTriggerPrimitive,
  useSidebar as useIGRPSidebarPrimitive,
} from './components/primitives/sidebar';

export { Skeleton as IGRPSkeletonPrimitive } from './components/primitives/skeleton';

export { Toaster as IGRPToasterPrimitive } from './components/primitives/sonner';

export { Switch as IGRPSwitchPrimitive } from './components/primitives/switch';

export {
  Table as IGRPTablePrimitive,
  TableHeader as IGRPTableHeaderPrimitive,
  TableBody as IGRPTableBodyPrimitive,
  TableFooter as IGRPTableFooterPrimitive,
  TableHead as IGRPTableHeadPrimitive,
  TableRow as IGRPTableRowPrimitive,
  TableCell as IGRPTableCellPrimitive,
  TableCaption as IGRPTableCaptionPrimitive,
} from './components/primitives/table';

export { Textarea as IGRPTextAreaPrimitive } from './components/primitives/textarea';

export {
  Tooltip as IGRPTooltipPrimitive,
  TooltipTrigger as IGRPTooltipTriggerPrimitive,
  TooltipContent as IGRPTooltipContentPrimitive,
  TooltipProvider as IGRPTooltipProviderPrimitive,
} from './components/primitives/tooltip';

// horizon components
export { IGRPAlert, type IGRPAlertProps } from './components/horizon/alert';
export { IGRPAlertDialog, type IGRPAlertDialogProps } from './components/horizon/alert-dialog';
export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants } from './components/horizon/badge';
export { IGRPButton, type IGRPButtonProps } from './components/horizon/button';

export {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
} from './components/horizon/card';

export { IGRPAreaChart } from './components/horizon/chart/Area';
export { IGRPHorizontalBarChart } from './components/horizon/chart/Bar/horizontal';
export { IGRPVerticalBarChart } from './components/horizon/chart/Bar/vertical';
export { IGRPLineChart } from './components/horizon/chart/Line';
export { IGRPPieChart } from './components/horizon/chart/Pie';
export { IGRPRadarChart } from './components/horizon/chart/Radar';
export { IGRPRadialBarChart } from './components/horizon/chart/Radial';
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
  IGRPAreaChartProps,
  IGRPVerticalBarChartProps,
  IGRPHorizontalBarChartProps,
  PieConfig,
  IGRPPieChartProps,
  IGRPRadarConfig,
  IGRPRadarChartProps,
  RadialBarConfig,
  IGRPRadialBarChartProps,
} from './components/horizon/chart/types';
export { IGRP_CHART_COLORS } from './components/horizon/chart/types';
export {
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendLayout,
  getLegendVerticalAlign,
  getLegendHorizontalAlign,
  hasNegativeValues,
  createChartConfig,
} from './components/horizon/chart/lib';

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage } from './components/horizon/chat';

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
} from './components/horizon/command';
export { IGRPContainer } from './components/horizon/container';
export { IGRPDataTable, type IGRPDataTableProps } from './components/horizon/data-table/data-table';
export {
  IGRPDataTableButtonAlert,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
} from './components/horizon/data-table/action-button-icon';
export {
  type IGRPDataTableDropdownProps,
  type IGRPDataTableActionDropdown,
  type IGRPDataTableDropdownMenuDialogProps,
  type IGRPDataTableDropdownMenuLinkProps,
  IGRPDataTableDropdownMenuAlert,
  // IGRPDataTableDropdownMenuModal,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenu,
} from './components/horizon/data-table/action-dropdown-menu';
export {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  type IGRPDataTableCellExpanderProps,
  type IGRPDataTableCellAmountProps,
  type IGRPDataTableCellBadgeProps,
  type IGRPDataTableCellDateProps,
} from './components/horizon/data-table/cell';
export {
  IGRPDataTableClientFilter,
  type IGRPDataTableClientFilterListProps,
  type IGRPDataTableFilterClientProps,
} from './components/horizon/data-table/client-filter';
export {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
} from './components/horizon/data-table/filter';
export {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderDefault,
} from './components/horizon/data-table/header';
export {
  IGRPDataTablePagination,
  IGRPDataTablePaginationNumeric,
  type IGRPDataTablePaginationProps,
} from './components/horizon/data-table/pagination';
export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
} from './components/horizon/data-table/row-actions';
export {
  IGPRDataTableToggleVisibility,
  type IGPRDataTableVisibilityProps,
} from './components/horizon/data-table/toggle-visibility';
export {
  IGRPDataTableDateRangeFilterFn,
  IGRPDataTableFacetedFilterFn,
} from './components/horizon/data-table/lib/filters-utils';

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
} from './components/horizon/dropdown-menu';
export {
  type IGRPFormContextValue,
  useIGRPFormContext,
  IGRPFormContext,
} from './components/horizon/form/form-context';
export { IGRPFormField, type IGRPFormFielProps } from './components/horizon/form/form-field';
export { IGRPForm, type IGRPFormProps, type IGRPFormHandle } from './components/horizon/form/form';
export { convertValuesToFormData } from './components/horizon/form/lib/utils';
export { IGRPFormList, type IGRPFormListProps } from './components/horizon/form-list';

export { IGRPIcon, type IGRPIconProps, type IGRPIconName } from './components/horizon/icon';
export {
  IGRPInfoCard,
  type IGRPInfoCardProps,
  type IGRPInfoItem,
  type IGRPInfoSection,
} from './components/horizon/info-card';

export { IGRPCheckbox, type IGRPCheckboxProps } from './components/horizon/input/checkbox';
export { IGRPInputColor, type IGRPInputColorProps } from './components/horizon/input/color';
export { IGRPCombobox, type IGRPComboboxProps } from './components/horizon/input/combobox';
export {
  IGRPDatePicker,
  type IGRPDatePickerProps,
} from './components/horizon/input/date-picker/date-picker';
export {
  IGRPDatePickerRange,
  type IGRPDatePickerRangeProps,
} from './components/horizon/input/date-picker/date-picker-range';
export {
  IGRPDateTimeInput,
  type IGRPDateTimeInputProps,
} from './components/horizon/input/date-time';
export { IGRPInputFile, type IGRPInputFileProps } from './components/horizon/input/file';
export { IGRPInputHidden } from './components/horizon/input/hidden';
export { IGRPInputNumber, type IGRPInputNumberProps } from './components/horizon/input/number';
export {
  IGRPInputPassword,
  type IGRPInputPasswordProps,
} from './components/horizon/input/password';
export { IGRPInputPhone, type IGRPInputPhoneProps } from './components/horizon/input/phone';
export { IGRPInputSearch, type IGRPInputSearchProps } from './components/horizon/input/search';
export { IGRPSelect, type IGRPSelectProps } from './components/horizon/input/select';
export { IGRPSwitch, type IGRPSwitchProps } from './components/horizon/input/switch';
export { IGRPInputText, type IGRPInputTextProps } from './components/horizon/input/text';
export { IGRPTextarea, type IGRPTextareaProps } from './components/horizon/input/textarea';
export { IGRPInputTime, type IGRPInputTimeProps } from './components/horizon/input/time';
export { IGRPInputUrl, type IGRPInputUrlProps } from './components/horizon/input/url';
export { IGRPRadioGroup, type IGRPRadioGroupProps } from './components/horizon/input/radio-group';
export { IGRPInputAddOn, type IGRPInputAddOnProps } from './components/horizon/input/with-addons';

export { IGRPLabel, type IGRPLabelProps } from './components/horizon/label';
export { IGRPLoadingSpinner } from './components/horizon/loading/spiner';

export {
  IGRPMenuNavigationProvider,
  IGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  useIGRPMenuNavigation,
} from './components/horizon/menu-navigation';

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
} from './components/horizon/modal-dialog';

export {
  IGRPNotification,
  type IGRPNotificationProps,
  IGRPNotificationVariants,
} from './components/horizon/notification';

export { IGRPPageFooter, type IGRPPageFooterProps } from './components/horizon/page-footer';
export { IGRPPageHeader, type IGRPPageHeaderProps } from './components/horizon/page-header';
export {
  IGRPPageHeaderBackButton,
  type IGRPPageHeaderBackButtonProps,
} from './components/horizon/page-header/back-button';

export {
  IGRPPdfViewer,
  type IGRPPdfViewerProps,
  type IGRPDocumentItem,
} from './components/horizon/pdf-viewer';

export {
  IGRPRepetitiveComponent,
  type IGRPRepetitiveComponentProps,
} from './components/horizon/repetitive-component';

export { IGRPSeparator } from './components/horizon/separator';

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
} from './components/horizon/sidebar';

export { IGRPStatsCard, type IGRPStatsCardProps } from './components/horizon/stats-card';
export { IGRPTable, type IGRPTableProps } from './components/horizon/table';
export { IGRPTabs, type IGRPTabsProps, type IGRPTabItem } from './components/horizon/tabs';
export { IGRPToaster, useIGRPToast, type IGRPToastProps } from './components/horizon/toaster';

export {
  IGRPHeadline,
  type IGRPHeadlineProps,
  igrpHeadlineVariants,
} from './components/horizon/typography/headline';

export {
  IGRPLink,
  IGRPLinkVariants,
  type IGRPLinkProps,
} from './components/horizon/typography/link';

export {
  IGRPTextList,
  type IGRPTextListProps,
  type IGRPTextListType,
  type IGRPTextListItem,
  igrpTextlistVariants,
  igrpTextlistItemVariants,
  igrpCreateListItem,
  igrpListItems,
} from './components/horizon/typography/list';

export {
  IGRPText,
  type IGRPTextProps,
  igrpTextVariants,
} from './components/horizon/typography/text';

// types
export type {
  IGRPPlacementProps,
  IGRPBaseAttributes,
  IGRPInputProps,
  IGRPOptionsProps,
  IGRPGridSize,
} from './types/globals';

// hooks
export { IGRP_META_THEME_COLORS, useIGRPMetaColor } from './hooks/use-meta-color';
export { useIsMobile } from './hooks/use-mobile';

// libs
export {
  IGRPColors,
  type IGRPColorType,
  type IGRPColorRole,
  type IGRPColorVariants,
  IGRPColorObjectVariants,
  IGRPColorObjectRole,
  igrpColorText,
} from './lib/colors';
export { igrpGridSizeClasses, igrpAlertIconMappings } from './lib/constants';
export { igrpGetnitials } from './lib/initials';
export { igrpToPascalCase } from './lib/pascal-case';
export { igrpIsExternalUrl, igrpNormalizeUrl } from './lib/url';
export { cn } from './lib/utils';

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
} from '@tanstack/react-table';

export type { DateRange } from 'react-day-picker';
