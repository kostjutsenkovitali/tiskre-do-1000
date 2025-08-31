"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cartBuyerIdentityUpdate, cartCreate, cartGet, cartLinesAdd, cartLinesRemove, cartLinesUpdate, type Cart } from "@/lib/cart";
import { brandedCheckoutUrl } from "@/lib/shopify";

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
        const existing = localStorage.getItem(CART_ID_KEY);
        if (existing) {
          try {
            const existingCart = await cartGet(existing);
            setCart(existingCart);
            return;
          } catch {}
        }
        const created = await cartCreate();
        localStorage.setItem(CART_ID_KEY, created.id);
        setCart(created);
      } finally {
        loadingRef.current = false;
      }
    })();

    // Listen for cross-component cart updates
    const onChanged = (e: any) => {
      const next = e?.detail as Cart | undefined;
      if (next && next.id) setCart(next);
    };
    const onStorage = async (e: StorageEvent) => {
      if (e.key === CART_ID_KEY && e.newValue && typeof window !== "undefined") {
        try { const c = await cartGet(e.newValue); setCart(c); } catch {}
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("cart:changed", onChanged as EventListener);
      window.addEventListener("storage", onStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cart:changed", onChanged as EventListener);
        window.removeEventListener("storage", onStorage);
      }
    };
  }, []);

  const add = useCallback(async (variantId: string, quantity: number) => {
    const id = await ensureCartId();
    const next = await cartLinesAdd(id, [{ merchandiseId: variantId, quantity }]);
    localStorage.setItem(CART_ID_KEY, next.id);
    setCart(next);
    if (typeof window !== "undefined") {
      try {
        window.dispatchEvent(new CustomEvent("cart:changed", { detail: next }));
        window.dispatchEvent(new CustomEvent("cart:open"));
      } catch {}
    }
  }, []);

  const update = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return;
    const next = await cartLinesUpdate(cart.id, [{ id: lineId, quantity }]);
    setCart(next);
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new CustomEvent("cart:changed", { detail: next })); } catch {}
    }
  }, [cart]);

  const remove = useCallback(async (lineId: string) => {
    if (!cart) return;
    const next = await cartLinesRemove(cart.id, [lineId]);
    setCart(next);
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new CustomEvent("cart:changed", { detail: next })); } catch {}
    }
  }, [cart]);

  const addAndCheckout = useCallback(async (merchandiseId: string, quantity: number) => {
    const id = await ensureCartId();
    const next = await cartLinesAdd(id, [{ merchandiseId, quantity }]);
    localStorage.setItem(CART_ID_KEY, next.id);
    setCart(next);
    if (typeof window !== "undefined" && next.id) {
      try {
        const res = await fetch("/api/cart/prepareCheckout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cartId: next.id }) });
        const json = await res.json();
        if (json?.checkoutUrl) {
          window.location.href = json.checkoutUrl;
          return;
        }
      } catch {}
      if (next.checkoutUrl) {
        try { window.location.href = brandedCheckoutUrl(next.checkoutUrl); } catch {}
      }
    }
  }, []);

  const count = useMemo(() => cart?.totalQuantity ?? 0, [cart]);

  return { cart, add, update, remove, count, addAndCheckout };
}

