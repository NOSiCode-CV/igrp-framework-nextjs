"use client"

import { useCallback, use, useEffect, useMemo, useRef, useState } from "react"
import { useFormState, type FieldValues, type UseFormReturn } from "react-hook-form"

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
  /** 1-based step to start on; changing it re-applies it. Default 1. Ignored when `step` is set. */
  initialStep?: number
  /**
   * Controlled 1-based current step (clamped to the step count). Navigation then
   * only calls `onStepChange`; the wizard moves when `step` changes.
   */
  step?: number
  /** Replaces the default validation (`form.trigger(step.fields)` inside an IGRPForm, otherwise true). */
  onStepValidation?: (step: IGRPWizardStep) => Promise<boolean> | boolean
  /** Called with the step navigation moves to (and the one it left). Pair with `step` to control the wizard. */
  onStepChange?: (next: number, prev: number) => void
  className?: string
  children: React.ReactNode
}

/** After an invalid submit, moves to the first step with an error: other steps' fields are unmounted, so it would not show. */
function ShowFirstErrorStep({
  form,
  steps,
  moveTo,
}: {
  form: UseFormReturn<FieldValues>
  steps: IGRPWizardStep[]
  moveTo: (step: number) => void
}) {
  const { submitCount } = useFormState({ control: form.control })
  const handled = useRef(submitCount)
  useEffect(() => {
    if (submitCount === handled.current) return
    handled.current = submitCount
    const index = steps.findIndex((step) => step.fields.some((f) => form.getFieldState(f).error))
    if (index >= 0) moveTo(index + 1)
  }, [submitCount, form, steps, moveTo])
  return null
}

/** Wizard root: owns the current step and navigation. Compose with the step, footer and header parts. */
function IGRPMultiStepForm({
  steps: stepsProp,
  initialStep = 1,
  step: controlledStep,
  onStepValidation,
  onStepChange,
  className,
  children,
}: IGRPMultiStepFormProps) {
  const formCtx = use(IGRPFormContext)
  const form = formCtx?.form

  const [steps, setSteps] = useState(stepsProp)
  const [prevStepsProp, setPrevStepsProp] = useState(stepsProp)
  // setSteps below only takes effect on the next pass, so key reconciliation in this pass reads `base`.
  const base = prevStepsProp !== stepsProp ? stepsProp : steps
  if (prevStepsProp !== stepsProp) {
    setPrevStepsProp(stepsProp)
    setSteps(stepsProp)
  }

  const [currentKey, setCurrentKey] = useState<string | undefined>(
    () => stepsProp[clampStepIndex(initialStep, stepsProp.length) - 1]?.key
  )
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)

  const currentStepIndex =
    controlledStep !== undefined ? clampStepIndex(controlledStep, steps.length) : resolveStepIndex(steps, currentKey)
  const currentStepData = steps[currentStepIndex - 1]

  // A changed initialStep re-applies (a saved draft resumes at the step the backend accepted).
  const [prevInitialStep, setPrevInitialStep] = useState(initialStep)
  let nextKey = currentKey
  if (prevInitialStep !== initialStep) {
    setPrevInitialStep(initialStep)
    nextKey = base[clampStepIndex(initialStep, base.length) - 1]?.key
    setCurrentKey(nextKey)
  }

  // A removed current key falls back to step 1 in render; persist it so the old key returning later
  // does not pull the user back.
  const fallbackKey = base[resolveStepIndex(base, nextKey) - 1]?.key
  if (base.length && nextKey !== fallbackKey) setCurrentKey(fallbackKey)

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
      if (controlledStep === undefined) setCurrentKey(steps[next - 1]?.key)
      onStepChange?.(next, currentStepIndex)
    },
    [steps, currentStepIndex, onStepChange, controlledStep]
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
    <IGRPMultiStepFormContext value={value}>
      <IGRPMultiStepFormBlockingContext value={blocking}>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown only bubbles from the inputs inside; the wrapper is not itself interactive */}
        <div
          data-slot="multi-step-form"
          className={cn("flex w-full max-w-full min-w-0 flex-col gap-8 pt-3", className)}
          onKeyDown={(event) => {
            // Stop implicit submission from a text input until the last step; textareas and buttons keep Enter.
            if (event.key === "Enter" && !value.isLastStep && event.target instanceof HTMLInputElement) {
              event.preventDefault()
            }
          }}
        >
          {form && <ShowFirstErrorStep form={form} steps={steps} moveTo={moveTo} />}
          {children}
        </div>
      </IGRPMultiStepFormBlockingContext>
    </IGRPMultiStepFormContext>
  )
}

export { IGRPMultiStepForm, type IGRPMultiStepFormProps }
