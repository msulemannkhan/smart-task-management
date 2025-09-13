import toast, { Toaster } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const useCustomToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', options?: ToastOptions) => {
    const { duration = type === 'error' ? 5000 : 3000 } = options || {};

    switch (type) {
      case 'success':
        return toast.success(message, { duration });
      case 'error':
        return toast.error(message, { duration });
      default:
        return toast(message, { duration });
    }
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) =>
      showToast(message, 'error', options),
    warning: (message: string, options?: ToastOptions) =>
      toast(message, {
        duration: options?.duration || 4000,
        icon: '⚠️',
      }),
    info: (message: string, options?: ToastOptions) =>
      toast(message, {
        duration: options?.duration || 3000,
        icon: 'ℹ️',
      }),
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => {
      return toast.promise(
        promise,
        {
          loading: messages.loading,
          success: (data) =>
            typeof messages.success === 'function'
              ? messages.success(data)
              : messages.success,
          error: (error) =>
            typeof messages.error === 'function'
              ? messages.error(error)
              : messages.error,
        },
        {
          duration: 4000,
        }
      );
    },
  };
};

export default useCustomToast;