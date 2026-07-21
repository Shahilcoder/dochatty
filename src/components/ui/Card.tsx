import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  tone?: "default" | "raised" | "primary";
}

export function Card({
  className,
  interactive,
  tone = "default",
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-150",
        tone === "default" && "bg-surface border-outline shadow-sm",
        tone === "raised" && "bg-surface border-outline shadow-md",
        tone === "primary" &&
          "bg-primary-container border-primary/25 shadow-sm",
        interactive &&
          "hover:border-primary/40 hover:shadow-md cursor-pointer",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 pt-4 pb-2 flex items-start justify-between gap-3",
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-on-surface text-[17px] font-semibold leading-tight tracking-[-0.01em]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3 text-on-surface-variant text-[14.5px]", className)}
      {...rest}
    />
  );
}

export function CardFooter({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 pt-2 pb-4 flex items-center justify-between gap-3",
        className,
      )}
      {...rest}
    />
  );
}
