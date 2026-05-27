import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "live" | "warning" | "danger" | "neon";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  pixel?: boolean;
}

const toneStyles: Record<Tone, string> = {
  neutral:
    "border-outline-variant text-on-surface-variant bg-surface-container-low",
  live: "border-growth-green/60 text-growth-green bg-tertiary/10",
  warning: "border-warning-amber/60 text-warning-amber bg-secondary/10",
  danger: "border-error/60 text-error bg-error/10",
  neon: "border-neon-blue/60 text-neon-blue bg-neon-blue/10",
};

/**
 * Pixel-Border style chip (DESIGN.md §Chips/Badges).
 * Rectangular, 1px solid border, no rounded pills.
 */
export function Chip({
  className,
  tone = "neutral",
  pixel = true,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] uppercase tracking-[0.08em]",
        "rounded-sm",
        pixel && "font-[var(--font-pixel)]",
        toneStyles[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
