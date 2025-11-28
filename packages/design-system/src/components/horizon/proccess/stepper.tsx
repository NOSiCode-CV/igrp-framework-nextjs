'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { CheckIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { ScrollArea } from '../../primitives/scroll-area';
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
  stepperClassName?: string;
  stepperItemsClassName?: string;
}

function getStepperItemClassName(): string {
  return cn(
    'group/step relative flex-1 text-center overflow-visible ml-1.5 mr-1.75 items-center justify-center max-md:items-start',
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
  stepperClassName,
  stepperItemsClassName,
}: IGRPStepperProcessProps) {
  const _id = useId();
  const ref = id ?? _id;
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const validCurrentStep = useMemo(() => {
    if (steps.length === 0) return 0;

    const matchingStep = steps.find((s) => s.step === currentStep);
    if (matchingStep) {
      return matchingStep.step;
    }

    const activeStep = steps.find((s) => s.isActive);
    if (activeStep) {
      return activeStep.step;
    }

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

  const checkScrollPosition = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = viewport;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const scrollLeft = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const scrollAmount = viewport.clientWidth * 0.8;
    viewport.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const scrollAmount = viewport.clientWidth * 0.8;
    viewport.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport) {
      scrollViewportRef.current = viewport;
      checkScrollPosition();

      viewport.addEventListener('scroll', checkScrollPosition);
      const resizeObserver = new ResizeObserver(checkScrollPosition);
      resizeObserver.observe(viewport);

      return () => {
        viewport.removeEventListener('scroll', checkScrollPosition);
        resizeObserver.disconnect();
      };
    }
  }, [checkScrollPosition, steps.length]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 w-full" id={ref}>
      <div className="flex items-center justify-center gap-4 relative">
        <div ref={scrollAreaRef} className="w-[90vw]">
          <ScrollArea className="w-full">
            <Stepper
              value={validCurrentStep}
              onValueChange={handleStepChange}
              className={cn('gap-0.5', stepperClassName)}
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
                  className={cn(getStepperItemClassName(), stepperItemsClassName)}
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
                        'shadow-none text-[10px] w-34',
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
                                  isActive && 'text-background hover:text-background',
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
          </ScrollArea>
        </div>

        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="size-6 shrink-0 mb-3"
            onClick={scrollLeft}
            aria-label="Scroll to previous steps"
            type="button"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="size-3" aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            className="size-6 shrink-0 mb-3"
            onClick={scrollRight}
            aria-label="Scroll to next steps"
            type="button"
            disabled={!canScrollRight}
          >
            <ChevronRight className="size-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {children(validCurrentStep)}
    </div>
  );
}

export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps };
