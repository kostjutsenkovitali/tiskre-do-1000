// src/contexts/GlobalAudioContext.tsx
"use client";

import { createContext, useContext, useEffect, useRef } from "react";

type GlobalAudioContextType = {
  isUnlocked: boolean;
  moveAudio: HTMLAudioElement | null;
  cutAudio: HTMLAudioElement | null;
  incAudio: Array<HTMLAudioElement | null>;
};

const GlobalAudioContext = createContext<GlobalAudioContextType | null>(null);

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const moveAudioRef = useRef<HTMLAudioElement | null>(null);
  const cutAudioRef = useRef<HTMLAudioElement | null>(null);
  const incAudioRefs = useRef<Array<HTMLAudioElement | null>>([null, null]);
  const startedRef = useRef(false);

  // Initialize audio elements on mount
  useEffect(() => {
    // Create audio elements
    moveAudioRef.current = new Audio("/sounds/laser_move.mp3");
    moveAudioRef.current.loop = true;
    moveAudioRef.current.volume = 0;

    cutAudioRef.current = new Audio("/sounds/laser_cut.mp3");
    cutAudioRef.current.loop = true;
    cutAudioRef.current.volume = 0;

    // Per-INC (1 & 2) use the same cut file from public
    incAudioRefs.current[0] = new Audio("/sounds/laser_cut.mp3");
    incAudioRefs.current[0].loop = true;
    incAudioRefs.current[0].volume = 0;

    incAudioRefs.current[1] = new Audio("/sounds/laser_cut.mp3");
    incAudioRefs.current[1].loop = true;
    incAudioRefs.current[1].volume = 0;

    // Try to preload audio files
    try {
      moveAudioRef.current?.load();
      cutAudioRef.current?.load();
      incAudioRefs.current[0]?.load();
      incAudioRefs.current[1]?.load();
    } catch (e) {
      console.warn("Failed to preload audio files:", e);
    }

    const onScroll = () => {
      if (!startedRef.current) {
        startedRef.current = true;
        // Play all sounds to unlock them
        moveAudioRef.current?.play().catch(() => {});
        cutAudioRef.current?.play().catch(() => {});
        incAudioRefs.current[0]?.play().catch(() => {});
        incAudioRefs.current[1]?.play().catch(() => {});
        
        // Remove event listener after first scroll
        window.removeEventListener("scroll", onScroll);
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      // Cleanup on unmount
      moveAudioRef.current?.pause();
      cutAudioRef.current?.pause();
      incAudioRefs.current[0]?.pause();
      incAudioRefs.current[1]?.pause();

      if (moveAudioRef.current) moveAudioRef.current.currentTime = 0;
      if (cutAudioRef.current) cutAudioRef.current.currentTime = 0;
      if (incAudioRefs.current[0]) incAudioRefs.current[0]!.currentTime = 0;
      if (incAudioRefs.current[1]) incAudioRefs.current[1]!.currentTime = 0;
    };
  }, []);

  return (
    <GlobalAudioContext.Provider value={{ 
      isUnlocked: startedRef.current,
      moveAudio: moveAudioRef.current,
      cutAudio: cutAudioRef.current,
      incAudio: incAudioRefs.current
    }}>
      {children}
    </GlobalAudioContext.Provider>
  );
}

export function useGlobalAudio() {
  const context = useContext(GlobalAudioContext);
  if (!context) {
    throw new Error("useGlobalAudio must be used within a GlobalAudioProvider");
  }
  return context;
}