import { useState } from 'react';

import { Input } from '../../primitives/input';
import { Label } from '../../primitives/label';
import type { IGRPCalendarTimeProps } from '../../../types';
import { IGRPCalendarMultiple, type IGRPCalendarMultipleProps } from './multiple';
import { DEFAULT_HIDE_TIME_INDICATOR } from '../../../lib/constants';

interface IGRPCalendarMultipleTimeProps extends IGRPCalendarMultipleProps, IGRPCalendarTimeProps { }

function IGRPCalendarMultipleTime({
  onStartTime,
  onEndTime,
  hideEndTimePicker = false,
  startTimePlaceholder,
  endTimePlaceholder,
  startTimeLabel = 'Data Início',
  endTimeLabel = 'Data Fim',
  showTimeIndicator = false,
  name,
  ...props
}: IGRPCalendarMultipleTimeProps) {
  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")

  const classHide = showTimeIndicator ? DEFAULT_HIDE_TIME_INDICATOR : ''

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartTime(value)
    onStartTime?.(value || undefined)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndTime(value)
    onEndTime?.(value || undefined)
  }

  return (
    <div id={name}>
      <div className="space-y-4">
        <IGRPCalendarMultiple {...props} />

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor={`${name}-start-time`}>
              {startTimeLabel}
            </Label>
            <Input
              id={`${name}-start-time`}
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
              <Label htmlFor={`${name}-end-time`}>
                {endTimeLabel}
              </Label>
              <Input
                id={`${name}-end-time`}
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

export { IGRPCalendarMultipleTime, type IGRPCalendarMultipleTimeProps };
