import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-16">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">TISKRE-DO</h1>
        <p className="opacity-80 mb-6">Quality products and practical guidance.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/shop" className="px-5 py-2 rounded-full bg-foreground text-background">Shop now</Link>
          <Link href="/instructions" className="px-5 py-2 rounded-full border border-black/10 dark:border-white/10">Instructions</Link>
        </div>
      </section>
    </div>
  );
}
