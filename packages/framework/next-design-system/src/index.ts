'use client';

import './styles.css';

// custom components
export { IGRPStatusBanner, type IGRPStatusBannerProps } from './components/custom/status-banner';
export { IGRPStatsCardTopBorderColored } from './components/custom/stats-card-top-border-colored';
export { IGRPUserAvatar, type IGRPUserAvatarProps } from './components/custom/user-avatar';

// errs components
export { IGRPGlobalError, type IGRPGlobalErrorProps } from './components/errors/global';

// horizon and primitives components
// export {
//   AlertDialog,
//   AlertDialogPortal,
//   AlertDialogOverlay,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogFooter,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogAction,
//   AlertDialogCancel,
// } from './components/horizon/alert-dialog';
// export { Button, buttonVariants } from './components/horizon/button';
// export { Calendar } from './components/horizon/calendar';
// export {
//   Card,
//   CardHeader,
//   CardFooter,
//   CardTitle,
//   CardAction,
//   CardDescription,
//   CardContent
// } from './components/horizon/card';
// export {
//   type CarouselApi,
//   Carousel,
//   CarouselContent,
//   CarouselItem,
//   CarouselPrevious,
//   CarouselNext,
// } from './components/horizon/carousel';
// export { Checkbox } from './components/horizon/checkbox';
// export {
//   Dialog,
//   DialogClose,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogOverlay,
//   DialogPortal,
//   DialogTitle,
//   DialogTrigger,
// } from './components/horizon/dialog';
// export { Input } from './components/horizon/input';
// export {
//   Pagination,
//   PaginationContent,
//   PaginationLink,
//   PaginationItem,
//   PaginationPrevious,
//   PaginationNext,
//   PaginationEllipsis,
// } from './components/horizon/pagination';
// export { RadioGroup, RadioGroupItem, radioItemVariants } from './components/horizon/radio-group';
// export {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupAction,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarInput,
//   SidebarInset,
//   SidebarMenu,
//   SidebarMenuAction,
//   SidebarMenuBadge,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSkeleton,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
//   SidebarProvider,
//   SidebarRail,
//   SidebarSeparator,
//   SidebarTrigger,
//   // eslint-disable-next-line react-refresh/only-export-components
//   useSidebar,
// } from './components/horizon/sidebar';

// igrp components
export { IGRPAlert, type IGRPAlertProps } from './components/igrp/alert';
export { IGRPAlertDialog, type IGRPAlertDialogProps } from './components/igrp/alert-dialog';
export { IGRPBadge, type IGRPBadgeProps, igrpBadgeVariants } from './components/igrp/badge';
export { IGRPButton, type IGRPButtonProps } from './components/igrp/button';

export {
  IGRPCard,
  IGRPCardHeader,
  IGRPCardTitle,
  IGRPCardDescription,
  IGRPCardAction,
  IGRPCardContent,
  IGRPCardFooter,
} from './components/igrp/card';

