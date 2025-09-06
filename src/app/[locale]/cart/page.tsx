'use client';
import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";

type CartItem = { 
  id: string; 
  title: string; 
  qty: number; 
  price: number;
  image?: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<string>("EUR");
  const pathname = usePathname();
  // Extract locale from pathname instead of using headers
  const locale = pathname.split('/')[1] || 'en';
  const shopHref = `/${locale}/shop`;

  useEffect(() => {
    // Load cart from localStorage
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cart') : null;
    if (raw) {
      try {
        const cartData = JSON.parse(raw);
        setItems(cartData.items || []);
        setCurrency(cartData.currency || "EUR");
      } catch (e) {
        console.error("Failed to parse cart data", e);
        setItems([]);
      }
    }
  }, []);

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, qty: newQty } : item
    );
    
    setItems(updatedItems);
    saveCart(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    saveCart(updatedItems);
  };

  const saveCart = (itemsToSave: CartItem[]) => {
    if (typeof window !== 'undefined') {
      const cartData = {
        items: itemsToSave,
        currency
      };
      localStorage.setItem('cart', JSON.stringify(cartData));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #a8b8b8 100%)" }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-medium text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet</p>
            <Link href={shopHref}>
              <Button className="rounded-none active:scale-95 transition-transform duration-150">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #a8b8b8 100%)" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-medium text-foreground mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-none">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground">
                        {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center border rounded-none">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 min-w-[2rem] text-center">{item.qty}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(item.price * item.qty)}
                      </p>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-none">
              <div className="p-4 border-b"><h2 className="font-medium">Order Summary</h2></div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(subtotal)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(total)}</span>
                  </div>
                </div>
                <Button className="w-full rounded-none active:scale-95 transition-transform duration-150">
                  Proceed to Checkout
                </Button>
                <Link href={shopHref}>
                  <Button variant="outline" className="w-full rounded-none active:scale-95 transition-transform duration-150">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}