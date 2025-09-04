// src/components/SoundOnScroll.tsx
"use client";

import { useEffect, useRef } from "react";

export default function SoundOnScroll() {
  const flyRef = useRef<HTMLAudioElement | null>(null);
  const loopRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // One-shot across this tab
    if (sessionStorage.getItem("flySoundDone") === "1") return;

    flyRef.current = new Audio("/sounds/header_logo_fly_4s.mp3");
    loopRef.current = new Audio("/sounds/hexblue_orbit_space_music_loop_8s.mp3");
    loopRef.current.loop = true;
    flyRef.current.volume = 0.8;
    loopRef.current.volume = 0.35;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      sessionStorage.setItem("flySoundDone", "1");
      flyRef.current?.play().catch(() => {});
      loopRef.current?.play().catch(() => {});
      // remove all listeners
      window.removeEventListener("scroll", start as any, { capture: true } as any);
      window.removeEventListener("pointerdown", start as any);
      window.removeEventListener("keydown", start as any);
    };

    // First real interaction: prefer scroll, but also allow click/key
    window.addEventListener("scroll", start as any, { once: true, passive: true, capture: true } as any);
    window.addEventListener("pointerdown", start as any, { once: true });
    window.addEventListener("keydown", start as any, { once: true });

    return () => {
      window.removeEventListener("scroll", start as any, { capture: true } as any);
      window.removeEventListener("pointerdown", start as any);
      window.removeEventListener("keydown", start as any);
      flyRef.current?.pause();
      loopRef.current?.pause();
      if (flyRef.current) flyRef.current.currentTime = 0;
      if (loopRef.current) loopRef.current.currentTime = 0;
    };
  }, []);

  return null;
}


