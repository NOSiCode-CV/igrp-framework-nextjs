---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPMultiStepForm` wizard with `IGRPMultiStepFormHeader`, `IGRPMultiStepFormSteps`, `IGRPMultiStepFormFooter`, `IGRPMultiStepFormPrevious`, `IGRPMultiStepFormNext`, `IGRPMultiStepFormSubmit` and `useIGRPMultiStepForm`. A step cannot be left until it validates: `onStepValidation`, or inside `IGRPForm` the default `form.trigger(step.fields)` followed by clearing errors on fields outside the step (outside a form it resolves true). A step's optional `description` renders under its title in the header. `blockingMessage` disables Next and shows why; it requires an `IGRPForm` ancestor. Transitions are CSS under `motion-safe`; there is no `motion` dependency.

`StepperIndicator` takes an opt-in `variant` (`ring` or `number`); without it the indicator is unchanged in size. `IGRPStepperProcess` does not use these primitives and is unchanged. Apps that render the exported `StepperIndicator` and `StepperSeparator` directly see three changes: completed steps move from the primary to the success colour (`step-complete` token), the separator after the active step turns `bg-step-active` instead of muted, and the active indicator's text uses `step-active-foreground` instead of `muted-foreground`.
