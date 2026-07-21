import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover shadow-sm hover:shadow-md",
  secondary:
    "bg-surface text-on-surface border border-outline hover:bg-surface-container-high shadow-sm",
  outline:
    "bg-surface text-on-surface border border-outline hover:bg-surface-container-high shadow-sm",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container",
  danger:
    "bg-surface text-error border border-outline hover:bg-error-container hover:border-error/40 shadow-sm",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-5 text-[15px] gap-2",
  lg: "h-12 px-7 text-[16px] gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md font-semibold",
          "transition-all duration-150 ease-out",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm",
          "active:translate-y-[0.5px]",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block size-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