export { IGRPAreaChart } from './components/igrp/chart/Area';
export { IGRPHorizontalBarChart } from './components/igrp/chart/Bar/horizontal';
export { IGRPVerticalBarChart } from './components/igrp/chart/Bar/vertical';
export { IGRPLineChart } from './components/igrp/chart/Line';
export { IGRPPieChart } from './components/igrp/chart/Pie';
export { IGRPRadarChart } from './components/igrp/chart/Radar';
export { IGRPRadialBarChart } from './components/igrp/chart/Radial';
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
} from './components/igrp/chart/types';
export { IGRP_CHART_COLORS } from './components/igrp/chart/types';
export {
  formatChartValue,
  getChartHeight,
  getChartWidth,
  getLegendLayout,
  getLegendVerticalAlign,
  getLegendHorizontalAlign,
  hasNegativeValues,
  createChartConfig,
} from './components/igrp/chart/lib';

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage } from './components/igrp/chat';

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
} from './components/igrp/command';
export { IGRPContainer } from './components/igrp/container';
export { IGRPDataTable, type IGRPDataTableProps } from './components/igrp/data-table/data-table';
export {
  IGRPDataTableButtonAlert,
  IGRPDataTableButtonLink,
  IGRPDataTableButtonModal,
} from './components/igrp/data-table/action-button-icon';
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
} from './components/igrp/data-table/action-dropdown-menu';
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
} from './components/igrp/data-table/cell';
export {
  IGRPDataTableClientFilter,
  type IGRPDataTableClientFilterListProps,
  type IGRPDataTableFilterClientProps,
} from './components/igrp/data-table/client-filter';
export {
  IGRPDataTableFilterDate,
  IGRPDataTableFilterDropdown,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableFilterMinMax,
  IGRPDataTableFilterSelect,
} from './components/igrp/data-table/filter';
export {
  IGRPDataTableHeaderSortToggle,
  IGRPDataTableHeaderSortDropdown,
  IGRPDataTableHeaderRowsSelect,
  IGRPDataTableHeaderDefault,
} from './components/igrp/data-table/header';
export {
  IGRPDataTablePagination,
  IGRPDataTablePaginationNumeric,
  type IGRPDataTablePaginationProps,
} from './components/igrp/data-table/pagination';
export {
  IGRPDataTableRowAction,
  type IGRPDataTableActionProps,
  type IGRPDataTableDialogProps,
  type IGRPDataTableLinkProps,
} from './components/igrp/data-table/row-actions';
export {
  IGPRDataTableToggleVisibility,
  type IGPRDataTableVisibilityProps,
} from './components/igrp/data-table/toggle-visibility';
export {
  IGRPDataTableDateRangeFilterFn,
  IGRPDataTableFacetedFilterFn,
} from './components/igrp/data-table/lib/filters-utils';

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
} from './components/igrp/dropdown-menu';
export {
  type IGRPFormContextValue,
  useIGRPFormContext,
  IGRPFormContext,
} from './components/igrp/form/form-context';
export { IGRPFormField, type IGRPFormFielProps } from './components/igrp/form/form-field';
export { IGRPForm, type IGRPFormProps, type IGRPFormHandle } from './components/igrp/form/form';
export { convertValuesToFormData } from './components/igrp/form/lib/utils';
export { IGRPFormList, type IGRPFormListProps } from './components/igrp/form-list';

export { IGRPIcon, type IGRPIconProps, type IGRPIconName } from './components/igrp/icon';
export {
  IGRPInfoCard,
  type IGRPInfoCardProps,
  type IGRPInfoItem,
  type IGRPInfoSection,
} from './components/igrp/info-card';

export { IGRPCheckbox, type IGRPCheckboxProps } from './components/igrp/input/checkbox';
export { IGRPInputColor, type IGRPInputColorProps } from './components/igrp/input/color';
export { IGRPCombobox, type IGRPComboboxProps } from './components/igrp/input/combobox';
export {
  IGRPDatePicker,
  type IGRPDatePickerProps,
} from './components/igrp/input/date-picker/date-picker';
export {
  IGRPDatePickerRange,
  type IGRPDatePickerRangeProps,
} from './components/igrp/input/date-picker/date-picker-range';
export { IGRPDateTimeInput, type IGRPDateTimeInputProps } from './components/igrp/input/date-time';
export { IGRPInputFile, type IGRPInputFileProps } from './components/igrp/input/file';
export { IGRPInputHidden } from './components/igrp/input/hidden';
export { IGRPInputNumber, type IGRPInputNumberProps } from './components/igrp/input/number';
export { IGRPInputPassword, type IGRPInputPasswordProps } from './components/igrp/input/password';
export { IGRPInputPhone, type IGRPInputPhoneProps } from './components/igrp/input/phone';
export { IGRPInputSearch, type IGRPInputSearchProps } from './components/igrp/input/search';
export { IGRPSelect, type IGRPSelectProps } from './components/igrp/input/select';
export { IGRPSwitch, type IGRPSwitchProps } from './components/igrp/input/switch';
export { IGRPInputText, type IGRPInputTextProps } from './components/igrp/input/text';
export { IGRPTextarea, type IGRPTextareaProps } from './components/igrp/input/textarea';
export { IGRPInputTime, type IGRPInputTimeProps } from './components/igrp/input/time';
export { IGRPInputUrl, type IGRPInputUrlProps } from './components/igrp/input/url';
export { IGRPRadioGroup, type IGRPRadioGroupProps } from './components/igrp/input/radio-group';
export { IGRPInputAddOn, type IGRPInputAddOnProps } from './components/igrp/input/with-addons';

