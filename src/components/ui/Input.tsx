import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-void-black/60 text-on-surface placeholder:text-outline placeholder:font-[var(--font-pixel)]",
          "h-11 px-3 border-b-2 border-outline-variant",
          "outline-none transition-colors duration-150",
          "focus:border-neon-blue",
          invalid && "border-error focus:border-error",
          className,
        )}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-void-black/60 text-on-surface placeholder:text-outline",
          "min-h-[60px] px-3 py-2 border-b-2 border-outline-variant rounded-none",
          "outline-none transition-colors duration-150 resize-none",
          "focus:border-neon-blue",
          invalid && "border-error focus:border-error",
          className,
        )}
        {...rest}
      />
    );
  },
);
Textarea.displayName = "Textarea";
