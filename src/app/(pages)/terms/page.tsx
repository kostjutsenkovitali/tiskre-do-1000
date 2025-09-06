import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Make this page statically generated
export const dynamic = 'force-static';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service apply to all visitors, users, and others who access or use our service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from materials</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Product Information & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We strive to provide accurate product descriptions and pricing information. However, we do not warrant that product descriptions, pricing, or other content is accurate, complete, reliable, current, or error-free.
              </p>
              <p className="text-muted-foreground">
                All prices are subject to change without notice. We reserve the right to modify or discontinue products at any time without prior notice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Order Acceptance & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your order is an offer to purchase products from us. We reserve the right to accept or decline your order for any reason. Payment must be received before we ship your order.
              </p>
              <p className="text-muted-foreground">
                We accept major credit cards, PayPal, and other payment methods as displayed during checkout. All payments are processed securely through encrypted connections.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your privacy is important to us. We collect and use your information only as necessary to process your orders and provide customer service. We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use materials on our website, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                These terms and conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="text-center text-muted-foreground">
            <p>
              If you have any questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:legal@minimalist-store.com" className="underline">legal@minimalist-store.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}