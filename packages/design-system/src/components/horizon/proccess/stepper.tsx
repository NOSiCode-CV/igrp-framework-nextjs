'use client';

import { useCallback, useId, useMemo } from 'react';
import type React from 'react';
import { CheckIcon } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { ScrollArea, ScrollBar } from '../../primitives/scroll-area';
import { Stepper, StepperItem, StepperTitle, StepperTrigger } from '../../primitives/stepper';
import { Button } from '../../primitives/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../primitives/tooltip';

interface IGRPStepProcessProps {
  step: number;
  stepKey: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface IGRPStepperProcessProps {
  steps: IGRPStepProcessProps[];
  isLoading?: boolean;
  currentStep: number;
  children: (step: number) => React.ReactNode;
  id?: string;
  onStepChange?: (step: number, stepData: IGRPStepProcessProps) => void;
}

// TODO: add button next and previous to the stepper

function getStepperItemClassName(): string {
  return cn(
    'group/step relative text-center overflow-visible ml-1.5 mr-1.75 items-center justify-center max-md:items-start',
    // First child styles
    'first:ml-0 first:rounded-tl-2xl first:rounded-bl-2xl first:pl-2.5',
    // Last child styles
    'last:mr-0 last:rounded-tr-2xl last:rounded-br-2xl last:pr-2.5',
    //'last:mr-0 last:rounded-tr-2xl last:rounded-br-2xl last:pr-2.5 last:overflow-hidden',
    'bg-muted text-gray-600',
    // Completed state background
    'data-[state=completed]:bg-process-completed data-[state=completed]:text-background',
    // Active state background
    'data-[state=active]:bg-process-active data-[state=active]:text-background',
    // Incomplete/inactive state background
    'data-[state=inactive]:bg-muted data-[state=inactive]:text-gray-600',
    // Pseudo-elements base styles
    'before:content-[""] before:absolute before:-left-1 before:-right-1.25 before:cursor-pointer',
    'after:content-[""] after:absolute after:-left-1 after:-right-1.25 after:cursor-pointer',
    // Before pseudo-element
    'before:top-0 before:h-4.25 before:skew-x-28 before:translate-z-0',
    // After pseudo-element
    'after:bottom-0 after:h-4 after:-skew-x-30 after:translate-z-0',
    // First child pseudo-element positioning
    'first:before:left-4.5 first:after:left-4.5',
    // Last child - clip pseudo-elements at right edge
    'last:before:right-4.5 last:after:right-4.5',
    // Inactive state backgrounds for pseudo-elements
    'data-[state=inactive]:before:bg-muted',
    'data-[state=inactive]:after:bg-muted',
    // Completed state backgrounds for pseudo-elements
    'data-[state=completed]:before:bg-process-completed',
    'data-[state=completed]:after:bg-process-completed',
    // Active state backgrounds for pseudo-elements
    'data-[state=active]:before:bg-process-active',
    'data-[state=active]:after:bg-process-active',
  );
}

function IGRPStepperProcess({
  steps,
  children,
  isLoading,
  currentStep,
  id,
  onStepChange,
}: IGRPStepperProcessProps) {
  const _id = useId();
  const ref = id ?? _id;

  // Validate currentStep - find matching step by step property, or use first active step, or first step
  const validCurrentStep = useMemo(() => {
    if (steps.length === 0) return 0;

    // Try to find a step that matches currentStep by its step property
    const matchingStep = steps.find((s) => s.step === currentStep);
    if (matchingStep) {
      return matchingStep.step;
    }

    // If no match, try to find the first active step
    const activeStep = steps.find((s) => s.isActive);
    if (activeStep) {
      return activeStep.step;
    }

    // Fallback to first step's step value
    return steps[0]?.step ?? 0;
  }, [currentStep, steps]);

  const handleStepChange = useCallback(
    (step: number) => {
      const stepData = steps.find((s) => s.step === step);
      if (stepData) {
        onStepChange?.(step, stepData);
      }
    },
    [steps, onStepChange],
  );

  // Early return if no steps
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 w-full" id={ref}>
      <div className="flex justify-center">
        <ScrollArea className="w-[80vw]">
          <Stepper
            value={validCurrentStep}
            onValueChange={handleStepChange}
            className="mb-4 gap-0.5 justify-center"
            role="navigation"
            aria-label="Process steps"
            aria-valuenow={validCurrentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
          >
            {steps.map(({ step, stepKey, title, isCompleted, isActive }) => (
              <StepperItem
                key={stepKey ?? step}
                step={step}
                completed={isCompleted}
                disabled={!isActive}
                aria-current={isActive ? 'step' : undefined}
                className={getStepperItemClassName()}
                loading={isLoading && validCurrentStep === step}
              >
                <StepperTrigger
                  asChild
                  className="gap-1 rounded max-md:flex-col z-10 cursor-pointer"
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      'bg-transparent hover:bg-transparent text-center flex items-center justify-center',
                      'shadow-none text-xs w-37.5',
                    )}
                    size="xs"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {isCompleted ? (
                          <span className="flex items-center justify-center gap-2 w-full min-w-0">
                            <CheckIcon
                              className="text-background stroke-[2.5] group-hover/step:hidden shrink-0"
                              aria-hidden="true"
                            />
                            <StepperTitle className="text-background hidden group-hover/step:block truncate min-w-0">
                              {title}
                            </StepperTitle>
                          </span>
                        ) : (
                          <span className="w-full min-w-0">
                            <StepperTitle
                              className={cn(
                                'truncate w-full min-w-0',
                                isActive && 'text-background',
                              )}
                            >
                              {title}
                            </StepperTitle>
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{title}</TooltipContent>
                    </Tooltip>
                  </Button>
                </StepperTrigger>
              </StepperItem>
            ))}
          </Stepper>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      {children(validCurrentStep)}
    </div>
  );
}

export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps };
