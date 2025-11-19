// import { useEffect, useId, useState } from 'react';
// import { CheckIcon, LoaderCircleIcon } from 'lucide-react';

// import { cn } from '../../../lib/utils';
// import { ScrollArea, ScrollBar } from '../../primitives/scroll-area';

// interface IGRPStepProcessProps {
//   step: number;
//   stepKey: string;
//   title: string;
//   description: string;
//   isCompleted: boolean;
//   isActive: boolean;
// }

// interface IGRPStepperProcessProps {
//   steps: IGRPStepProcessProps[];
//   isLoading?: boolean;
//   currentStep: number;
//   children: (step: number) => React.ReactNode;
//   id?: string;
//   onStepChange?: (step: number, stepData: IGRPStepProcessProps) => void;
// }

// type StepVisualState = 'completed' | 'current' | 'upcoming';

// const STEP_STATE_CLASSES: Record<StepVisualState, string> = {
//   completed: 'bg-emerald-500 text-white',
//   current: 'bg-blue-700 text-white',
//   upcoming: 'bg-gray-200 text-gray-600',
// };

// const NEXT_STEP_HIGHLIGHT =
//   'bg-gray-300 text-gray-700';

// function IGRPStepperProcess({
//   steps,
//   children,
//   isLoading,
//   currentStep,
//   id,
//   onStepChange,
// }: IGRPStepperProcessProps) {
//   const _id = useId();
//   const ref = id ?? _id;
//   const hasSteps = steps.length > 0;
//   const firstStep = hasSteps ? steps[0]!.step : currentStep;
//   const hasExactCurrent = hasSteps && steps.some(({ step }) => step === currentStep);
//   const normalizedCurrentStep = hasExactCurrent ? currentStep : firstStep;
//   const [selectedStep, setSelectedStep] = useState<number>(normalizedCurrentStep);

//   useEffect(() => {
//     setSelectedStep((prev) => (prev === normalizedCurrentStep ? prev : normalizedCurrentStep));
//   }, [normalizedCurrentStep]);

//   useEffect(() => {
//     const hasSelected = steps.some(({ step }) => step === selectedStep);
//     if (hasSelected) {
//       return;
//     }

//     setSelectedStep((prev) => (prev === normalizedCurrentStep ? prev : normalizedCurrentStep));
//   }, [steps, selectedStep, normalizedCurrentStep]);

//   if (!hasSteps) {
//     return (
//       <div className="space-y-8 w-full" id={ref}>
//         {children(selectedStep)}
//       </div>
//     );
//   }

//   const currentIndex = steps.findIndex(({ step }) => step === normalizedCurrentStep);
//   const resolvedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
//   const defaultNextIndex = resolvedCurrentIndex + 1 < steps.length ? resolvedCurrentIndex + 1 : -1;
//   const nextIndexFromData = steps.findIndex(
//     (stepItem, index) =>
//       index > resolvedCurrentIndex &&
//       !(stepItem.isCompleted || stepItem.step < normalizedCurrentStep),
//   );
//   const resolvedNextIndex = nextIndexFromData === -1 ? defaultNextIndex : nextIndexFromData;

//   const handleStepSelect = (stepData: IGRPStepProcessProps) => {
//     if (stepData.step === selectedStep) {
//       return;
//     }

//     setSelectedStep(stepData.step);
//     onStepChange?.(stepData.step, stepData);
//   };

//   return (
//     <div className="flex flex-col gap-8 w-full" id={ref}>
//       <div className="flex justify-center">
//         <ScrollArea className="w-[90vw] max-w-full whitespace-nowrap">
//           <div className="w-full min-w-full">
//             <div
//               role="list"
//               aria-label="Process steps"
//               className="flex min-w-full items-stretch gap-1 rounded-full bg-gray-100/60 p-1 shadow-inner ring-1 ring-gray-200/60"
//             >
//               {steps.map((stepData, index) => {
//                 const state = resolveStepState(
//                   stepData,
//                   normalizedCurrentStep,
//                   index,
//                   resolvedCurrentIndex,
//                 );
//                 const isNext =
//                   state === 'upcoming' && resolvedNextIndex === index && resolvedNextIndex !== -1;

