'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type Mode, useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/primitives/form';
import { IGRPFormContext } from './form-context';
import { cn } from '@/lib/utils';

type IGRPFormHandle<TSchema extends z.ZodTypeAny> = UseFormReturn<z.infer<TSchema>> & {
  submit: () => Promise<void>;
  reset: (values?: Partial<z.infer<TSchema>>) => void;
  setError: (message: string) => void;
  clearError: () => void;
  isSubmitting: boolean;
};

interface IGRPFormProps<TSchema extends z.ZodType> {
  schema: TSchema;
  defaultValues?: Partial<z.infer<TSchema>>;
  validationMode?: Mode;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  resetAfterSubmit?: boolean;
  formRef: React.RefObject<IGRPFormHandle<TSchema> | null>;
  onError?: (error: unknown) => void;
  showToastOnError?: boolean;
  className?: string;
  gridClassName?: string;
  children: React.ReactNode;
}

function IGRPForm<TSchema extends z.ZodType>({
  schema,
  defaultValues,
  validationMode = 'onSubmit',
  onSubmit,
  resetAfterSubmit = false,
  formRef,
  onError,
  showToastOnError = false,
  className,
  gridClassName,
  children,
}: IGRPFormProps<TSchema>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const internalFormRef = useRef<IGRPFormHandle<TSchema> | null>(null);

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as never,
    mode: validationMode,
  });

  useEffect(() => {
    if (defaultValues) {
      console.log({ defaultValues });
      form.reset(defaultValues as never);
    }
  }, [form, defaultValues]);

  const clearError = useCallback(() => {
    setFormError(undefined);
  }, []);

  const setError = useCallback((message: string) => {
    setFormError(message);
  }, []);

  const handleSubmit = useCallback(
    async (values: z.infer<TSchema>) => {
      setIsSubmitting(true);
      clearError();

      try {
        await onSubmit(values);
        if (resetAfterSubmit) {
          form.reset(defaultValues as never);
        }
      } catch (err) {
        console.error('Form submission failed:', err);

        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

        setError(errorMessage);

        if (showToastOnError) {
          toast.error('Form Submission Error', {
            description: errorMessage,
          });
        }

        onError?.(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      onSubmit,
      resetAfterSubmit,
      defaultValues,
      form,
      clearError,
      setError,
      showToastOnError,
      onError,
    ],
  );

  const submitForm = useCallback(async () => {
    return form.handleSubmit(handleSubmit)();
  }, [form, handleSubmit]);

  useEffect(() => {
    const formHandle: IGRPFormHandle<TSchema> = {
      ...form,
      submit: submitForm,
      reset: (values) => form.reset(values as never),
      setError,
      clearError,
      isSubmitting,
    };

    if (formRef) {
      formRef.current = formHandle;
    }
    internalFormRef.current = formHandle;
  }, [form, submitForm, setError, clearError, isSubmitting, formRef]);

  return (
    <IGRPFormContext.Provider value={{ form, isSubmitting, formError }}>
      <Form {...form}>
        <form
          className={className}
          onSubmit={handleSubmit}
          noValidate
        >
          {formError && (
            <div className='mb-4 p-3 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm'>
              {formError}
            </div>
          )}
          <div className={cn('grid gap-4', gridClassName)}>{children}</div>
        </form>
      </Form>
    </IGRPFormContext.Provider>
  );
}

export { IGRPForm, type IGRPFormProps, type IGRPFormHandle };
