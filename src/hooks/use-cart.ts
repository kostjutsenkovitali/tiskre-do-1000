"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cartCreate, cartLinesAdd, cartLinesRemove, cartLinesUpdate, type Cart } from "@/lib/cart";

const CART_ID_KEY = "sf_cart_id";

async function ensureCartId(): Promise<string> {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(CART_ID_KEY);
  if (existing) return existing;
  const cart = await cartCreate();
  localStorage.setItem(CART_ID_KEY, cart.id);
  return cart.id;
}

export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || loadingRef.current) return;
      loadingRef.current = true;
      try {
        const id = await ensureCartId();
        if (!id) return;
        setCart((prev) => prev ?? { id, totalQuantity: 0, checkoutUrl: "", lines: { nodes: [] } } as Cart);
      } finally {
        loadingRef.current = false;
      }
    })();
  }, []);

  const add = useCallback(async (variantId: string, quantity: number) => {
    const id = await ensureCartId();
    const next = await cartLinesAdd(id, [{ merchandiseId: variantId, quantity }]);
    localStorage.setItem(CART_ID_KEY, next.id);
    setCart(next);
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("cart:open"));
      } catch {}
    }
  }, []);

  const update = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return;
    const next = await cartLinesUpdate(cart.id, [{ id: lineId, quantity }]);
    setCart(next);
  }, [cart]);

  const remove = useCallback(async (lineId: string) => {
    if (!cart) return;
    const next = await cartLinesRemove(cart.id, [lineId]);
    setCart(next);
  }, [cart]);

  const count = useMemo(() => cart?.totalQuantity ?? 0, [cart]);

  return { cart, add, update, remove, count };
}