export { IGRPLabel, type IGRPLabelProps } from './components/igrp/label';
export { IGRPLoadingSpinner } from './components/igrp/loading/spiner';

export {
  IGRPMenuNavigationProvider,
  IGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  useIGRPMenuNavigation,
} from './components/igrp/menu-navigation';

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
} from './components/igrp/modal-dialog';

export {
  IGRPNotification,
  type IGRPNotificationProps,
  IGRPNotificationVariants,
} from './components/igrp/notification';

export { IGRPPageFooter, type IGRPPageFooterProps } from './components/igrp/page-footer';
export { IGRPPageHeader, type IGRPPageHeaderProps } from './components/igrp/page-header';
export {
  IGRPPageHeaderBackButton,
  type IGRPPageHeaderBackButtonProps,
} from './components/igrp/page-header/back-button';

export {
  IGRPPdfViewer,
  type IGRPPdfViewerProps,
  type IGRPDocumentItem,
} from './components/igrp/pdf-viewer';

export {
  IGRPRepetitiveComponent,
  type IGRPRepetitiveComponentProps,
} from './components/igrp/repetitive-component';

export { IGRPSeparator } from './components/igrp/separator';

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
} from './components/igrp/sidebar';

export { IGRPStatsCard, type IGRPStatsCardProps } from './components/igrp/stats-card';
export { IGRPTable, type IGRPTableProps } from './components/igrp/table';
export { IGRPTabs, type IGRPTabsProps, type IGRPTabItem } from './components/igrp/tabs';
export { IGRPToaster, useIGRPToast, type IGRPToastProps } from './components/igrp/toaster';

export {
  IGRPHeadline,
  type IGRPHeadlineProps,
  igrpHeadlineVariants,
} from './components/igrp/typography/headline';
export { IGRPLink, IGRPLinkVariants, type IGRPLinkProps } from './components/igrp/typography/link';
export {
  IGRPTextList,
  type IGRPTextListProps,
  type IGRPTextListType,
  type IGRPTextListItem,
  igrpTextlistVariants,
  igrpTextlistItemVariants,
  igrpCreateListItem,
  igrpListItems,
} from './components/igrp/typography/list';
export { IGRPText, type IGRPTextProps, igrpTextVariants } from './components/igrp/typography/text';

// templates
export {
  IGRPTemplateAppSwitcher,
  type IGRPTemplateAppSwitcherProps,
} from './components/templates/app-switcher';

export {
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
} from './components/templates/breadcrumbs';

export { IGRPTemplateCommandSearch } from './components/templates/command-search';

export { IGRPTemplateHeader } from './components/templates/header';

export { IGRPTemplateMenus, type IGRPTemplateMenuArgs } from './components/templates/menus';

export { IGRPTemplateModeSwitcher } from './components/templates/mode-switcher';

export {
  IGRPTemplateNavUser,
  type IGRPTemplateNavUserProps,
} from './components/templates/nav-user';

export { IGRPTemplateNavUserHeader } from './components/templates/nav-user-header';

export { IGRPTemplateNotifications } from './components/templates/notifications';

export { IGRPTemplateThemeSelector } from './components/templates/theme-selector';

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

// providers
export {
  IGRPActiveThemeProvider,
  type IGRPActiveThemeProviderArgs,
} from './providers/active-theme';
export { IGRPProgressBarProvider } from './providers/progress-bar';
export { IGRPRootProviders } from './providers/root';
export { IGRPSessionProvider } from './providers/session';

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

export * from 'zod';
