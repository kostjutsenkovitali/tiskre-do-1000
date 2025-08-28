"use client";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

export function AddToCartIsland({ variantId }: { variantId?: string }) {
  const { add, count } = useCart();
  const [qty, setQty] = useState(1);
  if (!variantId) return null;
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
        className="w-16 rounded-none border px-2 py-1 text-sm"
      />
      <button
        className="rounded-none border px-4 py-2 text-sm"
        onClick={() => add(variantId, qty)}
      >
        Add to cart ({count})
      </button>
    </div>
  );
}


