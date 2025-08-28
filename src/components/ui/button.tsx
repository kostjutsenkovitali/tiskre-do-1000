"use client";
import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "icon";
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "solid", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants: Record<string, string> = {
      solid: "bg-foreground text-background hover:opacity-90",
      outline: "border border-black/10 dark:border-white/10",
      ghost: "hover:bg-black/5 dark:hover:bg-white/10",
    };
    const sizes: Record<string, string> = {
      sm: "h-8 px-2 text-sm",
      md: "h-10 px-4 text-sm",
      icon: "h-10 w-10",
    };
    return (
      <button ref={ref} className={[base, variants[variant], sizes[size], className].join(" ")} {...props} />
    );
  }
);
Button.displayName = "Button";


