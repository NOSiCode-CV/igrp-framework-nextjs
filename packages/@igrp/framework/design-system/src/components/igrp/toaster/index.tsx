import { toast, type ExternalToast } from 'sonner';
import { Toaster } from '@/components/primitives/sonner';

function IGRPToaster(props: React.ComponentProps<typeof Toaster>) {
  return <Toaster {...props} />;
}

interface IGRPToastProps<T> extends ExternalToast {
  type?: 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  promise?: Promise<T>;
  loading?: React.ReactNode;
  success?: string | ((data: T) => string);
  error?: React.ReactNode;
}

function useIGRPToast<T>() {
  const igrpToast = ({
    type = 'default',
    title,
    description,
    content,
    promise,
    loading,
    success,
    error,
    ...props
  }: IGRPToastProps<T>) => {
    if (promise) {
      return toast.promise(promise, {
        loading: loading || 'Processing...',
        success: success || 'Operation successful!',
        error: error || 'Something went wrong!',
        ...props,
      });
    }

    if (content) {
      return toast(content, props);
    }

    const toastFn = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      loading: toast.loading,
      default: toast,
    }[type];

    toastFn(title || 'Notification', { description, ...props });
  };

  return { igrpToast };
}

// eslint-disable-next-line react-refresh/only-export-components
export { IGRPToaster, useIGRPToast, type IGRPToastProps };
