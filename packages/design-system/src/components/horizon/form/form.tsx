/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { type Mode, useForm, type UseFormReturn, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '../../primitives/form';
import { cn } from '../../../lib/utils';
import { IGRPFormContext } from './form-context';

type AnyZod = z.ZodType<any, any, any>;
type InputOf<T extends AnyZod> = z.input<T>;
type OutputOf<T extends AnyZod> = z.output<T>;

type ResetFn<TSchema extends AnyZod> = UseFormReturn<
  InputOf<TSchema>,
  any,
  OutputOf<TSchema>
>['reset'];

export type IGRPFormHandle<TSchema extends AnyZod> = UseFormReturn<
  InputOf<TSchema>,
  any,
  OutputOf<TSchema>
> & {
  submit: () => Promise<void>;
  reset: ResetFn<TSchema>;
  setGlobalError: (message: string) => void;
  clearGlobalError: () => void;
  isSubmitting: boolean;
};

export interface IGRPFormProps<TSchema extends AnyZod> {
  schema: TSchema;
  defaultValues: InputOf<TSchema>;
  validationMode?: Mode;
  onSubmit: (values: OutputOf<TSchema>) => void | Promise<void>;
  resetAfterSubmit?: boolean;
  formRef: React.RefObject<IGRPFormHandle<TSchema> | null>;
  onError?: (error: unknown) => void;
  showToastOnError?: boolean;
  className?: string;
  gridClassName?: string;
  children: React.ReactNode;
  id?: string;
}

function IGRPForm<TSchema extends AnyZod>({
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
  id,
}: IGRPFormProps<TSchema>) {
  const _id = useId();
  const ref = id ?? _id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const internalFormRef = useRef<IGRPFormHandle<TSchema> | null>(null);

  const form = useForm<InputOf<TSchema>, any, OutputOf<TSchema>>({
    resolver: zodResolver(schema) as Resolver<InputOf<TSchema>, any, OutputOf<TSchema>>,
    defaultValues,
    mode: validationMode,
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [form, defaultValues]);

  const clearGlobalError = useCallback(() => setFormError(undefined), []);
  const setGlobalError = useCallback((message: string) => setFormError(message), []);

  const handleSubmit = useCallback(
    async (values: OutputOf<TSchema>) => {
      setIsSubmitting(true);
      clearGlobalError();

      try {
        await onSubmit(values);

        if (resetAfterSubmit) {
          form.reset(defaultValues);
        }
      } catch (err) {
        console.error('Form submission failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

        setGlobalError(errorMessage);

        if (showToastOnError) {
          toast.error('Form Submission Error', { description: errorMessage });
        }

        onError?.(err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      clearGlobalError,
      onSubmit,
      resetAfterSubmit,
      form,
      defaultValues,
      setGlobalError,
      showToastOnError,
      onError,
    ],
  );

  const submitForm = useCallback(
    async () => form.handleSubmit(handleSubmit)(),
    [form, handleSubmit],
  );

  useEffect(() => {
    const handle: IGRPFormHandle<TSchema> = {
      ...form,
      submit: submitForm,
      reset: ((...args) => form.reset(...args)) as ResetFn<TSchema>,
      setGlobalError,
      clearGlobalError,
      isSubmitting,
    };

    if (formRef) {
      formRef.current = handle;
    }
    internalFormRef.current = handle;
  }, [form, submitForm, setGlobalError, clearGlobalError, isSubmitting, formRef]);

  return (
    <IGRPFormContext.Provider value={{ form, isSubmitting, formError }}>
      <Form {...form}>
        <form className={className} onSubmit={form.handleSubmit(handleSubmit)} noValidate id={ref}>
          {formError && (
            <div className="mb-4 p-3 border border-destructive bg-destructive/10 rounded-md text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className={cn('grid gap-4', gridClassName)}>{children}</div>
        </form>
      </Form>
    </IGRPFormContext.Provider>
  );
}

export { IGRPForm };
