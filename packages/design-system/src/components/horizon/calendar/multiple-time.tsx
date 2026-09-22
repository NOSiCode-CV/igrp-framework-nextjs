"use client"

import { useId, useState } from "react"

import { Input } from "../../primitives/input.js"
import { Label } from "../../primitives/label.js"
import type { IGRPCalendarTimeProps } from "../../../types.js"
import { IGRPCalendarMultiple, type IGRPCalendarMultipleProps } from "./multiple.js"
import { DEFAULT_HIDE_TIME_INDICATOR } from "../../../lib/utilities.js"
import { cn } from "../cn.js"

/**
 * Props for the IGRPCalendarMultipleTime component.
 * Combines multi-date picker with start/end time inputs.
 * @see IGRPCalendarMultipleTime
 */
interface IGRPCalendarMultipleTimeProps extends IGRPCalendarMultipleProps, IGRPCalendarTimeProps {}

/**
 * Multi-date calendar with optional start and end time pickers.
 */
function IGRPCalendarMultipleTime({
  onStartTime,
  onEndTime,
  hideEndTimePicker = false,
  startTimePlaceholder,
  endTimePlaceholder,
  startTimeLabel = "Data Início",
  endTimeLabel = "Data Fim",
  showTimeIndicator = false,
  name,
  id,
  ...props
}: IGRPCalendarMultipleTimeProps) {
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
        <IGRPCalendarMultiple id={ref} {...props} />

        <div className={cn("flex flex-col gap-4 pt-4 border-t")}>
          <div className={cn("flex flex-col gap-2")}>
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
            <div className={cn("flex flex-col gap-2")}>
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
  )
}

export { IGRPCalendarMultipleTime, type IGRPCalendarMultipleTimeProps }
