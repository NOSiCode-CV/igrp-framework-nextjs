"use client"

import { useContext, useEffect } from "react"
import { useWatch } from "react-hook-form"

import { useIGRPi18n } from "../../../i18n/index.js"
import { cn } from "../cn.js"
import { IGRPButton, type IGRPButtonProps } from "../button.js"
import { IGRPTooltip } from "../tooltip.js"
import { IGRPMultiStepFormBlockingContext, useIGRPMultiStepForm } from "./context.js"

/** Right-aligned row for the wizard's navigation buttons. */
function IGRPMultiStepFormFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="multi-step-form-footer"
      className={cn("flex w-full items-center justify-end gap-3 pt-3", className)}
    />
  )
}

/** Goes back one step. Hidden on the first step. */
function IGRPMultiStepFormPrevious({ children, onClick, ...props }: IGRPButtonProps) {
  const { isFirstStep, goToPrevious } = useIGRPMultiStepForm()
  const i18n = useIGRPi18n()
  if (isFirstStep) return null
  return (
    <IGRPButton
      type="button"
      variant="outline"
      showIcon
      iconName="ChevronLeft"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) goToPrevious()
      }}
    >
      {children ?? i18n.multiStepForm.previous}
    </IGRPButton>
  )
}

function nextButtonProps({ children, onClick, ...props }: IGRPButtonProps, label: string, go: () => unknown) {
  return {
    type: "button" as const,
    showIcon: true,
    iconName: "ChevronRight" as const,
    iconPlacement: "end" as const,
    ...props,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (!event.defaultPrevented) void go()
    },
    children: children ?? label,
  }
}

/** The only wizard part that watches form values, so wizards without blockingMessage need no form. */
function BlockedNext({
  blockingMessage,
  buttonProps,
}: {
  blockingMessage: (values: Record<string, unknown>) => string | null
  buttonProps: ReturnType<typeof nextButtonProps>
}) {
  const message = blockingMessage(useWatch() as Record<string, unknown>)
  const blocking = useContext(IGRPMultiStepFormBlockingContext)
  const report = blocking?.report
  useEffect(() => {
    report?.(message)
    return () => report?.(null)
  }, [message, report])
  return (
    <IGRPTooltip label={message ?? undefined} disabled={Boolean(message)}>
      <IGRPButton {...buttonProps} disabled={Boolean(message) || buttonProps.disabled} />
    </IGRPTooltip>
  )
}

/** Validates and goes to the next step. Hidden on the last step. */
function IGRPMultiStepFormNext(props: IGRPButtonProps) {
  const { isLastStep, currentStepData, goToNext } = useIGRPMultiStepForm()
  const i18n = useIGRPi18n()
  if (isLastStep) return null
  const buttonProps = nextButtonProps(props, i18n.multiStepForm.next, goToNext)
  if (currentStepData?.blockingMessage) {
    return <BlockedNext blockingMessage={currentStepData.blockingMessage} buttonProps={buttonProps} />
  }
  return <IGRPButton {...buttonProps} />
}

/** Submits the enclosing form. Shown only on the last step. */
function IGRPMultiStepFormSubmit({ children, ...props }: IGRPButtonProps) {
  const { isLastStep } = useIGRPMultiStepForm()
  const i18n = useIGRPi18n()
  if (!isLastStep) return null
  return (
    <IGRPButton type="submit" {...props}>
      {children ?? i18n.multiStepForm.submit}
    </IGRPButton>
  )
}

export { IGRPMultiStepFormFooter, IGRPMultiStepFormPrevious, IGRPMultiStepFormNext, IGRPMultiStepFormSubmit }
