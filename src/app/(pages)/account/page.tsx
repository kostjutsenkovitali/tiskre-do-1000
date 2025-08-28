"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const user = {
    name: "John Doe",
    email: "john@example.com",
    address: "123 Main St, City, State 12345",
  };

  const orders = [
    { id: "ORD001", date: "2024-01-20", status: "delivered", total: 165, items: 2 },
    { id: "ORD002", date: "2024-01-15", status: "processing", total: 45, items: 1 },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16">
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="text-center text-lg font-medium">Account Access</h2></div>
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm">Email</label>
                <input id="email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm">Password</label>
                <input id="password" type="password" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <Button className="w-full" onClick={() => setIsLoggedIn(true)}>Login</Button>
              <div className="text-center text-sm text-muted-foreground">— or create an account —</div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm">Full Name</label>
                <input id="name" placeholder="John Doe" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm">Email</label>
                <input id="reg-email" type="email" placeholder="your@email.com" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm">Password</label>
                <input id="reg-password" type="password" className="w-full h-10 px-3 border rounded-md" />
              </div>
              <Button className="w-full" onClick={() => setIsLoggedIn(true)}>Create Account</Button>
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
          <Button variant="outline" onClick={() => setIsLoggedIn(false)}>Logout</Button>
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
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleDateString()} • {order.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total}</p>
                    <span className={"inline-flex items-center px-2 py-1 text-xs rounded-md " + (order.status === "delivered" ? "bg-black text-white" : "bg-gray-200")}>{order.status}</span>
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


