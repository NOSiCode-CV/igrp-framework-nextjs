"use client"

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type React from "react"
import { CheckIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "../../../lib/utils"
import { ScrollArea } from "../../primitives/scroll-area"
import { Stepper, StepperItem, StepperTitle, StepperTrigger } from "../../primitives/stepper"
import { Button } from "../../primitives/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "../../primitives/tooltip"

function getScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto"
  }
  return "smooth"
}

/**
 * Props for a single step in the process stepper.
 * @see IGRPStepperProcess
 */
interface IGRPStepProcessProps {
  /** Step index/number. */
  step: number
  /** Unique key for the step. */
  stepKey: string
  /** Step title. */
  title: string
  /** Optional step description. */
  description?: string
  /** Whether the step is completed. */
  isCompleted: boolean
  /** Whether the step is currently active. */
  isActive: boolean
}

/**
 * Props for the IGRPStepperProcess component.
 * @see IGRPStepperProcess
 */
interface IGRPStepperProcessProps {
  /** Array of step definitions. */
  steps: IGRPStepProcessProps[]
  /** Show loading state on the active step. */
  isLoading?: boolean
  /** Currently active step number. */
  currentStep: number
  /** Render function for step content; receives current step number. */
  children: (step: number) => React.ReactNode
  /** HTML id attribute. */
  id?: string
  /** Called when user selects a different step. */
  onStepChange?: (step: number, stepData: IGRPStepProcessProps) => void
  /** CSS classes for the stepper container. */
  stepperClassName?: string
  /** CSS classes for each step item. */
  stepperItemsClassName?: string
}

/** Chevron depth in px — how far a step's arrow reaches into its neighbour's notch. */
const STEP_NOTCH = 10
/** Visible sliver of page background left between two steps, in px. */
const STEP_GAP = 3

function getStepperItemClassName(): string {
  return cn(
    "group/step relative flex-1 text-center overflow-visible items-center justify-center max-md:items-start",
    // Only text colour lives on the item; the arrow shape and its fill are painted by the
    // background layer below, so a focus ring on the trigger is never clipped by the chevron.
    "text-muted-foreground",
    "data-[state=completed]:text-background hover:data-[state=active]:text-background",
    "data-[state=active]:text-background",
    "data-[state=inactive]:text-muted-foreground",
  )
}

/**
 * Single-apex chevron. Points run clockwise from the top-left corner:
 * top-left → right shoulder → apex at 50% → right shoulder → bottom-left → left notch.
 *
 * A `clip-path` is used rather than two skewed pseudo-elements because the apex must sit at
 * the row's true vertical middle at *any* row height. The previous approach skewed two
 * fixed-height (17px) halves about their own centres, which on a 24px row put the widest
 * points at y=7 and y=17 with a dip at y=12 — a blunt, asymmetric arrow — and left a bald
 * band across the middle of any row taller than 34px.
 */
function getStepShapeStyle(isFirst: boolean, isLast: boolean): React.CSSProperties {
  const notch = `${STEP_NOTCH}px`
  const shoulder = `calc(100% - ${notch})`
  const rightEdge = isLast ? ["100% 0", "100% 100%"] : [`${shoulder} 0`, "100% 50%", `${shoulder} 100%`]
  const leftNotch = isFirst ? [] : [`${notch} 50%`]

  return { clipPath: `polygon(${["0 0", ...rightEdge, "0 100%", ...leftNotch].join(", ")})` }
}

function getStepOffsetStyle(isFirst: boolean, isLast: boolean): React.CSSProperties {
  return {
    // Pull each step back over its predecessor's apex, leaving STEP_GAP of background showing.
    marginLeft: isFirst ? undefined : `${STEP_GAP - STEP_NOTCH}px`,
    // Keep the label clear of the clipped notch and apex.
    paddingLeft: isFirst ? undefined : `${STEP_NOTCH}px`,
    paddingRight: isLast ? undefined : `${STEP_NOTCH}px`,
  }
}

/**
 * Process stepper with horizontal steps, scroll navigation, and step content.
 * Use children(step) to render content for the current step.
 */
