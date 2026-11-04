"use client"

import { useCallback, useContext, useMemo, useRef, useState } from "react"

import { cn } from "../cn.js"
import { IGRPFormContext } from "../form/form-context.js"
import {
  IGRPMultiStepFormBlockingContext,
  IGRPMultiStepFormContext,
  type IGRPGoToStepOptions,
  type IGRPMultiStepFormContextValue,
  type IGRPWizardStep,
} from "./context.js"
import { clampStepIndex, resolveStepIndex } from "./lib.js"

interface IGRPMultiStepFormProps {
  steps: IGRPWizardStep[]
  /** 1-based step to start on; changing it re-applies it. Default 1. */
  initialStep?: number
  /** Replaces the default validation (`form.trigger(step.fields)` inside an IGRPForm, otherwise true). */
  onStepValidation?: (step: IGRPWizardStep) => Promise<boolean> | boolean
  onStepChange?: (next: number, prev: number) => void
  className?: string
  children: React.ReactNode
}

/** Wizard root: owns the current step and navigation. Compose with the step, footer and header parts. */
function IGRPMultiStepForm({
  steps: stepsProp,
  initialStep = 1,
  onStepValidation,
  onStepChange,
  className,
  children,
}: IGRPMultiStepFormProps) {
  const formCtx = useContext(IGRPFormContext)
  const form = formCtx?.form

  const [steps, setSteps] = useState(stepsProp)
  const [prevStepsProp, setPrevStepsProp] = useState(stepsProp)
  if (prevStepsProp !== stepsProp) {
    setPrevStepsProp(stepsProp)
    setSteps(stepsProp)
  }

  const [currentKey, setCurrentKey] = useState<string | undefined>(
    () => stepsProp[clampStepIndex(initialStep, stepsProp.length) - 1]?.key
  )
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)

  const currentStepIndex = resolveStepIndex(steps, currentKey)
  const currentStepData = steps[currentStepIndex - 1]

  // A changed initialStep re-applies (a saved draft resumes at the step the backend accepted).
  const [prevInitialStep, setPrevInitialStep] = useState(initialStep)
  if (prevInitialStep !== initialStep) {
    setPrevInitialStep(initialStep)
    setCurrentKey(steps[clampStepIndex(initialStep, steps.length) - 1]?.key)
  }

  // A removed current key falls back to step 1 in render; persist it so the old key returning later
  // does not pull the user back.
  if (steps.length && currentKey !== currentStepData?.key) setCurrentKey(currentStepData?.key)

  const inFlight = useRef(false)

  const validateStep = useCallback(
    async (step: IGRPWizardStep): Promise<boolean> => {
      try {
        if (form && step.blockingMessage && step.blockingMessage(form.getValues()) !== null) return false
        if (onStepValidation) return await onStepValidation(step)
        if (!form || !step.fields.length) return true
        await form.trigger(step.fields)
        // The resolver validates the whole schema and RHF writes every field's error; keep only this step's.
        const related = (key: string) =>
          step.fields.some(
            (f) => f === key || f.startsWith(`${key}.`) || f.startsWith(`${key}[`) || key.startsWith(`${f}.`)
          )
        const outside = Object.keys(form.getValues()).filter((key) => !related(key) && form.getFieldState(key).error)
        if (outside.length) form.clearErrors(outside)
        return !step.fields.some((f) => form.getFieldState(f).error)
      } catch {
        return false
      }
    },
    [form, onStepValidation]
  )

  const moveTo = useCallback(
    (next: number) => {
      if (next === currentStepIndex) return
      setCurrentKey(steps[next - 1]?.key)
      onStepChange?.(next, currentStepIndex)
    },
    [steps, currentStepIndex, onStepChange]
  )

  const goToStep = useCallback(
    async (step: number, options?: IGRPGoToStepOptions): Promise<boolean> => {
      if (!Number.isInteger(step) || step < 1 || step > steps.length) return false
      if (step <= currentStepIndex || options?.force) {
        moveTo(step)
        return true
      }
      if (inFlight.current) return false
      inFlight.current = true
      try {
        for (let i = currentStepIndex; i < step; i++) {
          const target = steps[i - 1]
          if (!target || !(await validateStep(target))) {
            moveTo(i)
            return false
          }
        }
        moveTo(step)
        return true
      } finally {
        inFlight.current = false
      }
    },
    [steps, currentStepIndex, moveTo, validateStep]
  )

  const goToNext = useCallback(
    () => (currentStepIndex >= steps.length ? Promise.resolve(false) : goToStep(currentStepIndex + 1)),
    [currentStepIndex, steps.length, goToStep]
  )
  const goToPrevious = useCallback(() => moveTo(Math.max(currentStepIndex - 1, 1)), [moveTo, currentStepIndex])
  const goToFirstStep = useCallback(() => moveTo(1), [moveTo])

  const value = useMemo<IGRPMultiStepFormContextValue>(
    () => ({
      steps,
      currentStepIndex,
      currentStepData,
      isFirstStep: currentStepIndex === 1,
      isLastStep: currentStepIndex >= steps.length,
      goToNext,
      goToPrevious,
      goToFirstStep,
      goToStep,
      setSteps,
    }),
    [steps, currentStepIndex, currentStepData, goToNext, goToPrevious, goToFirstStep, goToStep]
  )
  const blocking = useMemo(() => ({ message: blockingMessage, report: setBlockingMessage }), [blockingMessage])

  return (
    <IGRPMultiStepFormContext.Provider value={value}>
      <IGRPMultiStepFormBlockingContext.Provider value={blocking}>
        <div
          data-slot="multi-step-form"
          className={cn("flex w-full max-w-full min-w-0 flex-col gap-8 pt-3", className)}
        >
          {children}
        </div>
      </IGRPMultiStepFormBlockingContext.Provider>
    </IGRPMultiStepFormContext.Provider>
  )
}

export { IGRPMultiStepForm, type IGRPMultiStepFormProps }
