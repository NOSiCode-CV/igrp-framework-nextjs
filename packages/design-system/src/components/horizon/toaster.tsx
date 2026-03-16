'use client';

import { toast, type ExternalToast } from 'sonner';
import { useCallback, useMemo } from 'react';
import { Toaster } from '../primitives/sonner';

/** Default duration (ms) for success toasts. */
const DEFAULT_SUCCESS_DURATION = 4000;
/** Default duration (ms) for error toasts (longer so user can read). */
const DEFAULT_ERROR_DURATION = 6000;

/** Toast type variants. */
type IGRPToastKind = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';

/** Module-scope map for toast type dispatch (avoids allocation per call). */
const TOAST_TYPE_MAP = {
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warning: toast.warning,
  loading: toast.loading,
  default: toast,
} as const;

/**
 * Toast container. Place once in the app layout.
 */
function IGRPToaster(props: React.ComponentProps<typeof Toaster>) {
  return <Toaster {...props} />;
}

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

type ToastProps<T> = IGRPPromiseToastProps<T> | PlainToastProps;

function createToast<T>(props: IGRPPromiseToastProps<T>): string | number;
function createToast(props: PlainToastProps): string | number;
function createToast<T>(props: ToastProps<T>): string | number {
  if ('promise' in props && props.promise) {
    const { promise, loading, success, error, ...rest } = props;
    const id = toast.promise(promise, {
      loading: loading ?? 'Processing...',
      success:
        success ?? ((data: T) => (typeof data === 'string' ? data : 'Operation successful!')),
      error:
        error ?? ((err: unknown) => (err instanceof Error ? err.message : 'Something went wrong!')),
      duration: rest.duration ?? DEFAULT_SUCCESS_DURATION,
      ...rest,
    });
    return id as string | number;
  }

  const { type = 'default', title, description, content, ...rest } = props as PlainToastProps;

  if (content) return toast(content, rest);

  const duration =
    rest.duration ??
    (type === 'error'
      ? DEFAULT_ERROR_DURATION
      : type === 'success'
        ? DEFAULT_SUCCESS_DURATION
        : undefined);

  const fn = TOAST_TYPE_MAP[type] ?? toast;
  return fn(title ?? 'Notification', { description, duration, ...rest });
}

function useIGRPToast<T = unknown>() {
  const igrpToast = useCallback(
    (props: ToastProps<T>) =>
      'promise' in props && props.promise
        ? createToast(props as IGRPPromiseToastProps<T>)
        : createToast(props as PlainToastProps),
    [],
  );

  const helpers = useMemo(
    () => ({
      success: (msg: React.ReactNode, opts?: ExternalToast) =>
        toast.success(msg, { duration: DEFAULT_SUCCESS_DURATION, ...opts }),
      error: (msg: React.ReactNode, opts?: ExternalToast) =>
        toast.error(msg, { duration: DEFAULT_ERROR_DURATION, ...opts }),
      info: (msg: React.ReactNode, opts?: ExternalToast) => toast.info(msg, opts),
      warning: (msg: React.ReactNode, opts?: ExternalToast) => toast.warning(msg, opts),
      loading: (msg: React.ReactNode, opts?: ExternalToast) => toast.loading(msg, opts),
      dismiss: toast.dismiss,
    }),
    [],
  );

  return useMemo(() => ({ igrpToast, ...helpers }), [igrpToast, helpers]);
}

export {
  type IGRPPromiseToastProps,
  type PlainToastProps,
  // eslint-disable-next-line react-refresh/only-export-components
  useIGRPToast,
  IGRPToaster,
};
