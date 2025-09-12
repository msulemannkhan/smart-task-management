import { useToast as useChakraToast } from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon, InfoIcon } from "@chakra-ui/icons";
import { MdError } from "react-icons/md";

// Define UseToastOptions interface locally since it's not exported from Chakra UI
interface UseToastOptions {
  title?: string;
  description?: string;
  status?: "success" | "error" | "warning" | "info" | "loading";
  duration?: number | null;
  isClosable?: boolean;
  position?:
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right";
  icon?: React.ReactElement;
  containerStyle?: React.CSSProperties;
}

interface ToastOptions extends Omit<UseToastOptions, "status"> {
  type?: "success" | "error" | "warning" | "info";
}

export const useCustomToast = () => {
  const toast = useChakraToast();

  const showToast = (message: string, options?: ToastOptions) => {
    const { type = "info", ...restOptions } = options || {};

    const icons = {
      success: <CheckCircleIcon />,
      error: <MdError />,
      warning: <WarningIcon />,
      info: <InfoIcon />,
    };

    const colors = {
      success: "green",
      error: "red",
      warning: "orange",
      info: "blue",
    };

    return toast({
      title: message,
      status: type,
      duration: type === "error" ? 5000 : 3000,
      isClosable: true,
      position: "top-right",
      icon: icons[type],
      containerStyle: {
        color: `${colors[type]}.500`,
        borderRadius: "lg",
        boxShadow: "lg",
      },
      ...restOptions,
    });
  };

  return {
    success: (message: string, options?: Omit<ToastOptions, "type">) =>
      showToast(message, { ...options, type: "success" }),
    error: (message: string, options?: Omit<ToastOptions, "type">) =>
      showToast(message, { ...options, type: "error" }),
    warning: (message: string, options?: Omit<ToastOptions, "type">) =>
      showToast(message, { ...options, type: "warning" }),
    info: (message: string, options?: Omit<ToastOptions, "type">) =>
      showToast(message, { ...options, type: "info" }),
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => {
      const id = toast({
        title: messages.loading,
        status: "info",
        duration: null,
        isClosable: false,
        position: "top-right",
      });

      promise
        .then((data) => {
          toast.close(id);
          const successMsg =
            typeof messages.success === "function"
              ? messages.success(data)
              : messages.success;
          showToast(successMsg, { type: "success" });
          return data;
        })
        .catch((error) => {
          toast.close(id);
          const errorMsg =
            typeof messages.error === "function"
              ? messages.error(error)
              : messages.error;
          showToast(errorMsg, { type: "error" });
          throw error;
        });

      return promise;
    },
  };
};

export default useCustomToast;
