"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold tracking-tight">TISKRE-DO</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="hover:opacity-80">Home</Link>
          <Link href="/shop" className="hover:opacity-80">Shop</Link>
          <Link href="/about" className="hover:opacity-80">About</Link>
          <Link href="/instructions" className="hover:opacity-80">Instructions</Link>
          <Link href="/blog" className="hover:opacity-80">Blog</Link>
        </nav>
      </div>
    </header>
  );
}


