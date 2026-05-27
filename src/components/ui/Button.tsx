import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  glow?: boolean;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-neon-blue text-pure-white hover:shadow-glow-primary border border-neon-blue/40",
  secondary:
    "bg-warning-amber text-on-secondary hover:shadow-glow-secondary border border-warning-amber/40",
  ghost:
    "bg-transparent text-on-surface hover:bg-surface-container-high border border-transparent",
  outline:
    "bg-transparent text-on-surface border border-outline-variant hover:border-neon-blue hover:text-pure-white",
  danger:
    "bg-error-container text-on-error-container border border-error/40 hover:bg-error",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-5 text-[15px]",
  lg: "h-12 px-7 text-[16px]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      glow,
      loading,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-md font-semibold uppercase tracking-[0.04em]",
          "transition-all duration-150 ease-out",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
          "active:translate-y-[1px]",
          variantStyles[variant],
          sizeStyles[size],
          glow && variant === "primary" && "shadow-glow-primary-soft",
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
