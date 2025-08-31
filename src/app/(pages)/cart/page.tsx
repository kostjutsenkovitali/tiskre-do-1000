"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { usePathname } from "next/navigation";
import { detectLocaleFromPath, shopPath } from "@/lib/paths";

export default function Cart() {
  const { cart, update, remove } = useCart();
  const pathname = usePathname();
  const locale = detectLocaleFromPath(pathname);
  const shopHref = shopPath(locale);

  const lines = cart?.lines.nodes || [];
  const subtotal = lines.reduce((sum, line: any) => sum + Number(line?.merchandise?.price?.amount || 0) * (line.quantity || 0), 0);
  const currency = lines[0]?.merchandise?.price?.currencyCode || "EUR";

  if (!lines.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-medium text-foreground mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to get started.</p>
            <Link href={shopHref}
            >
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
            {lines.map((line: any) => {
              const title = line?.merchandise?.product?.title || line?.merchandise?.title;
              const price = Number(line?.merchandise?.price?.amount || 0);
              const image = line?.merchandise?.image?.url || null;
              return (
                <div key={line.id} className="border rounded-lg">
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {image ? <img src={image} alt="" className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-muted rounded" />}
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{title}</h3>
                        <p className="text-muted-foreground">{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price)}</p>
                      </div>

                      <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="sm" onClick={() => update(line.id, Math.max(1, line.quantity - 1))}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 min-w-[2rem] text-center">{line.quantity}</span>
                        <Button variant="ghost" size="sm" onClick={() => update(line.id, line.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price * line.quantity)}</p>
                      </div>

                      <Button variant="ghost" size="sm" onClick={() => remove(line.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">Order Summary</h2></div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between"><span>Subtotal</span><span>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(subtotal)}</span></div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg"><span>Total</span><span>{new Intl.NumberFormat(undefined, { style: "currency", currency }).format(subtotal)}</span></div>
                </div>
                {cart?.checkoutUrl ? (
                  <Link href={cart.checkoutUrl}><Button className="w-full">Proceed to Checkout</Button></Link>
                ) : null}
                <Link href={shopHref}><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


