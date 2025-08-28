"use client";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="border rounded-lg">
            <div className="p-4 border-b"><h2 className="font-medium">Send us a Message</h2></div>
            <div className="p-6">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm">First Name</label>
                    <input id="firstName" placeholder="John" className="w-full h-10 px-3 border rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm">Last Name</label>
                    <input id="lastName" placeholder="Doe" className="w-full h-10 px-3 border rounded-md" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm">Email</label>
                  <input id="email" type="email" placeholder="john@example.com" className="w-full h-10 px-3 border rounded-md" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm">Subject</label>
                  <input id="subject" placeholder="How can we help?" className="w-full h-10 px-3 border rounded-md" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm">Message</label>
                  <textarea id="message" placeholder="Tell us more about your inquiry..." rows={6} className="w-full px-3 py-2 border rounded-md" />
                </div>

                <Button className="w-full">Send Message</Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">Contact Information</h2></div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">Email</h3>
                    <p className="text-muted-foreground">hello@minimalist-store.com</p>
                    <p className="text-muted-foreground">support@minimalist-store.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">Phone</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9am-6pm EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-1" />
                  <div>
                    <h3 className="font-medium text-foreground">Address</h3>
                    <p className="text-muted-foreground">
                      123 Minimalist Street
                      <br />Design District
                      <br />New York, NY 10001
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg">
              <div className="p-4 border-b"><h2 className="font-medium">Business Hours</h2></div>
              <div className="p-6 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Monday - Friday</span><span className="font-medium">9:00 AM - 6:00 PM</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Saturday</span><span className="font-medium">10:00 AM - 4:00 PM</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sunday</span><span className="font-medium">Closed</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


