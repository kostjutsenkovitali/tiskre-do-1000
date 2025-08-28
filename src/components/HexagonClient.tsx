"use client";
import { useEffect, useState } from "react";

export default function HexagonClient() {
  const [MountedHexagon, setMountedHexagon] = useState<null | (() => JSX.Element)>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("@/components/Hexagon");
      if (!cancelled) {
        const Comp = mod.default;
        setMountedHexagon(() => () => <Comp />);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!MountedHexagon) return null;
  return <MountedHexagon />;
}


