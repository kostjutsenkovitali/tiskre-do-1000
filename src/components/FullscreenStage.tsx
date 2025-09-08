"use client";

import { useEffect, useRef } from "react";
import ThreeModel, { ThreeModelHandle } from "@/components/ThreeModel";

type Props = {
  modelRef?: React.RefObject<ThreeModelHandle | null>;
  visible: boolean;
  /** Compute world bottom for viewport floor in caller space */
  computeBottom: () => number;
};

export default function FullscreenStage({ modelRef, visible, computeBottom }: Props) {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    const apply = () => {
      const bottom = Math.min(0, computeBottom());
      modelRef?.current?.setOrthoBounds?.({ left: 0, right: 4500, top: 1900, bottom: bottom - 100 });
      modelRef?.current?.requestRender?.();
    };
    apply();
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible, computeBottom]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 25,
        pointerEvents: "none",
        display: visible ? "block" : "none",
      }}
    >
      <ThreeModel
        ref={modelRef as any}
        flat
        fitBBox={{ xmin: 0, ymin: 0, xmax: 4500, ymax: 1900 }}
        height={"100%"}
      />
    </div>
  );
}


