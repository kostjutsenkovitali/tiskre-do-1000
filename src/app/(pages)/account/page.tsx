"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cartBuyerIdentityUpdate } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { useI18n } from "@/contexts/I18nProvider";
import { getCustomer, customerUpdateProfile, customerAccessTokenCreate, customerCreate } from "@/lib/customer";

export default function Account() {
  const { t, locale } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { cart } = useCart();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function refreshMe() {
    try {
      const token = getCustomerToken();
      if (token) {
        const customer = await getCustomer(token);
        setMe(customer);
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
    const form = document.getElementById(action === "login" ? "login-form" : "signup-form") as HTMLFormElement;
    const fd = new FormData(form);
    const payload: any = { action };
    fd.forEach((v, k) => (payload[k] = v));
    
    try {
      if (action === "login") {
        // Login flow
        const email = payload.email as string;
        const password = payload.password as string;
        const tokenResponse = await customerAccessTokenCreate({ email, password });
        const token = tokenResponse.accessToken;
        
        // Set cookie
        document.cookie = `sf_customer_token=${token}; Max-Age=${60 * 60 * 24 * 30}; Path=/`;
        
        // Refresh customer data
        await refreshMe();
        
        // Attach customer to cart for prefilled checkout
        try {
          if (token && cart?.id) await cartBuyerIdentityUpdate(cart.id, { customerAccessToken: token });
        } catch (error) {
          console.error("Failed to attach customer to cart:", error);
        }
        
        router.push(`/${locale}/account?welcome=1`);
      } else {
        // Signup flow
        const firstName = payload.firstName as string;
        const lastName = payload.lastName as string;
        const email = payload.email as string;
        const password = payload.password as string;
        
        // Create customer
        await customerCreate({ email, password, firstName, lastName });
        
        // Login after signup
        const tokenResponse = await customerAccessTokenCreate({ email, password });
        const token = tokenResponse.accessToken;
        
        // Set cookie
        document.cookie = `sf_customer_token=${token}; Max-Age=${60 * 60 * 24 * 30}; Path=/`;
        
        // Refresh customer data
        await refreshMe();
        
        // Attach customer to cart for prefilled checkout
        try {
          if (token && cart?.id) await cartBuyerIdentityUpdate(cart.id, { customerAccessToken: token });
        } catch (error) {
          console.error("Failed to attach customer to cart:", error);
        }
        
        router.push(`/${locale}/account?welcome=1`);
      }
    } catch (error: any) {
      alert(error.message || "Authentication failed");
    }
  }

  async function handleLogout() {
    try {
      const token = getCustomerToken();
      if (token) {
        // In a real implementation, you might want to call an API to invalidate the token
        // For now, we'll just remove the cookie
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
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: any = {};
    fd.forEach((v, k) => (payload[k] = v));
    
    try {
      const token = getCustomerToken();
      if (token) {
        const updatedCustomer = await customerUpdateProfile(token, payload);
        setMe({ ...me, ...updatedCustomer });
        alert(t("Account.profileUpdated"));
      }
    } catch (error: any) {
      alert(error.message || t("Account.updateFailed"));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #98a8b8 100%)" }}>
        <div>{t("Account.loading")}</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #98a8b8 100%)" }}>
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="text-center text-lg font-medium">{t("Account.accountAccess")}</h2></div>
            <div className="p-4 space-y-6">
              <form id="login-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("login"); }}>
                <label htmlFor="email" className="text-sm">{t("Account.email")}</label>
                <input name="email" id="email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-none" required />
                <div className="space-y-2">
                <label htmlFor="password" className="text-sm">{t("Account.password")}</label>
                <input name="password" id="password" type="password" className="w-full h-10 px-3 border rounded-none" required />
                </div>
                <Button type="submit" className="w-full">{t("Account.login")}</Button>
              </form>
              <div className="text-center text-sm text-muted-foreground">{t("Account.orCreate")}</div>
              <form id="signup-form" className="space-y-2" onSubmit={(e) => { e.preventDefault(); doAuth("signup"); }}>
                <label htmlFor="name" className="text-sm">{t("Account.fullName")}</label>
                <input name="firstName" placeholder={t("Account.firstName")} className="w-full h-10 px-3 border rounded-none" required />
                <input name="lastName" placeholder={t("Account.lastName")} className="w-full h-10 px-3 border rounded-none" required />
                <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm">{t("Account.email")}</label>
                <input name="email" id="reg-email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-none" required />
                </div>
                <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm">{t("Account.password")}</label>
                <input name="password" id="reg-password" type="password" className="w-full h-10 px-3 border rounded-none" required />
                </div>
                <Button type="submit" className="w-full">{t("Account.createAccount")}</Button>
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
          <h1 className="text-2xl font-medium text-foreground">{t("Account.title")}</h1>
          <Button variant="outline" onClick={handleLogout}>{t("Account.logout")}</Button>
        </div>

        <div className="grid gap-6">
          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">{t("Account.profileInfo")}</h2></div>
            <form className="p-4 space-y-4" onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm">{t("Account.firstName")}</label>
                  <input name="firstName" id="firstName" defaultValue={me?.firstName || ""} className="w-full h-10 px-3 border rounded-none" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm">{t("Account.lastName")}</label>
                  <input name="lastName" id="lastName" defaultValue={me?.lastName || ""} className="w-full h-10 px-3 border rounded-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm">{t("Account.email")}</label>
                <input name="email" id="email" type="email" defaultValue={me?.email || ""} className="w-full h-10 px-3 border rounded-none" />
              </div>
              <Button type="submit">{t("Account.updateProfile")}</Button>
            </form>
          </div>

          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">{t("Account.orderHistory")}</h2></div>
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
                      {t(`Account.orderStatus.${order.financialStatus.toLowerCase()}`) || order.financialStatus}
                    </span>
                  </div>
                </div>
              ))}
              {(!me?.orders?.nodes || me.orders.nodes.length === 0) && (
                <p className="text-muted-foreground text-center py-4">{t("Account.noOrders")}</p>
              )}
            </div>
          </div>

          <div className="border rounded-none">
            <div className="p-4 border-b"><h2 className="font-medium">{t("Account.accountSettings")}</h2></div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm">{t("Account.currentPassword")}</label>
                <input id="current-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm">{t("Account.newPassword")}</label>
                <input id="new-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm">{t("Account.confirmPassword")}</label>
                <input id="confirm-password" type="password" className="w-full h-10 px-3 border rounded-none" />
              </div>
              <Button>{t("Account.updatePassword")}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}