"use client";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { motion, useAnimate } from "motion/react";

type ButtonState = "idle" | "loading" | "success" | "error";

type ClickResult = boolean | { success?: boolean } | void;

type ErrorLike = unknown;

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<ClickResult> | ClickResult;
  onSuccess?: () => void;
  onError?: (error: ErrorLike) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

export const Button = ({ 
  className, 
  children, 
  onSuccess,
  onError,
  variant = "default",
  ...props 
}: ButtonProps) => {
  const [scope, animate] = useAnimate();
  const [state, setState] = useState<ButtonState>("idle");

  const getButtonColors = () => {
    switch (state) {
      case "success":
        return "bg-green-600 hover:bg-green-700 ring-green-600 dark:bg-green-700 dark:hover:bg-green-800 dark:ring-green-700";
      case "error":
        return "bg-destructive hover:bg-destructive/90 ring-destructive";
      case "loading":
        return variant === "destructive" 
          ? "bg-destructive/80 hover:bg-destructive/80 ring-destructive"
          : "bg-primary/80 hover:bg-primary/80 ring-primary";
      default:
        switch (variant) {
          case "destructive":
            return "bg-destructive hover:bg-destructive/90 ring-destructive";
          case "outline":
            return "border bg-background hover:bg-accent hover:text-accent-foreground ring-ring";
          case "secondary":
            return "bg-secondary hover:bg-secondary/80 ring-ring";
          case "ghost":
            return "hover:bg-accent hover:text-accent-foreground ring-ring";
          default:
            return "bg-primary hover:bg-primary/90 ring-primary";
        }
    }
  };

  const getTextColor = () => {
    switch (state) {
      case "success":
        return "text-white";
      case "error":
        return "text-white";
      default:
        switch (variant) {
          case "destructive":
            return "text-white";
          case "outline":
            return "text-foreground";
          case "secondary":
            return "text-secondary-foreground";
          case "ghost":
            return "text-foreground";
          default:
            return "text-primary-foreground";
        }
    }
  };

  const animateLoading = async () => {
    setState("loading");
    await animate(
      ".loader",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );
  };

  const animateSuccess = async () => {
    setState("success");
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".check",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );

    // Keep success state visible longer
    await animate(
      ".check",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 2.5,
        duration: 0.2,
      },
    );
    setState("idle");
  };

  const animateError = async () => {
    setState("error");
    await animate(
      ".loader",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        duration: 0.2,
      },
    );
    await animate(
      ".error",
      {
        width: "20px",
        scale: 1,
        display: "block",
      },
      {
        duration: 0.2,
      },
    );

    // Keep error state visible
    await animate(
      ".error",
      {
        width: "0px",
        scale: 0,
        display: "none",
      },
      {
        delay: 3,
        duration: 0.2,
      },
    );
    setState("idle");
  };

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (state !== "idle") return; // Prevent multiple clicks during animation
    
    try {
      await animateLoading();
      const result = await props.onClick?.(event);
      
      // Check if the result indicates success or failure
      // This allows the onClick handler to return a boolean or object with success property
      if (result === false || (result && typeof result === 'object' && 'success' in result && result.success === false)) {
        onError?.(result);
        await animateError();
      } else {
        onSuccess?.();
        await animateSuccess();
      }
    } catch (error) {
      onError?.(error);
      await animateError();
    }
  };

  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props;

  return (
    <motion.button
      layout
      layoutId="button"
      ref={scope}
      disabled={state === "loading"}
      className={cn(
        "flex min-w-[120px] cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 font-medium ring-offset-2 transition-all duration-200 hover:ring-2 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 dark:ring-offset-black",
        getButtonColors(),
        getTextColor(),
        className,
      )}
      {...buttonProps}
      onClick={handleClick}
    >
      <motion.div layout className="flex items-center gap-2">
        <Loader />
        <CheckIcon />
        <ErrorIcon />
        <motion.span layout>{children}</motion.span>
      </motion.div>
    </motion.button>
  );
};

const Loader = () => {
  return (
    <motion.svg
      animate={{
        rotate: [0, 360],
      }}
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "linear",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="loader"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a9 9 0 1 0 9 9" />
    </motion.svg>
  );
};

const CheckIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="check"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </motion.svg>
  );
};

const ErrorIcon = () => {
  return (
    <motion.svg
      initial={{
        scale: 0,
        width: 0,
        display: "none",
      }}
      style={{
        scale: 0.5,
        display: "none",
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="error"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </motion.svg>
  );
};
