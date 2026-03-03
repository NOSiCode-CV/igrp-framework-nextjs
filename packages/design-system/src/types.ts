import { type IGRPIconName } from './components/horizon/icon';
import { igrpGridSizeClasses } from './lib/constants';
import type { IGRPColorVariants } from './lib/colors';
import { Calendar } from './components/primitives/calendar';

/** Placement options for labels, icons, and alignment. */
export type IGRPPlacementProps = 'start' | 'end' | 'center';

/**
 * Base attributes shared by many IGRP components.
 * Used for labels, icons, helper text, and common HTML attributes.
 */
export type IGRPBaseAttributes = {
  /** Field or element label. */
  label?: string;
  /** CSS classes for the label. */
  labelClassName?: string;
  /** Helper text shown below the element. */
  helperText?: string;
  /** Whether to show an icon. */
  showIcon?: boolean;
  /** Lucide icon name. */
  iconName?: IGRPIconName | string;
  /** Icon size in pixels. */
  iconSize?: string | number;
  /** Icon position relative to content. */
  iconPlacement?: IGRPPlacementProps;
  /** CSS classes for the icon. */
  iconClassName?: string;
  /** HTML name attribute. */
  name?: string;
};

/**
 * Props for IGRP input components.
 * Extends native input props with IGRPBaseAttributes and input-specific options.
 */
export type IGRPInputProps = {
  /** CSS classes for the input element. */
  inputClassName?: string;
  /** Validation error message. */
  error?: string;
  /**
   * @deprecated This props will be deprecated in the next release.
   */
  gridSize?: IGRPGridSize;
} & Omit<React.ComponentProps<'input'>, 'type'> &
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

export type IGRPCalendarProps = Omit<React.ComponentProps<typeof Calendar>, 'mode'> & {
  name?: string;
  disableBefore?: Date;
  disableAfter?: Date;
  disableDayOfWeek?: number | number[];
};

export type IGRPCalendarTimeProps = {
  onStartTime?: (value: string | undefined) => void;
  onEndTime?: (value: string | undefined) => void;
  hideEndTimePicker?: boolean;
  startTimePlaceholder?: string;
  endTimePlaceholder?: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
  showTimeIndicator?: boolean;
};

export type IGRPDatePickerBaseProps = {
  required?: boolean;
  disabledPicker?: boolean;
  dateFormat?: string;
  placeholder?: string;
} & Pick<IGRPBaseAttributes, 'label' | 'helperText' | 'labelClassName' | 'name'>;
export type IGRPSize = 'sm' | 'md' | 'lg' | 'xl';

export type IGRPRoundSize = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
