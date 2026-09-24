# §7. `IGRPMultiStepForm` — a form-aware wizard, and two fixes to `Stepper`

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§7`.

**Local workaround.** `src/app/(myapp)/_components/multi-step-viewer.tsx`
(`MultiStepFormContent`, `FormHeader`, `StepFields`, `FormFooter`,
`NextButton`, `PreviousButton`, `SubmitButton`, `ResetButton`), the state
machine in `src/app/(myapp)/_hooks/use-multi-step-viewer.tsx`
(`MultiStepFormProvider`, `useMultiStepForm`, `Stepfields`), and a **fork of the
DS `Stepper` primitive** in `src/app/(myapp)/_components/stepper.tsx`.

**Why it exists.** The DS has two stepper-shaped things and neither is a form
wizard:

- `Stepper` / `StepperItem` / `StepperIndicator` / … (`primitives/stepper`) —
  presentation only. No step content, no validation, no navigation buttons.
- `IGRPStepperProcess` (`horizon/process/stepper`) — takes
  `steps: { step, stepKey, title, description, isCompleted, isActive }[]`,
  `currentStep` and `children: (step) => ReactNode`. The caller still owns
  `currentStep`, every `isActive`/`isCompleted` flag, and all navigation. It is
  a _process viewer_, not a form driver: there is no per-step field list, no
  gate before advancing, and no integration with `IGRPForm`.

The missing piece is the one thing a wizard actually needs: **"you may not leave
step N until step N validates"**, expressed once, next to the step definition.

---

## §7.1 Who uses it

Two multi-step forms, both large and both central to the app:

- `src/app/(myapp)/_features/pedidos/components/pedido-wizard.tsx` — the 5-etapa pedido flow, each step persisted to its own backend endpoint.
- `src/app/(myapp)/_features/categorias-ocupacao/components/categoria-wizard.tsx` — Dados, Subcategorias, Campos do pedido, Fiscalização.

```tsx
<MultiStepFormProvider stepsFields={stepsFields} onStepValidation={handleStepValidation}>
  <MultiStepFormContent>
    <FormHeader variant="number" />
    <StepFields />
    <FormFooter className="mt-4 border-t pt-4">
      <IGRPButton variant="outline" onClick={handleCancel}>
        Cancelar
      </IGRPButton>
      <AnteriorButton onValidate={handleStepValidation} />
      <NextButton>Próximo</NextButton>
      <GuardarButton isSubmitting={isSubmitting} onGuardar={handleGuardarClick} />
    </FormFooter>
  </MultiStepFormContent>
</MultiStepFormProvider>
```

Both wizards live **inside** `IGRPForm`, so `useWatch`/`useFormContext` are
available to the wizard parts.

---

## §7.2 The state machine (`useMultiStepForm`)

```ts
interface Stepfields {
  fields: string[] // field names owned by this step
  component: JSX.Element
  title?: string
  /** Why this step cannot be left yet, or null when complete. */
  blockingMessage?: (values: Record<string, unknown>) => string | null
}

