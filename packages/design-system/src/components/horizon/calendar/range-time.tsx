import { useId, useState } from 'react';

import { Input } from '../../primitives/input';
import { Label } from '../../primitives/label';
import type { IGRPCalendarTimeProps } from '../../../types';
import { IGRPCalendarRange, type IGRPCalendarRangeProps } from './range';
import { DEFAULT_HIDE_TIME_INDICATOR } from '../../../lib/constants';

interface IGRPCalendarRangeTimeProps extends IGRPCalendarRangeProps, IGRPCalendarTimeProps {}

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
  const ref = name ?? id ?? _id

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
      <div className="space-y-4">
        <IGRPCalendarRange id={ref} {...props} />

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor={`${ref}-start-time`}>{startTimeLabel}</Label>
            <Input
              id={`${ref}-start-time`}
              type="time"
              step="1"
              placeholder={startTimePlaceholder}
              value={startTime}
              onChange={handleStartTimeChange}
              className={classHide}
            />
          </div>

          {!hideEndTimePicker && (
            <div className="space-y-2">
              <Label htmlFor={`${ref}-end-time`}>{endTimeLabel}</Label>
              <Input
                id={`${ref}-end-time`}
                type="time"
                step="1"
                placeholder={endTimePlaceholder}
                value={endTime}
                onChange={handleEndTimeChange}
                className={classHide}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { IGRPCalendarRangeTime, type IGRPCalendarRangeTimeProps };
