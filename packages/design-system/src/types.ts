import { type IGRPIconName } from './components/horizon/icon';
import { igrpGridSizeClasses } from './lib/constants';
import type { IGRPColorVariants } from './lib/colors';
import { Calendar } from './components/primitives/calendar';

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
};

export type IGRPInputProps = {
  inputClassName?: string;
  error?: string;
  gridSize?: IGRPGridSize;
} & Omit<React.ComponentProps<'input'>, 'type'> & IGRPBaseAttributes;

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
