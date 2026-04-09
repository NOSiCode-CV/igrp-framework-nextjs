'use client';

import type { DateRange } from 'react-day-picker';

import { IGRPDatePickerRange, type IGRPDatePickerRangeProps } from './range';
import { IGRPDatePickerSingle, type IGRPDatePickerSingleProps } from './single';

type IGRPDatePickerSingleModeProps = IGRPDatePickerSingleProps & {
  mode: 'single';
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
};

type IGRPDatePickerRangeModeProps = IGRPDatePickerRangeProps & {
  mode: 'range';
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
};

export type IGRPDatePickerProps = IGRPDatePickerSingleModeProps | IGRPDatePickerRangeModeProps;

/**
 * Unified date-picker that supports both single and range modes.
 *
 * - `mode="single"` renders `IGRPDatePickerSingle`
 * - `mode="range"` renders `IGRPDatePickerRange`
 */
export function IGRPDatePicker(props: IGRPDatePickerProps) {
  if (props.mode === 'range') {
    const { mode, ...rest } = props;
    void mode;
    return <IGRPDatePickerRange {...rest} />;
  }

  const { mode, ...rest } = props;
  void mode;
  return <IGRPDatePickerSingle {...rest} />;
}

