"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

type CartItem = { id: string; name: string; price: number; image: string; quantity: number };

const initialItems: CartItem[] = [
  { id: "1", name: "Minimalist Cotton Tee", price: 45, image: "/about-img-1.webp", quantity: 2 },
  { id: "2", name: "Leather Crossbody Bag", price: 120, image: "/about-img-2.webp", quantity: 1 },
];

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0)
    );
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const shipping = subtotal > 100 ? 0 : items.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-medium text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to get started.</p>
            <Link href="/shop">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-medium text-foreground mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg">
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-muted-foreground">${item.price}</p>
                    </div>

                    <div className="flex items-center border rounded-md">
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 min-w-[2rem] text-center">{item.quantity}</span>
                      <Button variant="ghost" size="sm" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">Order Summary</h2></div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
                {shipping === 0 && <p className="text-sm">Free shipping on orders over $100!</p>}
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                <Link href="/checkout"><Button className="w-full">Proceed to Checkout</Button></Link>
                <Link href="/shop"><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


