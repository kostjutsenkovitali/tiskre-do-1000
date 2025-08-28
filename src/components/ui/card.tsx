"use client";
import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return <div className={`border rounded-lg bg-background ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: DivProps) {
  return <div className={`p-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: DivProps) {
  return <h3 className={`text-lg font-medium ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-4 ${className}`} {...props} />;
}