interface UseMultiFormStepsReturn {
  steps: Stepfields[]
  currentStepIndex: number // 1-based
  currentStepData: Stepfields
  progress: number // percent
  isFirstStep: boolean
  isLastStep: boolean
  goToNext: () => Promise<boolean> // runs onStepValidation first
  goToPrevious: () => void
  goToFirstStep: () => void
  goToStep: (n: number) => void
  setSteps: (next: Stepfields[]) => void
}
```

Provider props: `stepsFields`, `onStepValidation?: (step) => Promise<boolean> |
boolean`, `initialStepIndex` (default 1). Indices are **1-based** and clamped to
`[1, stepCount]`; `setSteps` resets to 1 if the current index falls off the end.
`initialStepIndex` is re-applied via effect, which is what lets `pedido-wizard`
resume a RASCUNHO at the step the backend last accepted.

---

## §7.3 Two ways of gating a step — both are needed

1. **`onStepValidation`** (async, on click). Runs before `goToNext` advances;
   returning `false` cancels. This is where `pedido-wizard` awaits its per-etapa
   `POST` and where `categoria-wizard` runs `form.trigger(step.fields)`.
2. **`blockingMessage`** (sync, continuous). `NextButton` splits into two
   implementations for this: a `PlainNextButton` for steps without it, and a
   `ValidatedNextButton` that calls `useWatch()` and disables itself, surfacing
   the reason as a `title` tooltip.

The split matters and should be preserved: `useWatch()` requires a form
provider, so a wizard used outside `IGRPForm` must not mount it. Equally
deliberate is that the message is _shown_ — a disabled Next button with no
explanation is the standard failure mode of this pattern, and in a multi-step
form the offending field may be off-screen.

`formState.isValid` cannot replace `blockingMessage`: it is whole-form, not
per-step, so on step 1 of a 5-step schema it is always `false`.

(The source in §7.8 refers to a "TODO.md stepper rule". That is our internal
functional spec, and the rule it names is exactly the sentence above: a step's
Next control stays disabled until that step's required fields are filled
correctly. Nothing else in it is needed to read the code.)

---

## §7.4 The `Stepper` fork — please just take these upstream

`src/app/(myapp)/_components/stepper.tsx` is a
copy of `primitives/stepper` with **one** change: `StepperIndicator` gains
`variant?: "number" | "ring"`. That is the entire reason 310 lines are
duplicated, and both wizards use it (`FormHeader variant="number"` or
`"ring"`, which also picks the separator offsets — `top-4` / `±1rem` for
numbers, `top-2.5` / `±0.625rem` for rings).

Two asks, both small and both independent of the rest of this document:

- **`variant` on `StepperIndicator`**, and let `StepperSeparator` derive its own
  offset from the item's indicator size instead of making every caller
  hand-compute `left-[calc(50%+1rem)] right-[calc(-50%+1rem)]`.
- **Semantic step tokens.** `FormHeader` styles the separator with
  `group-data-[state=completed]/step:bg-(--step-complete)` and the matching
  active rule — app-local variables from
  `src/styles/simple.css` (`--step-active`,
  `--step-active-text`, `--step-complete`, `--step-complete-text`, each with a
  dark-mode value). The DS should own those, as it owns `--primary`.

---

## §7.5 The rest of the surface

| Part                   | Behaviour                                                                                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MultiStepFormContent` | `flex flex-col gap-8 pt-3 w-full min-w-0 max-w-full`. The `min-w-0` is load-bearing — without it a wide step (a table) blows out the wizard width.                                                                                     |
| `FormHeader`           | `variant` (`"ring"` or `"number"`), `isLoading` (spinner on the active indicator), `navigable` (clicking a step header calls `goToStep`; **off by default**, because both wizards drive navigation through their own submit handlers). |
| `StepFields`           | Renders `steps[currentStepIndex - 1].component` inside `motion.div` with `MotionConfig reducedMotion="user"` and an `AnimatePresence mode="popLayout"` slide (`x: 15 → 0 → -15`, spring, 0.4s).                                        |
| `FormFooter`           | `flex w-full items-center justify-end gap-3 pt-3`.                                                                                                                                                                                     |
| `NextButton`           | Hidden on the last step. `ChevronRight`, `iconPlacement="end"`.                                                                                                                                                                        |
| `PreviousButton`       | Hidden on the first step. `variant="outline"`, `ChevronLeft`.                                                                                                                                                                          |
| `SubmitButton`         | Rendered **only** on the last step, `type="submit"`.                                                                                                                                                                                   |
| `ResetButton`          | `size="sm" variant="ghost"`, no built-in behaviour.                                                                                                                                                                                    |

**Dependency note.** `StepFields` pulls in `motion` (v13). If the DS does not
already depend on it, the animation should be optional — either behind an
`animate?: boolean` prop with a CSS-transition fallback, or in a separate entry
point. Do not make every IGRP app carry a motion runtime for a step transition.

---

## §7.6 Proposed API

Keep the compound shape (it composes well, and both wizards interleave their own
buttons into `FormFooter`), and prefix:

