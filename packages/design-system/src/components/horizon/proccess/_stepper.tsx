// import { useId } from 'react';

// import { ScrollArea, ScrollBar } from '../../primitives/scroll-area';
// import {
//   Stepper,
//   StepperDescription,
//   StepperIndicator,
//   StepperItem,
//   StepperSeparator,
//   StepperTitle,
//   StepperTrigger,
// } from '../../primitives/stepper';

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
// }

// function IGRPStepperProcess({
//   steps,
//   children,
//   isLoading,
//   currentStep,
//   id,
// }: IGRPStepperProcessProps) {
//   const _id = useId();
//   const ref = id ?? _id;

//   return (
//     <div className="space-y-8 w-full" id={ref}>
//       <div className="flex justify-center">
//         <ScrollArea className="w-[80vw] whitespace-nowrap">
//           <Stepper value={currentStep}>
//             {steps.map(({ step, title, description, isCompleted, isActive }) => (
//               <StepperItem
//                 key={step}
//                 step={step}
//                 completed={isCompleted}
//                 disabled={!isActive}
//                 className="relative flex-1 flex-col! not-last:flex-1"
//                 loading={isLoading}
//               >
//                 <StepperTrigger className="flex-col gap-3 rounded">
//                   <StepperIndicator />
//                   <div className="space-y-0.5 px-2">
//                     <StepperTitle>{title}</StepperTitle>
//                     <StepperDescription className="max-sm:hidden">{description}</StepperDescription>
//                   </div>
//                 </StepperTrigger>
//                 {step < steps.length && (
//                   <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
//                 )}
//               </StepperItem>
//             ))}
//           </Stepper>
//           <ScrollBar orientation="horizontal" />
//         </ScrollArea>
//       </div>
//       {children(currentStep)}
//     </div>
//   );
// }

// export { IGRPStepperProcess, type IGRPStepperProcessProps, type IGRPStepProcessProps };
