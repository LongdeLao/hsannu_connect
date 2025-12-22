import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

const toast = ({
  title,
  description,
  variant = "default",
  duration,
}: ToastProps) => {
  const message = description || title || "";
  const options = {
    duration: duration || 4000,
  };

  switch (variant) {
    case "destructive":
      return sonnerToast.error(title || "Error", {
        description,
        ...options,
      });
    case "success":
      return sonnerToast.success(title || "Success", {
        description,
        ...options,
      });
    default:
      return sonnerToast(title || message, {
        description: title ? description : undefined,
        ...options,
      });
  }
};

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
} 