"use client";
import * as React from "react";

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex">{children}</div>;
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 mt-2 w-40 origin-top-right border border-black/10 dark:border-white/10 bg-background shadow-lg focus:outline-none z-50">
      <div className="py-1">{children}</div>
    </div>
  );
}

export function DropdownMenuItem({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10">
      {children}
    </button>
  );
}

