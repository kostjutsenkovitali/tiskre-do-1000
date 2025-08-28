"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Truck } from "lucide-react";

type CartItem = { id: string; name: string; price: number; image: string; quantity: number };

const mockCartItems: CartItem[] = [
  { id: "1", name: "Minimalist Cotton Tee", price: 45, image: "/about-img-1.webp", quantity: 2 },
  { id: "2", name: "Leather Crossbody Bag", price: 120, image: "/about-img-2.webp", quantity: 1 },
];

export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "klarna">("card");

  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-medium text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: form */}
          <div className="space-y-6">
            {/* Shipping */}
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="flex items-center gap-2 font-medium"><Truck className="h-5 w-5" /> Shipping Information</h2></div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="text-sm">First Name</label>
                    <input id="firstName" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="John" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="text-sm">Last Name</label>
                    <input id="lastName" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="Doe" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="text-sm">Email</label>
                  <input id="email" type="email" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="john@example.com" />
                </div>
                <div>
                  <label htmlFor="address" className="text-sm">Address</label>
                  <input id="address" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="text-sm">City</label>
                    <input id="city" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="New York" />
                  </div>
                  <div>
                    <label htmlFor="zip" className="text-sm">ZIP Code</label>
                    <input id="zip" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="10001" />
                  </div>
                </div>
                <div>
                  <label htmlFor="country" className="text-sm">Country</label>
                  <select id="country" className="w-full h-10 px-3 border rounded-md mt-1 bg-background">
                    <option value="">Select country</option>
                    <option value="us">United States</option>
                    <option value="ca">Canada</option>
                    <option value="uk">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="flex items-center gap-2 font-medium"><CreditCard className="h-5 w-5" /> Payment Information</h2></div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={paymentMethod === "card" ? "solid" : "outline"} className="text-sm" onClick={() => setPaymentMethod("card")}>Card</Button>
                  <Button variant={paymentMethod === "paypal" ? "solid" : "outline"} className="text-sm" onClick={() => setPaymentMethod("paypal")}>PayPal</Button>
                  <Button variant={paymentMethod === "klarna" ? "solid" : "outline"} className="text-sm" onClick={() => setPaymentMethod("klarna")}>Klarna</Button>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cardNumber" className="text-sm">Card Number</label>
                      <input id="cardNumber" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiry" className="text-sm">Expiry Date</label>
                        <input id="expiry" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="MM/YY" />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="text-sm">CVV</label>
                        <input id="cvv" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="123" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="cardName" className="text-sm">Name on Card</label>
                      <input id="cardName" className="w-full h-10 px-3 border rounded-md mt-1" placeholder="John Doe" />
                    </div>
                  </div>
                )}

                {paymentMethod === "paypal" && (
                  <div className="text-center py-8"><p className="text-muted-foreground">You will be redirected to PayPal to complete your payment.</p></div>
                )}

                {paymentMethod === "klarna" && (
                  <div className="text-center py-8"><p className="text-muted-foreground">Pay in 4 interest-free installments with Klarna.</p></div>
                )}
              </div>
            </div>
          </div>

          {/* Right: summary */}
          <div>
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">Order Summary</h2></div>
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  {mockCartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <hr className="border-border" />

                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                  <hr className="border-border" />
                  <div className="flex justify-between font-medium text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>

                <Button className="w-full mt-2">Place Order</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


