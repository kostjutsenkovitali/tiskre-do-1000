"use client";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

type Props = {
  variantId: string;
  className?: string;
};

export default function AddToCartButton({ variantId, className }: Props) {
  const { add } = useCart();
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await add(variantId, 1);
        } finally {
          setLoading(false);
        }
      }}
      className={className || "rounded-none border px-4 py-2 text-sm"}
    >
      {loading ? "Adding..." : "Add to cart"}
    </button>
  );
}


