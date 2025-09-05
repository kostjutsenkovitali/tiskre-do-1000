"use client";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

type Props = {
  variantId?: string | null;
  productId?: string | null;
  className?: string;
  quantity?: number;
};

export default function AddToCartButton({ variantId, productId, quantity = 1, className }: Props) {
  const { add } = useCart();
  const [loading, setLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const idToUse = variantId || productId || "";
          if (!idToUse) throw new Error("Missing variant or product id");
          await add(idToUse, quantity);
        } finally {
          setLoading(false);
        }
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`${className || "rounded-none border px-4 py-2 text-sm"} ${isPressed ? 'scale-95' : 'scale-100'} transition-transform duration-150`}
    >
      {loading ? "Adding..." : "Add to cart"}
    </button>
  );
}