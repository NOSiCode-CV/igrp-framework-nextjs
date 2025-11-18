import { useId } from 'react';
import { CheckIcon } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { ScrollArea, ScrollBar } from '../../primitives/scroll-area';
import {
  Stepper,
  // StepperDescription,
  // StepperIndicator,
  StepperItem,
  // StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '../../primitives/stepper';
import { Button } from '../../primitives/button';

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

  const handleStepChange = (step: number) => {
    const stepData = steps.find((s) => s.step === step);
    if (stepData) {
      onStepChange?.(step, stepData);
    }
  };

  return (
    <div className="space-y-8 w-full" id={ref}>
      <div className="flex justify-center">
        <ScrollArea className="w-[90vw] whitespace-nowrap">
          <Stepper
            value={currentStep}
            onValueChange={handleStepChange}
            className="mb-4 gap-0.5"
            role="navigation"
            aria-label="Process steps"
          >
            {steps.map(({ step, stepKey, title, isCompleted, isActive }) => (
              <StepperItem
                key={stepKey ?? step}
                step={step}
                completed={isCompleted}
                disabled={!isActive}
                className={cn(
                  // Base styles from .slds-path__item
                  'group/step relative flex-1 text-center overflow-visible ml-1.5 mr-1.75',
                  // First child styles from .slds-path__item:first-child
                  'first:ml-0 first:rounded-tl-2xl first:rounded-bl-2xl first:pl-2.5',
                  // Last child styles from .slds-path__item:last-child
                  'last:mr-0 last:rounded-tr-2xl last:rounded-br-2xl last:pr-2.5 last:overflow-hidden',
                  'bg-muted text-gray-600',
                  // Completed state background from .slds-path__item.slds-is-complete
                  'data-[state=completed]:bg-process-completed data-[state=completed]:text-background',
                  // Active state background from .slds-path__item.slds-is-active
                  'data-[state=active]:bg-process-active data-[state=active]:text-background',
                  // Incomplete/inactive state background from .slds-path__item.slds-is-incomplete
                  'data-[state=inactive]:bg-muted data-[state=inactive]:text-gray-600',
                  // Pseudo-elements base styles from .slds-path__item:after, .slds-path__item:before
                  // left: -.25rem, right: -.3125rem
                  'before:content-[""] before:absolute before:-left-1 before:-right-1.25 before:cursor-pointer',
                  'after:content-[""] after:absolute after:-left-1 after:-right-1.25 after:cursor-pointer',
                  // Before pseudo-element from .slds-path__item:before
                  // top: 0, height: 1.0625rem, transform: skew(28deg) translateZ(0)
                  'before:top-0 before:h-4.25 before:skew-x-28 before:translate-z-0',
                  // After pseudo-element from .slds-path__item:after
                  // bottom: 0, height: 1rem, transform: skew(-30deg) translateZ(0)
                  'after:bottom-0 after:h-4 after:-skew-x-30 after:translate-z-0',
                  // First child pseudo-element positioning from .slds-path__item:first-child:after, .slds-path__item:first-child:before
                  // left: 1.125rem
                  'first:before:left-4.5 first:after:left-4.5',
                  // Last child - clip pseudo-elements at right edge (left side still receives chevron, right side is rounded)
                  'last:before:right-0 last:after:right-0',
                  // Completed state backgrounds for pseudo-elements
                  'data-[state=completed]:before:bg-process-completed',
                  'data-[state=completed]:after:bg-process-completed',
                  // Active state backgrounds for pseudo-elements
                  'data-[state=active]:before:bg-process-active',
                  'data-[state=active]:after:bg-process-active',
                  // Inactive state backgrounds for pseudo-elements
                  'data-[state=inactive]:before:bg-muted',
                  'data-[state=inactive]:after:bg-muted',
                  // Responsive adjustments
                  'max-md:items-start justify-center',
                )}
                loading={isLoading && currentStep === step}
              >
                <StepperTrigger asChild className="gap-1 rounded max-md:flex-col z-10">
                  <Button
                    variant="ghost"
                    className={cn(
                      'bg-transparent hover:bg-transparent text-center truncate',
                      'shadow-none text-xs',
                    )}
                    size="xs"
                  >
                    {isCompleted ? (
                      <span className="flex items-center gap-2">
                        <CheckIcon
                          className="text-background stroke-[2.5] group-hover/step:hidden"
                          aria-hidden="true"
                        />
                        <StepperTitle className="text-background hidden group-hover/step:block">
                          {title}
                        </StepperTitle>
                      </span>
                    ) : (
                      <StepperTitle className={cn(isActive && 'text-background')}>
                        {title}
                      </StepperTitle>
                    )}
                  </Button>
                </StepperTrigger>
              </StepperItem>
            ))}
          </Stepper>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      {children(currentStep)}
    </div>
  );
}

export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps };
