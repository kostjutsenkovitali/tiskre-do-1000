"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, update, remove } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("cart:open", onOpen as EventListener);
    return () => window.removeEventListener("cart:open", onOpen as EventListener);
  }, []);

  const close = () => setOpen(false);

  return (
    <div
      aria-hidden={!open}
      className={[
        "fixed inset-0 z-[100]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      {/* backdrop */}
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={close}
      />
      {/* panel */}
      <aside
        className={[
          "absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button onClick={close} className="text-sm underline">Close</button>
        </div>
        <div className="p-4 space-y-3 overflow-auto max-h-[calc(100%-8rem)]">
          {cart?.lines.nodes.length ? (
            cart.lines.nodes.map((line) => (
              <div key={line.id} className="flex items-center justify-between gap-2 border p-2">
                <div className="text-sm">
                  {line.merchandise?.product?.title || line.merchandise?.title}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-none border px-2 text-sm"
                    onClick={() => update(line.id, Math.max(1, line.quantity - 1))}
                  >
                    -
                  </button>
                  <span className="text-sm tabular-nums">{line.quantity}</span>
                  <button
                    className="rounded-none border px-2 text-sm"
                    onClick={() => update(line.id, line.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="rounded-none border px-2 text-sm"
                    onClick={() => remove(line.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          )}
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm">Items: {cart?.totalQuantity ?? 0}</div>
          {cart?.checkoutUrl ? (
            <Link href={cart.checkoutUrl} className="rounded-none border px-4 py-2 text-sm">
              Checkout
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}


