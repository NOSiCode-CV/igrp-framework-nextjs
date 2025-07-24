import { createContext, useContext } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

type IGRPFormContextValue<TSchema extends z.ZodType> = {
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  formError?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IGRPFormContext = createContext<IGRPFormContextValue<any> | null>(null);

function useIGRPFormContext<TSchema extends z.ZodType>() {
  const context = useContext(IGRPFormContext);

  if (!context) {
    throw new Error('useIGRPFormContext must be used within a FormProvider');
  }

  return context as IGRPFormContextValue<TSchema>;
}

// eslint-disable-next-line react-refresh/only-export-components
export { type IGRPFormContextValue, useIGRPFormContext, IGRPFormContext };
