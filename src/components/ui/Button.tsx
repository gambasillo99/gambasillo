import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl",
          "transition-all duration-200 btn-press",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          fullWidth && "w-full",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-5 py-2.5 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          variant === "primary" &&
            "bg-gradient-to-r from-gambas-accent to-gambas-accent2 text-white hover:opacity-90 shadow-glow",
          variant === "secondary" &&
            "bg-gambas-card border border-gambas-border text-gambas-text hover:bg-gambas-surface",
          variant === "ghost" &&
            "text-gambas-muted hover:text-gambas-text hover:bg-gambas-card/50",
          variant === "danger" && "text-red-400 hover:bg-red-400/10",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
