"use client"

import { cn } from "../cn.js"
import { useIGRPMultiStepForm } from "./context.js"

interface IGRPMultiStepFormStepsProps extends React.ComponentProps<"div"> {
  /** Slide the step in when it changes (motion-safe only). Default true. */
  animate?: boolean
}

/** Renders the current step's component. */
function IGRPMultiStepFormSteps({ animate = true, className, ...props }: IGRPMultiStepFormStepsProps) {
  const { currentStepData } = useIGRPMultiStepForm()
  if (!currentStepData) return null
  return (
    <div
      {...props}
      // The key restarts the entry animation on every step change. There is no exit animation.
      key={currentStepData.key}
      data-slot="multi-step-form-steps"
      className={cn(
        "w-full max-w-full min-w-0",
        animate && "motion-safe:animate-[igrp-step-in_0.3s_ease-out_both]",
        className
      )}
    >
      {currentStepData.component}
    </div>
  )
}

export { IGRPMultiStepFormSteps, type IGRPMultiStepFormStepsProps }
