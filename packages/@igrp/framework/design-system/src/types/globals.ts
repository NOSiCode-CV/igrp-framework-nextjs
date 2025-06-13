import { type IGRPIconName } from '@/components/igrp/icon';
import { igrpGridSizeClasses } from '@/lib/constants';
import type { IGRPColorVariants } from '@/lib/colors';

export type IGRPPlacementProps = 'start' | 'end' | 'center';

export type IGRPBaseAttributes = {
  label?: string;
  labelClassName?: string;
  helperText?: string;
  showIcon?: boolean;
  iconName?: IGRPIconName | string;
  iconSize?: string | number;
  iconPlacement?: IGRPPlacementProps;
  iconClassName?: string;
  name?: string;
  ref?: React.Ref<HTMLDivElement> | undefined;
};

export type IGRPInputProps = {
  inputClassName?: string;
  error?: string;
  gridSize?: IGRPGridSize;
} & Omit<React.ComponentProps<'input'>, 'type' | 'name'> &
  IGRPBaseAttributes;

export type IGRPOptionsProps = {
  label: string;
  value: string;
  color?: string;
  status?: IGRPColorVariants;
  icon?: IGRPIconName | string;
  group?: string;
  description?: string;
  image?: string;
  flag?: string;
};

export type IGRPGridSize = keyof typeof igrpGridSizeClasses;

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
