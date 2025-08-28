"use client";
import * as React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline";
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
  const styles =
    variant === "secondary"
      ? "bg-muted text-foreground"
      : variant === "outline"
      ? "border border-border text-foreground"
      : "bg-foreground text-background";
  return <span className={`${base} ${styles} ${className}`} {...props} />;
}


