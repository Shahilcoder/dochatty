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
          "w-full bg-surface text-on-surface placeholder:text-on-surface-variant",
          "h-11 px-3.5 border border-outline rounded-md",
          "outline-none transition-colors duration-150",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          invalid &&
            "border-error focus:border-error focus:ring-error/20",
          className,
        )}
        {...rest}
      />
    );
  },
);
Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-surface text-on-surface placeholder:text-on-surface-variant",
          "min-h-[60px] px-3.5 py-2.5 border border-outline rounded-md",
          "outline-none transition-colors duration-150 resize-none",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          invalid && "border-error focus:border-error focus:ring-error/20",
          className,
        )}
        {...rest}
      />
    );
  },
);
Textarea.displayName = "Textarea";
