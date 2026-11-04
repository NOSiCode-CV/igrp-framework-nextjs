---
"@igrp/igrp-framework-react-design-system": patch
---

New `IGRPMultiStepForm` wizard with `IGRPMultiStepFormHeader`, `IGRPMultiStepFormSteps`, `IGRPMultiStepFormFooter`, `IGRPMultiStepFormPrevious`, `IGRPMultiStepFormNext`, `IGRPMultiStepFormSubmit` and `useIGRPMultiStepForm`. A step cannot be left until it validates: `onStepValidation`, or inside `IGRPForm` the default `form.trigger(step.fields)` followed by clearing errors on fields outside the step (outside a form it resolves true). `blockingMessage` disables Next and shows why; it requires an `IGRPForm` ancestor. Transitions are CSS under `motion-safe`; there is no `motion` dependency.

`StepperIndicator` takes an opt-in `variant` (`ring` or `number`); without it the indicator is unchanged in size. Completed steps now use the `step-complete` token (aliases `success`), so completed steps in existing `IGRPStepperProcess` change from the primary to the success colour.
