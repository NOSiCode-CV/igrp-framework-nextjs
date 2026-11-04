"use client"

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext } from "react"

interface IGRPWizardStep {
  key: string
  title: string
  description?: string
  fields: string[]
  component: React.ReactNode
  /** Why this step cannot be left yet, or null. Requires an IGRPForm (or react-hook-form FormProvider). */
  blockingMessage?: (values: Record<string, unknown>) => string | null
}

interface IGRPGoToStepOptions {
  /** Skip validation of the steps being passed over. */
  force?: boolean
}

interface IGRPMultiStepFormContextValue {
  steps: IGRPWizardStep[]
  /** 1-based. */
  currentStepIndex: number
  currentStepData: IGRPWizardStep | undefined
  isFirstStep: boolean
  isLastStep: boolean
  goToNext: () => Promise<boolean>
  goToPrevious: () => void
  goToFirstStep: () => void
  goToStep: (step: number, options?: IGRPGoToStepOptions) => Promise<boolean>
  setSteps: (next: IGRPWizardStep[]) => void
}

/** @internal */
const IGRPMultiStepFormContext = createContext<IGRPMultiStepFormContextValue | null>(null)

/**
 * @internal Not exported from src/index.ts. Next reports the current step's live blocking message;
 * Header reads it.
 */
const IGRPMultiStepFormBlockingContext = createContext<{
  message: string | null
  report: (m: string | null) => void
} | null>(null)

/** Wizard state and navigation. Must be used within IGRPMultiStepForm. */
function useIGRPMultiStepForm(): IGRPMultiStepFormContextValue {
  const ctx = useContext(IGRPMultiStepFormContext)
  if (!ctx) throw new Error("useIGRPMultiStepForm must be used within IGRPMultiStepForm")
  return ctx
}

export {
  IGRPMultiStepFormContext,
  IGRPMultiStepFormBlockingContext,
  useIGRPMultiStepForm,
  type IGRPWizardStep,
  type IGRPGoToStepOptions,
  type IGRPMultiStepFormContextValue,
}
