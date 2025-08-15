"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/10 dark:border-white/10 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between text-sm">
        <div className="opacity-70">© {new Date().getFullYear()} TISKRE-DO</div>
        <nav className="flex items-center gap-4 flex-wrap">
          <Link href="/" className="hover:opacity-80">Home</Link>
          <Link href="/shop" className="hover:opacity-80">Shop</Link>
          <Link href="/about" className="hover:opacity-80">About</Link>
          <Link href="/instructions" className="hover:opacity-80">Instructions</Link>
          <Link href="/blog" className="hover:opacity-80">Blog</Link>
        </nav>
      </div>
    </footer>
  );
}