//                 return (
//                   <ProcessStepItem
//                     key={stepData.stepKey ?? stepData.step}
//                     {...stepData}
//                     state={state}
//                     isFirst={index === 0}
//                     isLast={index === steps.length - 1}
//                     isNext={isNext}
//                     showLoader={Boolean(isLoading && state === 'current')}
//                     isSelected={stepData.step === selectedStep}
//                     onSelect={() => handleStepSelect(stepData)}
//                   />
//                 );
//               })}
//             </div>
//           </div>
//           <ScrollBar orientation="horizontal" className="mt-2" />
//         </ScrollArea>
//       </div>
//       {children(selectedStep)}
//     </div>
//   );
// }

// interface ProcessStepItemProps extends IGRPStepProcessProps {
//   state: StepVisualState;
//   isFirst: boolean;
//   isLast: boolean;
//   isNext: boolean;
//   showLoader: boolean;
//   isSelected: boolean;
//   onSelect: () => void;
// }

// function ProcessStepItem({
//   title,
//   step,
//   state,
//   isFirst,
//   isLast,
//   isNext,
//   isCompleted,
//   isActive,
//   showLoader,
//   isSelected,
//   onSelect,
// }: ProcessStepItemProps) {
//   const stateClasses =
//     state === 'upcoming' && isNext ? NEXT_STEP_HIGHLIGHT : STEP_STATE_CLASSES[state];

//   const baseClasses = cn(
//     'group relative isolate flex basis-0 flex-1 items-center justify-center gap-2 border-none px-4 py-3 text-[0.65rem] font-semibold uppercase tracking-wide transition-all duration-200 sm:px-6 sm:text-xs',
//     'min-w-[6.5rem] sm:min-w-[8rem]',
//     'cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 focus-visible:ring-blue-600',
//     stateClasses,
//     isFirst ? 'rounded-s-full pl-6' : 'pl-8',
//     isLast ? 'rounded-e-full pr-6' : 'pr-8',
//     !isActive && state === 'upcoming' && 'opacity-60',
//     'data-[selected]:ring-2 data-[selected]:ring-offset-2 data-[selected]:ring-offset-gray-100 data-[selected]:ring-blue-500',
//   );

//   const content = (
//     <button
//       type="button"
//       role="listitem"
//       onClick={onSelect}
//       className={baseClasses}
//       data-state={state}
//       data-next={isNext ? '' : undefined}
//       data-step={step}
//       data-completed={isCompleted ? '' : undefined}
//       data-selected={isSelected ? '' : undefined}
//       aria-current={isSelected ? 'step' : undefined}
//       aria-label={`${title} step${state === 'completed' ? ' completed' : ''}`}
//     >
//       {state === 'completed' ? (
//         <>
//           <CheckIcon
//             aria-hidden="true"
//             className="size-5 stroke-[2.5] transition-opacity duration-200 group-hover:opacity-0"
//           />
//           <span className="pointer-events-none absolute inset-x-2 truncate text-center text-[0.65rem] uppercase tracking-wide opacity-0 transition-opacity duration-200 group-hover:opacity-100">
//             {title}
//           </span>
//         </>
//       ) : (
//         <span className="truncate">{title}</span>
//       )}
//       {showLoader && (
//         <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin text-current" />
//       )}
//     </button>
//   );

//   return content;
// }

// function resolveStepState(
//   stepData: IGRPStepProcessProps,
//   normalizedCurrentStep: number,
//   index: number,
//   resolvedCurrentIndex: number,
// ): StepVisualState {
//   if (
//     stepData.isCompleted ||
//     stepData.step < normalizedCurrentStep ||
//     index < resolvedCurrentIndex
//   ) {
//     return 'completed';
//   }

//   if (stepData.step === normalizedCurrentStep || index === resolvedCurrentIndex) {
//     return 'current';
//   }

//   return 'upcoming';
// }

// export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps };
