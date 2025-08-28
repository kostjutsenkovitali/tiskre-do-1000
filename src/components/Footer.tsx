"use client";

import Link from "next/link";
import { Youtube, Instagram } from "lucide-react";

/* 
  Footer stays fixed; main content gets bottom padding equal to footer height.
  The first column (logo, address, socials, copyright) is shifted down.
  Tiskre logo nudged UP a little (top-4).
*/

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3v4.8c1.5 1.6 3.2 2.5 5 2.6v3.1c-1.9 0-3.6-.6-5-1.6v4.8a6.5 6.5 0 1 1-6.5-6.5c.6 0 1.2.1 1.8.3v3.2a2.9 2.9 0 1 0 2.9 2.9V3h1.8z"/>
  </svg>
);

export default function Footer() {
  return (
    <>
      {/* Global helpers for the "reveal" behavior */}
      <style jsx global>{`
        :root { --footer-h: 420px; }
        body { padding-bottom: var(--footer-h); }
        main, #__next > div:not(footer) { position: relative; z-index: 1; }
      `}</style>

      <footer
        className="fixed inset-x-0 bottom-0 z-0 text-foreground"
        style={{ backgroundColor: "#f5f5f5", height: "var(--footer-h)" }}
      >
        <div className="max-w-[1971px] mx-auto px-4 h-full flex flex-col justify-between pt-10 pb-6">
          <div className="grid flex-1 gap-8 md:grid-cols-3 relative">
            {/* do.png: nudged UP */}
            <div className="absolute left-0 top-4 w-[540px] h-24 sm:h-28 flex items-center">
              <img
                src="/hexagon/do.png"
                alt="Tiskre-DO logo"
                className="h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Left column: shifted DOWN */}
            <div className="min-w-0 pt-36">
              <p className="text-[1.333rem] leading-snug text-muted-foreground">
                10416 Estonia, Tallinn<br />
                Karjamaa str.9<br />
                +37259027489
              </p>

              <div className="h-6 md:h-8" />

              <div className="flex items-center gap-5 text-muted-foreground">
                <a href="#" aria-label="YouTube" className="hover:text-foreground">
                  <Youtube className="h-10 w-10" />
                </a>
                <a href="#" aria-label="Instagram" className="hover:text-foreground">
                  <Instagram className="h-10 w-10" />
                </a>
                <a href="#" aria-label="TikTok" className="hover:text-foreground">
                  <TikTokIcon className="h-10 w-10" />
                </a>
              </div>

              <div className="h-6 md:h-8" />

              <div className="text-base md:text-lg text-muted-foreground">
                © 2025 Tiskre-DO, All Rights Reserved
              </div>
            </div>

            {/* Middle */}
            <nav className="self-start">
              <h4 className="mb-4 text-xl md:text-2xl font-semibold uppercase tracking-wide">
                Useful links
              </h4>
              <ul className="space-y-3 text-[1.333rem] leading-[1.15]">
                <li>
                  <Link href="/contact" className="hover:underline">Contact</Link>
                </li>
                <li>
                  <Link href="/instructions" className="hover:underline">Instructions/Manuals</Link>
                </li>
                <li>
                  <Link href="/delivery" className="hover:underline">Delivery</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:underline">Terms & Conditions</Link>
                </li>
              </ul>
            </nav>

            {/* Right */}
            <div className="overflow-hidden self-end">
              <img
                src="/bark.png"
                alt="Bark texture"
                className="h-auto w-[92%] max-w-none rounded-none object-cover transform -translate-x-2 md:-translate-x-4"
              />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
