"use client";
import { Truck, Clock, MapPin, Package, Globe, CheckCircle } from "lucide-react";

export default function Delivery() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Shipping & Delivery</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fast, reliable delivery to your doorstep. Here's everything you need to know about our shipping options and policies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="text-center border rounded-lg">
            <div className="p-6">
              <Truck className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">On orders over $100</p>
            </div>
          </div>
          <div className="text-center border rounded-lg">
            <div className="p-6">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Fast Processing</h3>
              <p className="text-sm text-muted-foreground">1-2 business days</p>
            </div>
          </div>
          <div className="text-center border rounded-lg">
            <div className="p-6">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Secure Packaging</h3>
              <p className="text-sm text-muted-foreground">Eco-friendly materials</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="flex items-center gap-2 font-medium"><MapPin className="h-5 w-5" /> Shipping Options</h2></div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Standard Shipping</h4>
                    <p className="text-sm text-muted-foreground">5-7 business days</p>
                  </div>
                  <span className="text-sm border rounded px-2 py-1">$10.00</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Express Shipping</h4>
                    <p className="text-sm text-muted-foreground">2-3 business days</p>
                  </div>
                  <span className="text-sm border rounded px-2 py-1">$20.00</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-black/[0.04]">
                  <div>
                    <h4 className="font-medium">Free Standard Shipping</h4>
                    <p className="text-sm text-muted-foreground">5-7 business days • Orders over $100</p>
                  </div>
                  <span className="text-sm border rounded px-2 py-1">FREE</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Overnight Shipping</h4>
                    <p className="text-sm text-muted-foreground">Next business day</p>
                  </div>
                  <span className="text-sm border rounded px-2 py-1">$35.00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="flex items-center gap-2 font-medium"><Globe className="h-5 w-5" /> Delivery Areas</h2></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Domestic Shipping</h4>
                  <div className="space-y-2">
                    {[
                      "All 50 United States",
                      "Washington D.C.",
                      "Puerto Rico",
                      "APO/FPO addresses",
                    ].map((label) => (
                      <div key={label} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mr-2" /> {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">International Shipping</h4>
                  <div className="space-y-2">
                    {[
                      "Canada",
                      "United Kingdom",
                      "European Union",
                      "Australia & New Zealand",
                    ].map((label) => (
                      <div key={label} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mr-2" /> {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <strong>Note:</strong> International orders may be subject to customs duties and taxes. These fees are not included in our pricing and are the customer's responsibility.
              </div>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">Order Processing & Tracking</h2></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              {["Order Placed", "Processing", "Shipped", "Delivered"].map((label, i) => (
                <div key={label} className="text-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-medium">{i + 1}</div>
                  <h4 className="font-medium mb-2">{label}</h4>
                  <p className="text-sm text-muted-foreground">{i === 0 ? "Confirmation email sent immediately" : i === 1 ? "1-2 business days to prepare" : i === 2 ? "Tracking number provided" : "Package arrives at your door"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-6 text-center">
              <h3 className="font-medium text-foreground mb-2">Questions About Your Delivery?</h3>
              <p className="text-muted-foreground mb-4">Track your order or contact our support team for assistance with shipping questions.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <span className="inline-flex items-center px-3 py-2 border rounded-md text-sm">Track Your Order</span>
                <span className="inline-flex items-center px-3 py-2 border rounded-md text-sm">Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


