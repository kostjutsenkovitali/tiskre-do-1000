"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cartBuyerIdentityUpdate } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { cart } = useCart();
  const [me, setMe] = useState<any>(null);
  const router = useRouter();

  const user = {
    name: "John Doe",
    email: "john@example.com",
    address: "123 Main St, City, State 12345",
  };

  const orders = [
    { id: "ORD001", date: "2024-01-20", status: "delivered", total: 165, items: 2 },
    { id: "ORD002", date: "2024-01-15", status: "processing", total: 45, items: 1 },
  ];

  async function refreshMe() {
    const res = await fetch("/api/me", { cache: "no-store" }).then(r => r.json()).catch(() => ({ customer: null }));
    setMe(res.customer);
    setIsLoggedIn(Boolean(res.customer));
  }

  useEffect(() => { refreshMe(); }, []);

  async function doAuth(action: "login" | "signup") {
    const form = document.getElementById(action === "login" ? "login-form" : "signup-form") as HTMLFormElement;
    const fd = new FormData(form);
    const payload: any = { action };
    fd.forEach((v, k) => (payload[k] = v));
    const res = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).then(r => r.json());
    if (res?.ok) {
      await refreshMe();
      // Attach customer to cart for prefilled checkout
      try {
        const tok = (document.cookie.split(";").find(c => c.trim().startsWith("sf_customer_token=")) || "").split("=")[1];
        if (tok && cart?.id) await cartBuyerIdentityUpdate(cart.id, { customerAccessToken: tok });
      } catch {}
      try { router.push("/account"); } catch {}
    } else {
      alert(res?.error || "Auth failed");
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="text-center text-lg font-medium">Account Access</h2></div>
            <div className="p-4 space-y-6">
              <form id="login-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("login"); }}>
                <label htmlFor="email" className="text-sm">Email</label>
                <input name="email" id="email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-md" />
                <div className="space-y-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <input name="password" id="password" type="password" className="w-full h-10 px-3 border rounded-md" />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">— or create an account —</div>
              <form id="signup-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("signup"); }}>
                <label htmlFor="name" className="text-sm">Full Name</label>
                <input name="firstName" placeholder="John" className="w-full h-10 px-3 border rounded-md" />
                <input name="lastName" placeholder="Doe" className="w-full h-10 px-3 border rounded-md" />
                <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm">Email</label>
                <input name="email" id="reg-email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-md" />
                </div>
                <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm">Password</label>
                <input name="password" id="reg-password" type="password" className="w-full h-10 px-3 border rounded-md" />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-foreground">My Account</h1>
          <Button variant="outline" onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setIsLoggedIn(false); setMe(null); }}>Logout</Button>
        </div>

        <div className="grid gap-6">
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">Profile Information</h2></div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="profile-name" className="text-sm">Full Name</label>
                  <input id="profile-name" defaultValue={user.name} className="w-full h-10 px-3 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-email" className="text-sm">Email</label>
                  <input id="profile-email" type="email" defaultValue={user.email} className="w-full h-10 px-3 border rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm">Address</label>
                <input id="address" defaultValue={user.address} className="w-full h-10 px-3 border rounded-md" />
              </div>
              <Button>Update Profile</Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">Order History</h2></div>
            <div className="p-4 space-y-4">
              {(me?.orders?.nodes || []).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{order.name}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(order.processedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.totalPrice?.amount} {order.totalPrice?.currencyCode}</p>
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-gray-200">{order.financialStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">Account Settings</h2></div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm">Current Password</label>
                <input id="current-password" type="password" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm">New Password</label>
                <input id="new-password" type="password" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm">Confirm New Password</label>
                <input id="confirm-password" type="password" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <Button>Update Password</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


