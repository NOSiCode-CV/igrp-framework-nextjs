'use client';

import { toast, type ExternalToast } from 'sonner';
import { useCallback, useMemo } from 'react';
import { Toaster } from '../primitives/sonner';

/**
 * Toast container. Place once in the app layout.
 */
function IGRPToaster(props: React.ComponentProps<typeof Toaster>) {
  return <Toaster {...props} />;
}

/** Toast type variants. */
type IGRPToastKind = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';

/**
 * Common props for all toast types.
 * @see useIGRPToast
 */
type IGRPCommonToastProps = ExternalToast & {
  /** Toast type. */
  type?: IGRPToastKind;
  /** Toast title. */
  title?: React.ReactNode;
  /** Toast description. */
  description?: React.ReactNode;
  /** Raw content (overrides title/description). */
  content?: React.ReactNode;
};

/**
 * Props for promise-based toasts.
 * @see useIGRPToast
 */
type IGRPPromiseToastProps<T> = IGRPCommonToastProps & {
  /** Promise to track. */
  promise: Promise<T>;
  /** Loading message. */
  loading?: React.ReactNode;
  /** Success message or render function. */
  success?: React.ReactNode | ((data: T) => React.ReactNode);
  /** Error message or render function. */
  error?: React.ReactNode | ((err: unknown) => React.ReactNode);
};

/**
 * Props for plain toasts (no promise).
 * @see useIGRPToast
 */
type PlainToastProps = IGRPCommonToastProps & {
  promise?: never;
  loading?: never;
  success?: never;
  error?: never;
};

function createToast<T>(props: IGRPPromiseToastProps<T>): string | number;
function createToast(props: PlainToastProps): string | number;

function createToast<T>(props: IGRPPromiseToastProps<T> | PlainToastProps) {
  if ('promise' in props && props.promise) {
    const { promise, loading, success, error, ...rest } = props;
    return toast.promise(promise, {
      loading: loading ?? 'Processing...',
      success:
        success ?? ((data: T) => (typeof data === 'string' ? data : 'Operation successful!')),
      error:
        error ?? ((err: unknown) => (err instanceof Error ? err.message : 'Something went wrong!')),
      ...rest,
    });
  }

  const { type = 'default', title, description, content, ...rest } = props as PlainToastProps;

  if (content) return toast(content, rest);

  const map = {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    loading: toast.loading,
    default: toast,
  } as const;

  const fn = map[type] ?? toast;
  return fn(title ?? 'Notification', { description, ...rest });
}

function useIGRPToast<T = unknown>() {
  const igrpToast = useCallback(
    (props: IGRPPromiseToastProps<T> | PlainToastProps) => createToast<T>(props as any),
    [],
  );

  const helpers = useMemo(() => {
    return {
      success: (msg: React.ReactNode, opts?: ExternalToast) => toast.success(msg, opts),
      error: (msg: React.ReactNode, opts?: ExternalToast) => toast.error(msg, opts),
      info: (msg: React.ReactNode, opts?: ExternalToast) => toast.info(msg, opts),
      warning: (msg: React.ReactNode, opts?: ExternalToast) => toast.warning(msg, opts),
      loading: (msg: React.ReactNode, opts?: ExternalToast) => toast.loading(msg, opts),
      dismiss: toast.dismiss,
    };
  }, []);

  return { igrpToast, ...helpers };
}

export { type IGRPPromiseToastProps, type PlainToastProps, useIGRPToast, IGRPToaster };
