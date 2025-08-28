"use client";
import { useCallback, useMemo, useState } from "react";

export type CartItem = { id: string; name: string; price: number; quantity: number };

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const openCart = useCallback(() => {
    // placeholder for a cart drawer/modal
    // eslint-disable-next-line no-alert
    alert("Cart opened (placeholder)");
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return { items, addItem, openCart, count };
}

