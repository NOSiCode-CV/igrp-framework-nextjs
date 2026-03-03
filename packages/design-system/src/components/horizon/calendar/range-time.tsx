"use client"

import { useId, useState } from 'react';

import { Input } from '../../primitives/input';
import { Label } from '../../primitives/label';
import type { IGRPCalendarTimeProps } from '../../../types';
import { IGRPCalendarRange, type IGRPCalendarRangeProps } from './range';
import { DEFAULT_HIDE_TIME_INDICATOR } from '../../../lib/constants';
import { cn } from '../../../lib/utils';

/**
 * Props for the IGRPCalendarRangeTime component.
 * Combines date range picker with start/end time inputs.
 * @see IGRPCalendarRangeTime
 */
interface IGRPCalendarRangeTimeProps extends IGRPCalendarRangeProps, IGRPCalendarTimeProps {}

/**
 * Date range calendar with optional start and end time pickers.
 */
function IGRPCalendarRangeTime({
  onStartTime,
  onEndTime,
  hideEndTimePicker = false,
  startTimePlaceholder,
  endTimePlaceholder,
  startTimeLabel = 'Data Início',
  endTimeLabel = 'Data Fim',
  showTimeIndicator = false,
  name,
  id,
  ...props
}: IGRPCalendarRangeTimeProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const classHide = showTimeIndicator ? DEFAULT_HIDE_TIME_INDICATOR : '';

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartTime(value);
    onStartTime?.(value || undefined);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndTime(value);
    onEndTime?.(value || undefined);
  };

  return (
    <div id={ref}>
      <div className={cn('space-y-4')}>
        <IGRPCalendarRange id={ref} {...props} />

        <div className={cn('space-y-4 pt-4 border-t')}>
          <div className={cn('space-y-2')}>
            <Label htmlFor={`${ref}-start-time`}>{startTimeLabel}</Label>
            <Input
              id={`${ref}-start-time`}
              type="time"
              step="1"
              placeholder={startTimePlaceholder}
              value={startTime}
              onChange={handleStartTimeChange}
              className={cn(classHide)}
            />
          </div>

          {!hideEndTimePicker && (
            <div className={cn('space-y-2')}>
              <Label htmlFor={`${ref}-end-time`}>{endTimeLabel}</Label>
              <Input
                id={`${ref}-end-time`}
                type="time"
                step="1"
                placeholder={endTimePlaceholder}
                value={endTime}
                onChange={handleEndTimeChange}
                className={cn(classHide)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { IGRPCalendarRangeTime, type IGRPCalendarRangeTimeProps };