function IGRPStepperProcess({
  steps,
  children,
  isLoading,
  currentStep,
  id,
  onStepChange,
  stepperClassName,
  stepperItemsClassName,
}: IGRPStepperProcessProps) {
  const _id = useId()
  const ref = id ?? _id
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const validCurrentStep = useMemo(() => {
    if (steps.length === 0) return 0

    const matchingStep = steps.find((s) => s.step === currentStep)
    if (matchingStep) {
      return matchingStep.step
    }

    const activeStep = steps.find((s) => s.isActive)
    if (activeStep) {
      return activeStep.step
    }

    return steps[0]?.step ?? 0
  }, [currentStep, steps])

  const handleStepChange = useCallback(
    (step: number) => {
      const stepData = steps.find((s) => s.step === step)
      if (stepData) {
        onStepChange?.(step, stepData)
      }
    },
    [steps, onStepChange],
  )

  const checkScrollPosition = useCallback(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = viewport
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  const scrollLeft = useCallback(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const scrollAmount = viewport.clientWidth * 0.8
    viewport.scrollBy({ left: -scrollAmount, behavior: getScrollBehavior() })
  }, [])

  const scrollRight = useCallback(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const scrollAmount = viewport.clientWidth * 0.8
    viewport.scrollBy({ left: scrollAmount, behavior: getScrollBehavior() })
  }, [])

  useEffect(() => {
    if (!scrollAreaRef.current) return

    const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-slot="scroll-area-viewport"]')
    if (viewport) {
      scrollViewportRef.current = viewport
      requestAnimationFrame(() => checkScrollPosition())

      viewport.addEventListener("scroll", checkScrollPosition, { passive: true })
      const resizeObserver = new ResizeObserver(checkScrollPosition)
      resizeObserver.observe(viewport)

      return () => {
        viewport.removeEventListener("scroll", checkScrollPosition)
        resizeObserver.disconnect()
      }
    }
  }, [checkScrollPosition, steps.length])

  if (steps.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-8 w-full")} id={ref}>
      <div className={cn("flex items-center justify-center gap-4 relative")}>
        <div ref={scrollAreaRef} className={cn("w-[90vw]")}>
          <ScrollArea className={cn("w-full")}>
            <Stepper
              value={validCurrentStep}
              onValueChange={handleStepChange}
              className={cn(stepperClassName)}
              role="navigation"
              aria-label="Process steps"
            >
              {steps.map(({ step, stepKey, title, isCompleted, isActive }, index) => {
                const isFirst = index === 0
                const isLast = index === steps.length - 1

                return (
                  <StepperItem
                    key={stepKey ?? step}
                    step={step}
                    completed={isCompleted}
                    disabled={!isActive}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(getStepperItemClassName(), stepperItemsClassName)}
                    loading={isLoading && validCurrentStep === step}
                    style={getStepOffsetStyle(isFirst, isLast)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-muted",
                        "group-data-[state=completed]/step:bg-process-completed",
                        "group-data-[state=active]/step:bg-process-active",
                        "group-data-[state=inactive]/step:bg-muted",
                        isFirst && "rounded-l-2xl",
                        isLast && "rounded-r-2xl",
                      )}
                      style={getStepShapeStyle(isFirst, isLast)}
                    />
                    <StepperTrigger asChild className={cn("gap-1 rounded max-md:flex-col z-10 cursor-pointer")}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "bg-transparent hover:bg-transparent text-center flex items-center justify-center",
                          "shadow-none text-[10px] w-34",
                          (isActive || isCompleted) && "text-background hover:text-background",
                        )}
                        size="xs"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn("flex items-center justify-center gap-2 w-full min-w-0")}>
                              <CheckIcon
                                className={cn(
                                  "hidden",
                                  isCompleted && "stroke-[2.5] block opacity-70 group-hover/step:hidden shrink-0",
                                )}
                                aria-hidden="true"
                              />
                              <StepperTitle
                                className={cn(
                                  isCompleted
                                    ? "hidden group-hover/step:block truncate min-w-0"
                                    : "truncate w-full min-w-0",
                                )}
                              >
                                {title}
                              </StepperTitle>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{title}</TooltipContent>
                        </Tooltip>
                      </Button>
                    </StepperTrigger>
                  </StepperItem>
                )
              })}
            </Stepper>
          </ScrollArea>
        </div>

        <div className={cn("flex items-center justify-center gap-1")}>
          <Button
            variant="outline"
            size="icon-sm"
            className={cn("size-6 shrink-0 mb-3")}
            onClick={scrollLeft}
            aria-label="Scroll to previous steps"
            type="button"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className={cn("size-3")} aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            className={cn("size-6 shrink-0 mb-3")}
            onClick={scrollRight}
            aria-label="Scroll to next steps"
            type="button"
            disabled={!canScrollRight}
          >
            <ChevronRight className={cn("size-3")} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {children(validCurrentStep)}
    </div>
  )
}

export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps }
