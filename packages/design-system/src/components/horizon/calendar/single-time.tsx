"use client"

import { useId, useState } from "react"

import { DEFAULT_HIDE_TIME_INDICATOR } from "../../../lib/utilities.js"
import type { IGRPCalendarTimeProps } from "../../../types.js"
import { useIGRPi18n } from "../../../i18n/index.js"
import { Input } from "../../primitives/input.js"
import { Label } from "../../primitives/label.js"
import { IGRPCalendarSingle, type IGRPCalendarSingleProps } from "./single.js"
import { cn } from "../cn.js"

/**
 * Props for the IGRPCalendarSingleTime component.
 * Combines single-date picker with start/end time inputs.
 * @see IGRPCalendarSingleTime
 */
interface IGRPCalendarSingleTimeProps extends IGRPCalendarSingleProps, IGRPCalendarTimeProps {}

/**
 * Single-date calendar with optional start and end time pickers.
 */
function IGRPCalendarSingleTime({
  onStartTime,
  onEndTime,
  hideEndTimePicker = false,
  startTimePlaceholder,
  endTimePlaceholder,
  startTimeLabel: startTimeLabelProp,
  endTimeLabel: endTimeLabelProp,
  showTimeIndicator = false,
  name,
  id,
  ...props
}: IGRPCalendarSingleTimeProps) {
  const i18n = useIGRPi18n()
  const startTimeLabel = startTimeLabelProp ?? i18n.datePicker.startDate
  const endTimeLabel = endTimeLabelProp ?? i18n.datePicker.endDate
  const _id = useId()
  const ref = name ?? id ?? _id

  const [startTime, setStartTime] = useState<string>("")
  const [endTime, setEndTime] = useState<string>("")

  const classHide = showTimeIndicator ? DEFAULT_HIDE_TIME_INDICATOR : ""

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
    <div id={ref}>
      <div className={cn("flex flex-col gap-4")}>
        <IGRPCalendarSingle {...props} />

        <div className={cn("flex flex-col gap-4 border-t pt-4")}>
          <div className={cn("flex flex-col gap-2")}>
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
            <div className={cn("flex flex-col gap-2")}>
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
  )
}

export { IGRPCalendarSingleTime, type IGRPCalendarSingleTimeProps }
