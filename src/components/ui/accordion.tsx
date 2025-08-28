"use client";
import * as React from "react";

type AccordionContextValue = {
  value: string | null;
  setValue: (v: string | null) => void;
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const ItemContext = React.createContext<string | null>(null);

export function Accordion({
  type = "single",
  collapsible = false,
  className = "",
  children,
}: {
  type?: "single";
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [value, setValue] = React.useState<string | null>(null);
  const ctx = React.useMemo(() => ({ value, setValue, collapsible }), [value, collapsible]);
  return <AccordionContext.Provider value={ctx}><div className={className}>{children}</div></AccordionContext.Provider>;
}

export function AccordionItem({ value, className = "", children }: { value: string; className?: string; children: React.ReactNode }) {
  return <ItemContext.Provider value={value}><div className={className}>{children}</div></ItemContext.Provider>;
}

export function AccordionTrigger({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(AccordionContext);
  const itemValue = React.useContext(ItemContext);
  if (!ctx || !itemValue) return <div className={className}>{children}</div>;
  const isOpen = ctx.value === itemValue;
  return (
    <button
      type="button"
      className={`w-full text-left ${className}`}
      onClick={() => {
        if (isOpen) ctx.setValue(ctx.collapsible ? null : itemValue);
        else ctx.setValue(itemValue);
      }}
      aria-expanded={isOpen}
    >
      {children}
    </button>
  );
}

export function AccordionContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(AccordionContext);
  const itemValue = React.useContext(ItemContext);
  const open = !!ctx && !!itemValue && ctx.value === itemValue;
  return (
    <div className={className} style={{ display: open ? "block" : "none" }}>
      {children}
    </div>
  );
}


