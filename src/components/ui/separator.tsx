import * as React from "react";

export function Separator({ className = "" }: { className?: string }) {
  return <div role="separator" className={["w-full h-px bg-black/10 dark:bg-white/10", className].join(" ")} />;
}


