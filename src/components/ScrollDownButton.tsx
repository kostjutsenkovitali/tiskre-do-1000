"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ScrollDownButton({ scope = "document" as "document" | "home" }) {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      setScrollProgress(progress);

      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const footerVisible = footerRect.top < window.innerHeight;
        setIsVisible(!footerVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    const selector = scope === "home"
      ? 'section:not(footer), main:not(footer), [data-section]:not(footer), .section:not(footer)'
      : 'section, main, [data-section], .section';
    const sections = document.querySelectorAll(selector);
    const currentScrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    let targetSection: HTMLElement | null = null as any;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i] as HTMLElement;
      const sectionTop = section.offsetTop;
      if (sectionTop > currentScrollY + (viewportHeight * 0.2)) {
        targetSection = section;
        break;
      }
    }
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollBy({ top: viewportHeight * 0.8, behavior: 'smooth' });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 z-40 group transition-all duration-300 hover:scale-110"
      aria-label="Scroll to next section"
    >
      <div className="w-12 h-12 rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 flex items-center justify-center transition-all duration-300 group-hover:bg-black/20 dark:group-hover:bg-white/20 group-hover:border-black/40 dark:group-hover:border-white/40">
        <div className="relative w-6 h-6 transition-all duration-300 group-hover:translate-y-0.5">
          <Image src="/arrow.png" alt="Scroll down" fill className="object-contain filter dark:invert" priority />
        </div>
      </div>
    </button>
  );
}


