"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function refreshMe() {
    try {
      const token = getCustomerToken();
      if (token) {
        // In a static export, we can't fetch real customer data
        // This is just a placeholder for demonstration
        setMe({
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          orders: {
            nodes: []
          }
        });
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  function getCustomerToken(): string | null {
    if (typeof document === "undefined") return null;
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sf_customer_token="))
      ?.split("=")[1];
    return token || null;
  }

  async function doAuth(action: "login" | "signup") {
    // In a static export, we can't authenticate with real backend
    // This is just a placeholder for demonstration
    setIsLoggedIn(true);
    setMe({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      orders: {
        nodes: []
      }
    });
  }

  async function handleLogout() {
    try {
      const token = getCustomerToken();
      if (token) {
        document.cookie = "sf_customer_token=; Max-Age=0; Path=/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setMe(null);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    alert("Profile updated successfully!");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #98a8b8 100%)" }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #98a8b8 100%)" }}>
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="text-center text-lg font-medium">Account Access</h2></div>
            <div className="p-4 space-y-6">
              <form id="login-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("login"); }}>
                <label htmlFor="email" className="text-sm">Email</label>
                <input name="email" id="email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-none" required />
                <div className="space-y-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <input name="password" id="password" type="password" className="w-full h-10 px-3 border rounded-none" required />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">Or create an account</div>
              <form id="signup-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("signup"); }}>
                <label htmlFor="name" className="text-sm">Full Name</label>
                <input name="firstName" placeholder="First Name" className="w-full h-10 px-3 border rounded-none" required />
                <input name="lastName" placeholder="Last Name" className="w-full h-10 px-3 border rounded-none" required />
                <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm">Email</label>
                <input name="email" id="reg-email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-none" required />
                </div>
                <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm">Password</label>
                <input name="password" id="reg-password" type="password" className="w-full h-10 px-3 border rounded-none" required />
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
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #98a8b8 100%)" }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium text-foreground">Account</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="grid gap-6">
          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">Profile Information</h2></div>
            <form className="p-4 space-y-4" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm">First Name</label>
                  <input name="firstName" id="firstName" defaultValue={me?.firstName || ""} className="w-full h-10 px-3 border rounded-none" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm">Last Name</label>
                  <input name="lastName" id="lastName" defaultValue={me?.lastName || ""} className="w-full h-10 px-3 border rounded-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm">Email</label>
                <input name="email" id="email" type="email" defaultValue={me?.email || ""} className="w-full h-10 px-3 border rounded-none" />
              </div>
              <Button type="submit">Update Profile</Button>
            </form>
          </div>

          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">Order History</h2></div>
            <div className="p-4 space-y-4">
              {(me?.orders?.nodes || []).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-none">
                  <div>
                    <h3 className="font-medium">{order.name}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(order.processedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.totalPrice?.amount} {order.totalPrice?.currencyCode}</p>
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-none bg-gray-200">
                      {order.financialStatus}
                    </span>
                  </div>
                </div>
              ))}
              {(!me?.orders?.nodes || me.orders.nodes.length === 0) && (
                <p className="text-muted-foreground text-center py-4">No orders found</p>
              )}
            </div>
          </div>

          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">Account Settings</h2></div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm">Current Password</label>
                <input id="current-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm">New Password</label>
                <input id="new-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm">Confirm Password</label>
                <input id="confirm-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <Button>Update Password</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}