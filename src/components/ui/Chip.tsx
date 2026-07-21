import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "live" | "warning" | "danger" | "info";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneStyles: Record<Tone, string> = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  live: "bg-primary-container text-on-primary-container",
  warning: "bg-secondary-container text-on-secondary-container",
  danger: "bg-error-container text-on-error-container",
  info: "bg-tertiary-container text-on-tertiary-container",
};

/**
 * Status pill (DESIGN.md §Chips/Badges) — fully rounded, tinted, friendly.
 */
export function Chip({ className, tone = "neutral", children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
        "text-[12px] font-medium leading-5",
        toneStyles[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