```tsx
<IGRPMultiStepForm
  steps={steps} // IGRPWizardStep[]
  initialStep={1} // 1-based
  onStepValidation={async (step) => true}
  onStepChange={(next, prev) => {}} // new
>
  <IGRPMultiStepForm.Header variant="number" navigable={false} isLoading={saving} />
  <IGRPMultiStepForm.Steps animate />
  <IGRPMultiStepForm.Footer>
    <IGRPMultiStepForm.Previous />
    <IGRPMultiStepForm.Next />
    <IGRPMultiStepForm.Submit>Guardar</IGRPMultiStepForm.Submit>
  </IGRPMultiStepForm.Footer>
</IGRPMultiStepForm>
```

```ts
export interface IGRPWizardStep {
  key: string // new: stable id, see below
  title: string
  description?: string
  fields: string[]
  component: React.ReactNode
  blockingMessage?: (values: Record<string, unknown>) => string | null
}
```

`useIGRPMultiStepForm()` exported with the same return shape as §7.2.

Gaps to close while lifting:

1. **Steps are keyed by index.** `Stepfields` has no id, so a wizard whose step
   list changes shape (the pedido wizard adds and removes steps by tipo de
   pedido) can land on a different step than the user was on. Add `key`.
2. **`currentStepData` can be `undefined`** when `steps` is empty, but is typed
   `Stepfields`. `StepFields` guards at runtime; the type still lies. Make it
   `Stepfields | undefined`.
3. **`goToStep` is unvalidated** — it jumps forward past incomplete steps.
   It should consult `onStepValidation`, or take a `{ force?: boolean }` option.
4. **No `blockingMessage` on the header.** When `navigable` is on, a blocked
   step should be non-clickable with the same message, not silently jumpable.
5. **`progress` is computed but nothing renders it.** Either ship a progress
   variant or drop it.

---

## §7.7 Acceptance criteria

- [ ] `onStepValidation` returning `false` (or rejecting) leaves the index
      unchanged and `goToNext()` resolves `false`.
- [ ] A step with `blockingMessage` disables Next while the message is
      non-null, re-evaluates on every keystroke, and shows the message on
      hover and focus.
- [ ] A wizard **without** any `blockingMessage` mounts no `useWatch` and works
      outside a form provider.
- [ ] `initialStep` beyond the step count clamps to the last step; below 1
      clamps to 1; an empty step list does not crash.
- [ ] Replacing the step list while on a now-out-of-range step resets to the
      first step; replacing it while on a still-present step (matched by `key`)
      keeps the user where they were.
- [ ] Previous is absent on step 1, Next absent on the last step, Submit
      present only on the last step.
- [ ] With `reducedMotion: user`, the slide transition is suppressed.
- [ ] `StepperIndicator variant="number"` and `variant="ring"` both render with
      correct separator alignment, and completed/active separators use DS
      tokens.

---

## §7.8 Reference implementation

