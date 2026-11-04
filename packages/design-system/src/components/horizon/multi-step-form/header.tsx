"use client"

import { useContext } from "react"

import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { cn } from "../cn.js"
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "../../primitives/stepper.js"
import { IGRPTooltip } from "../tooltip.js"
import { IGRPMultiStepFormBlockingContext, useIGRPMultiStepForm } from "./context.js"

interface IGRPMultiStepFormHeaderProps extends React.ComponentProps<"div"> {
  variant?: "ring" | "number"
  /** Clicking a step calls goToStep (which validates). Default false. */
  navigable?: boolean
  /** Spinner on the active step's indicator, e.g. while a step is saved. */
  isLoading?: boolean
}

/** Stepper header for IGRPMultiStepForm. Steps past a blocked current step cannot be jumped to. */
function IGRPMultiStepFormHeader({
  variant = "ring",
  navigable = false,
  isLoading = false,
  className,
  ...props
}: IGRPMultiStepFormHeaderProps) {
  const { steps, currentStepIndex, goToStep } = useIGRPMultiStepForm()
  const message = useContext(IGRPMultiStepFormBlockingContext)?.message ?? null

  return (
    <div
      {...igrpOmitNonDomProps(props)}
      data-slot="multi-step-form-header"
      className={cn("w-full max-w-full min-w-0", className)}
    >
      <Stepper value={currentStepIndex} onValueChange={navigable ? (n) => void goToStep(n) : undefined}>
        {steps.map((step, i) => {
          const blocked = message !== null && i + 1 > currentStepIndex
          const content = (
            <>
              <StepperIndicator variant={variant} />
              <StepperTitle>{step.title}</StepperTitle>
              {step.description && <StepperDescription className="text-xs">{step.description}</StepperDescription>}
            </>
          )
          return (
            <StepperItem
              key={step.key}
              step={i + 1}
              loading={isLoading}
              disabled={blocked}
              className="relative flex-1 flex-col"
            >
              {navigable ? (
                <IGRPTooltip label={blocked ? message : undefined}>
                  <StepperTrigger disabled={blocked} className="flex-col">
                    {content}
                  </StepperTrigger>
                </IGRPTooltip>
              ) : (
                <StepperTrigger asChild>
                  <div className="flex flex-col items-center gap-3">{content}</div>
                </StepperTrigger>
              )}
              {i < steps.length - 1 && <StepperSeparator className="absolute m-0 w-auto" />}
            </StepperItem>
          )
        })}
      </Stepper>
    </div>
  )
}

export { IGRPMultiStepFormHeader, type IGRPMultiStepFormHeaderProps }
