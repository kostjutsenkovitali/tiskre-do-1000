"use client";
import { useEffect, useState } from "react";

export default function PortfolioSectionClient() {
  const [MountedComp, setMountedComp] = useState<null | (() => JSX.Element)>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("@/components/PortfolioSection");
      if (!cancelled) {
        const Comp = mod.default || mod;
        setMountedComp(() => () => <Comp />);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!MountedComp) return null;
  return <MountedComp />;
}


