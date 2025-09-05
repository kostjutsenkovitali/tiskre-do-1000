"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";

export default function CartDrawer() {
  const { cart, update, remove } = useCart();
  const [open, setOpen] = useState(false);
  const { locale } = useI18n();

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
            cart.lines.nodes.map((line) => {
              const title = (line as any)?.merchandise?.product?.title || (line as any)?.merchandise?.title;
              const price = Number((line as any)?.merchandise?.price?.amount || 0);
              const currency = (line as any)?.merchandise?.price?.currencyCode || "EUR";
              const image = (line as any)?.merchandise?.image?.url || null;
              const lineTotal = price * (line.quantity || 0);
              return (
                <div key={line.id} className="flex items-center gap-3 border p-2">
                  {image ? (
                    <img src={image} alt="" className="w-14 h-14 object-cover border" />
                  ) : (
                    <div className="w-14 h-14 bg-muted border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-none border px-2 text-sm"
                      onClick={() => {
                        const nextQty = (line.quantity || 0) - 1;
                        if (nextQty <= 0) remove(line.id); else update(line.id, nextQty);
                      }}
                    >-
                    </button>
                    <span className="text-sm tabular-nums w-6 text-center">{line.quantity}</span>
                    <button className="rounded-none border px-2 text-sm" onClick={() => update(line.id, line.quantity + 1)}>+</button>
                    <button className="rounded-none border px-2 text-sm" onClick={() => remove(line.id)}>Remove</button>
                  </div>
                  <div className="text-sm w-20 text-right">
                    {new Intl.NumberFormat(locale, { style: "currency", currency }).format(lineTotal)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          )}
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm">
            Items: {cart?.totalQuantity ?? 0}
          </div>
          {cart?.id ? (
            <button
              className="rounded-none border px-4 py-2 text-sm"
              onClick={async () => {
                try {
                  const res = await fetch("/api/cart/prepareCheckout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cartId: cart.id }) });
                  const json = await res.json();
                  if (json?.checkoutUrl) window.location.href = json.checkoutUrl;
                } catch {}
              }}
            >
              Checkout
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}