Three files: the compound view components, the state machine behind them, and
the forked `Stepper` primitive (§7.4 — identical to yours except for
`StepperIndicator`'s `variant`).

### `src/app/(myapp)/_components/multi-step-viewer.tsx`

```tsx
"use client"

import { IGRPButton, type IGRPButtonProps } from "@igrp/igrp-framework-react-design-system"
import { useMultiStepForm } from "@myapp/_hooks/use-multi-step-viewer"
import { AnimatePresence, MotionConfig, type MotionProps, motion } from "motion/react"
import { useWatch } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from "./stepper"

/** The plain button: navigation is gated by `onStepValidation` on click. */
const PlainNextButton = (props: IGRPButtonProps) => {
  const { goToNext } = useMultiStepForm()
  return (
    <IGRPButton
      type="button"
      showIcon
      iconName="ChevronRight"
      iconPlacement="end"
      onClick={() => goToNext()}
      {...props}
    />
  )
}

/**
 * TODO.md stepper rule: disabled until the step's required fields are filled
 * correctly. Split into its own component so `useWatch` — which needs a form
 * provider — only runs for wizards that opted in via `Stepfields.blockingMessage`.
 *
 * The message is surfaced as a `title` tooltip rather than left implicit: a
 * disabled button with no explanation is the usual failure mode of this
 * pattern, and in a multi-step form the blocking field may not even be the one
 * the user is looking at.
 */
const ValidatedNextButton = ({
  blockingMessage,
  ...props
}: IGRPButtonProps & {
  blockingMessage: (values: Record<string, unknown>) => string | null
}) => {
  const { goToNext } = useMultiStepForm()
  const values = useWatch() as Record<string, unknown>
  const motivo = blockingMessage(values)
  return (
    <IGRPButton
      type="button"
      showIcon
      iconName="ChevronRight"
      iconPlacement="end"
      disabled={Boolean(motivo)}
      title={motivo ?? undefined}
      onClick={() => goToNext()}
      {...props}
    />
  )
}

const NextButton = (props: IGRPButtonProps) => {
  const { isLastStep, currentStepData } = useMultiStepForm()
  if (isLastStep) return null
  const blockingMessage = currentStepData?.blockingMessage
  if (blockingMessage) {
    return <ValidatedNextButton blockingMessage={blockingMessage} {...props} />
  }
  return <PlainNextButton {...props} />
}

const PreviousButton = (props: IGRPButtonProps) => {
  const { isFirstStep, goToPrevious } = useMultiStepForm()
  if (isFirstStep) return null
  return (
    <IGRPButton
      type="button"
      variant="outline"
      showIcon
      iconName="ChevronLeft"
      onClick={() => goToPrevious()}
      {...props}
    />
  )
}

const SubmitButton = (props: IGRPButtonProps) => {
  const { isLastStep } = useMultiStepForm()
  if (!isLastStep) return null
  return <IGRPButton type="submit" {...props} />
}

const ResetButton = (props: IGRPButtonProps) => {
  return <IGRPButton size="sm" type="button" variant="ghost" {...props} />
}

const FormHeader = ({
  className,
  variant = "ring",
  isLoading = false,
  navigable = false,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "ring" | "number"
  /** Shows a spinner on the active step's indicator (e.g. while a step is
   * being saved to the backend) — mirrors `StepperItem`'s own `loading` prop. */
  isLoading?: boolean
  /** Lets clicking a step's title/indicator jump straight to it via
   * `goToStep`. Off by default: most wizards drive navigation through
   * `NextButton`/`PreviousButton` (or their own per-step submit handlers)
   * and don't want the header itself to change steps. */
  navigable?: boolean
}) => {
  const { currentStepIndex, steps, goToStep } = useMultiStepForm()

  const sharedSep = "-order-1 -translate-y-1/2 absolute z-0 m-0 h-[2px] w-auto"
  const separatorClass =
    variant === "number"
      ? `${sharedSep} top-4 left-[calc(50%+1rem)] right-[calc(-50%+1rem)]`
      : `${sharedSep} top-2.5 left-[calc(50%+0.625rem)] right-[calc(-50%+0.625rem)]`

  return (
    <div className={cn("w-full max-w-full min-w-0 lg:px-8 xl:px-14 2xl:px-20", className)} {...props}>
      <Stepper value={currentStepIndex} onValueChange={navigable ? goToStep : undefined}>
        {steps.map(({ title }, index) => {
          const stepNumber = index + 1
          const isLast = stepNumber === steps.length
          return (
            <StepperItem key={stepNumber} step={stepNumber} loading={isLoading} className="relative flex-1 flex-col!">
              <StepperTrigger className="w-full max-w-full flex-col gap-2 rounded-md">
                <StepperIndicator variant={variant} />

                <div className="space-y-0.5 px-1">
                  <StepperTitle>{title}</StepperTitle>
                </div>
              </StepperTrigger>

              {!isLast && (
                <StepperSeparator
                  className={cn(
                    separatorClass,
                    "group-data-[state=completed]/step:bg-(--step-complete)",
                    "group-data-[state=active]/step:bg-(--step-active)"
                  )}
                />
              )}
            </StepperItem>
          )
        })}
      </Stepper>
    </div>
  )
}
const FormFooter = ({ className, ...props }: React.ComponentProps<"div">) => {
  return <div className={cn("flex w-full items-center justify-end gap-3 pt-3", className)} {...props} />
}

const StepFields = ({ className, ...props }: React.ComponentProps<typeof motion.div> & MotionProps) => {
  const { currentStepIndex, steps } = useMultiStepForm()
  const currentFormStep = steps[currentStepIndex - 1]
  if (!currentFormStep || currentStepIndex < 1 || currentStepIndex > steps.length) {
    return null
  }
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.4, type: "spring" }}
          className={cn("w-full max-w-full min-w-0", className)}
          {...props}
        >
          {currentFormStep.component}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}

function MultiStepFormContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex w-full max-w-full min-w-0 flex-col gap-8 pt-3", className)} {...props} />
}

export {
  FormFooter,
  FormHeader,
  MultiStepFormContent,
  // Form Actions
  NextButton,
  PreviousButton,
  ResetButton,
  StepFields,
  SubmitButton,
}
```

### `src/app/(myapp)/_hooks/use-multi-step-viewer.tsx`

```tsx
"use client"
import type { JSX } from "react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

/** 1-based step index clamped to `[1, stepCount]` (or `1` when there are no steps). */
function clampStepIndex(value: number, stepCount: number): number {
  if (stepCount === 0) return 1
  if (value < 1) return 1
  return Math.min(value, stepCount)
}

export interface Stepfields {
  fields: string[]
  component: JSX.Element
  title?: string
  /**
   * TODO.md stepper rule: returns why this step cannot be left yet, or `null`
   * when it is complete. `NextButton` disables itself and shows the message as
   * a tooltip. Optional — a step without it stays freely navigable, so wizards
   * that have not opted in behave exactly as before.
   *
   * Takes the form's live values because the check has to re-run on every
   * keystroke; see `FormValidityWatcher` for why `formState.isValid` cannot
   * answer this.
   */
  blockingMessage?: (values: Record<string, unknown>) => string | null
}

export interface UseMultiFormStepsReturn {
  steps: Stepfields[]
  currentStepIndex: number
  currentStepData: Stepfields
  progress: number
  isFirstStep: boolean
  isLastStep: boolean
  goToNext: () => Promise<boolean>
  goToPrevious: () => void
  goToFirstStep: () => void
  goToStep: (stepNumber: number) => void
  setSteps: (newSteps: Stepfields[]) => void
}

// Context type
interface MultiStepFormContextType extends UseMultiFormStepsReturn {}

// Create context
const MultiStepFormContext = createContext<MultiStepFormContextType | null>(null)

// Provider props
interface MultiStepFormProviderProps {
  children: ReactNode
  stepsFields: Stepfields[]
  onStepValidation?: (step: Stepfields) => Promise<boolean> | boolean
  initialStepIndex?: number
}

// Provider component
export function MultiStepFormProvider({
  children,
  stepsFields,
  onStepValidation,
  initialStepIndex = 1,
}: MultiStepFormProviderProps) {
  const [steps, setStepsState] = useState<Stepfields[]>(stepsFields)
  const [currentStepIndex, setCurrentStepIndex] = useState(() => clampStepIndex(initialStepIndex, stepsFields.length))

  useEffect(() => {
    setStepsState(stepsFields)
  }, [stepsFields])

  useEffect(() => {
    setCurrentStepIndex(clampStepIndex(initialStepIndex, stepsFields.length))
  }, [initialStepIndex, stepsFields.length])

  const goToNext = async () => {
    const currentStepData = steps[currentStepIndex - 1]

    if (onStepValidation) {
      const isValid = await onStepValidation(currentStepData)
      if (!isValid) return false
    }

    if (currentStepIndex < steps.length) {
      setCurrentStepIndex((prev) => prev + 1)
      return true
    }
    return false
  }

  const goToPrevious = () => {
    if (currentStepIndex > 1) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const goToFirstStep = () => {
    setCurrentStepIndex(1)
  }

  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= steps.length) {
      setCurrentStepIndex(stepNumber)
    }
  }

  const setSteps = (newSteps: Stepfields[]) => {
    setStepsState(newSteps)
    // Reset to first step if current step is out of bounds
    if (currentStepIndex > newSteps.length) {
      setCurrentStepIndex(1)
    }
  }

  const value: MultiStepFormContextType = {
    steps,
    currentStepIndex: currentStepIndex,
    currentStepData: steps[currentStepIndex - 1],
    progress: (currentStepIndex / steps.length) * 100,
    isFirstStep: currentStepIndex === 1,
    isLastStep: currentStepIndex === steps.length,
    goToNext,
    goToPrevious,
    goToFirstStep,
    goToStep,
    setSteps,
  }

  return <MultiStepFormContext.Provider value={value}>{children}</MultiStepFormContext.Provider>
}

export function useMultiStepForm(): UseMultiFormStepsReturn {
  const context = useContext(MultiStepFormContext)

  if (!context) {
    throw new Error("useMultiStepForm must be used within a MultiStepFormProvider")
  }

  return context as UseMultiFormStepsReturn
}
```

### `src/app/(myapp)/_components/stepper.tsx`

```tsx
"use client"

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system"
import { Slot } from "@radix-ui/react-slot"
import type React from "react"
import { createContext, useCallback, useContext, useState } from "react"

import { cn } from "@/lib/utils"

// Types
type StepperContextValue = {
  activeStep: number
  setActiveStep: (step: number) => void
  orientation: "horizontal" | "vertical"
}

type StepItemContextValue = {
  step: number
  state: StepState
  isDisabled: boolean
  isLoading: boolean
}

type StepState = "active" | "completed" | "inactive" | "loading"

// Contexts
const StepperContext = createContext<StepperContextValue | undefined>(undefined)

const StepItemContext = createContext<StepItemContextValue | undefined>(undefined)

const useStepper = () => {
  const context = useContext(StepperContext)
  if (!context) {
    throw new Error("useStepper must be used within a Stepper")
  }
  return context
}

const useStepItem = () => {
  const context = useContext(StepItemContext)
  if (!context) {
    throw new Error("useStepItem must be used within a StepperItem")
  }
  return context
}

// Components
interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  orientation?: "horizontal" | "vertical"
}

function Stepper({
  defaultValue = 0,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  ...props
}: StepperProps) {
  const [activeStep, setInternalStep] = useState(defaultValue)

  const setActiveStep = useCallback(
    (step: number) => {
      if (value === undefined) {
        setInternalStep(step)
      }
      onValueChange?.(step)
    },
    [value, onValueChange]
  )

  const currentStep = value ?? activeStep

  return (
    <StepperContext.Provider
      value={{
        activeStep: currentStep,
        orientation,
        setActiveStep,
      }}
    >
      <div
        className={cn(
          "group/stepper inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className
        )}
        data-orientation={orientation}
        data-slot="stepper"
        {...props}
      />
    </StepperContext.Provider>
  )
}

// StepperItem
interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  completed?: boolean
  disabled?: boolean
  loading?: boolean
}

function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper()

  const state: StepState = completed || step < activeStep ? "completed" : activeStep === step ? "active" : "inactive"

  const isLoading = loading && step === activeStep

  return (
    <StepItemContext.Provider value={{ isDisabled: disabled, isLoading, state, step }}>
      <div
        className={cn(
          "group/step flex items-center group-data-[orientation=horizontal]/stepper:flex-row group-data-[orientation=vertical]/stepper:flex-col",
          "not-last:flex-1 max-md:items-start",
          className
        )}
        data-slot="stepper-item"
        data-state={state}
        {...(isLoading ? { "data-loading": true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  )
}

// StepperTrigger
interface StepperTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

function StepperTrigger({ asChild = false, className, children, ...props }: StepperTriggerProps) {
  const { setActiveStep } = useStepper()
  const { step, isDisabled } = useStepItem()

  if (asChild) {
    const Comp = asChild ? Slot : "span"
    return (
      <Comp className={className} data-slot="stepper-trigger">
        {children}
      </Comp>
    )
  }

  return (
    <button
      className={cn(
        "relative z-1 inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "rounded max-md:flex-col",
        className
      )}
      data-slot="stepper-trigger"
      disabled={isDisabled}
      onClick={() => setActiveStep(step)}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

// StepperIndicator
interface StepperIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  variant?: "number" | "ring"
}

function StepperIndicator({
  asChild = false,
  variant = "number",
  className,
  children,
  ...props
}: StepperIndicatorProps) {
  const { state, step, isLoading } = useStepItem()

  return (
    <span
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
        variant === "number"
          ? "size-8 text-xs font-medium data-[state=inactive]:border-muted-foreground/30 data-[state=inactive]:bg-background data-[state=inactive]:text-muted-foreground"
          : "size-5 data-[state=inactive]:border-muted-foreground/30 data-[state=inactive]:bg-background",
        "data-[state=active]:animate-stepper-pulse data-[state=active]:border-(--step-active) data-[state=active]:bg-(--step-active)",
        "data-[state=completed]:border-(--step-complete) data-[state=completed]:bg-(--step-complete)",
        variant === "number" && "data-[state=active]:text-white data-[state=completed]:text-white",
        className
      )}
      data-slot="stepper-indicator"
      data-state={state}
      {...props}
    >
      {variant === "ring" ? null : asChild ? (
        children
      ) : (
        <>
          <span className="transition-all group-data-loading/step:scale-0 group-data-loading/step:opacity-0 group-data-loading/step:transition-none group-data-[state=completed]/step:scale-0 group-data-[state=completed]/step:opacity-0">
            {step}
          </span>
          <IGRPIcon
            iconName="Check"
            className="absolute scale-0 text-white opacity-0 transition-all group-data-[state=completed]/step:scale-100 group-data-[state=completed]/step:opacity-100"
          />
          {isLoading && (
            <span className="absolute transition-all">
              <IGRPIcon iconName="LoaderCircle" className="animate-spin" size={14} />
            </span>
          )}
        </>
      )}
    </span>
  )
}

// StepperTitle
function StepperTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-center text-sm leading-tight font-medium",
        "group-data-[state=inactive]/step:text-muted-foreground",
        "group-data-[state=active]/step:text-(--step-active-text)",
        "group-data-[state=completed]/step:text-(--step-complete-text)",
        className
      )}
      data-slot="stepper-title"
      {...props}
    />
  )
}

// StepperDescription
function StepperDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground max-sm:hidden", className)}
      data-slot="stepper-description"
      {...props}
    />
  )
}

// StepperSeparator
function StepperSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "m-0.5 bg-border group-data-[orientation=horizontal]/stepper:h-px group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=horizontal]/stepper:flex-1 group-data-[orientation=vertical]/stepper:h-12 group-data-[orientation=vertical]/stepper:w-0.5",
        className
      )}
      data-slot="stepper-separator"
      {...props}
    />
  )
}

export { Stepper, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger }
```

### The step tokens it consumes (`src/styles/simple.css`)

Consumed in TSX as `bg-(--step-active)`, `bg-(--step-complete)` and their
`-text` variants. As with §5.4, these exist only because the DS has no
equivalent semantic pair.

```css
:root {
  /* Stepper progress (active / completed). */
  --step-active: var(--color-blue-900);
  --step-active-text: var(--color-blue-900);
  --step-complete: var(--color-emerald-600);
  --step-complete-text: var(--color-emerald-700);
}

.dark {
  --step-active: var(--color-blue-700);
  --step-active-text: var(--color-blue-700);
  --step-complete: var(--color-emerald-500);
  --step-complete-text: var(--color-emerald-600);
}

/* Active-indicator pulse, used as `animate-stepper-pulse` in stepper.tsx. */
@theme inline {
  --animate-stepper-pulse: stepper-pulse 2s ease-in-out infinite;
  @keyframes stepper-pulse {
    0%,
    100% {
      box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.22);
    }
    50% {
      box-shadow: 0 0 0 7px rgba(30, 58, 138, 0.08);
    }
  }
}
```

Note the `rgba()` literals in the keyframes: the pulse could not be expressed
with the tokens available, which is itself an argument for the DS owning this.
