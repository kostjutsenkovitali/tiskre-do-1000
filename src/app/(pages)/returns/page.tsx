import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Returns() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">Returns & Exchanges</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We want you to be completely satisfied with your purchase. Here's everything you need to know about our return policy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">30-Day Window</h3>
              <p className="text-sm text-muted-foreground">Return items within 30 days of delivery</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Original Condition</h3>
              <p className="text-sm text-muted-foreground">Items must be unused with original packaging</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <RotateCcw className="h-12 w-12 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Easy Process</h3>
              <p className="text-sm text-muted-foreground">Simple online return request system</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                What Can Be Returned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Unworn clothing with tags attached</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Unused accessories in original packaging</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Home items without signs of use</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Electronics in original condition</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Beauty products (unopened)</span>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-3">✓</Badge>
                    <span className="text-muted-foreground">Defective or damaged items</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                What Cannot Be Returned
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Worn or used clothing</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Personalized or custom items</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Opened beauty or hygiene products</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Items returned after 30 days</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Gift cards or digital products</span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-3">✗</Badge>
                    <span className="text-muted-foreground">Final sale items</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Return an Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-medium">1</div>
                  <h4 className="font-medium mb-2">Contact Us</h4>
                  <p className="text-sm text-muted-foreground">Email support@minimalist-store.com with your order number</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-medium">2</div>
                  <h4 className="font-medium mb-2">Get Label</h4>
                  <p className="text-sm text-muted-foreground">We'll send you a prepaid return shipping label</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-medium">3</div>
                  <h4 className="font-medium mb-2">Pack Items</h4>
                  <p className="text-sm text-muted-foreground">Securely package items in original packaging</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-medium">4</div>
                  <h4 className="font-medium mb-2">Ship Back</h4>
                  <p className="text-sm text-muted-foreground">Drop off at any authorized shipping location</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refund Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Processing Time</h4>
                  <p className="text-muted-foreground text-sm">
                    Refunds are processed within 5-7 business days after we receive your return. 
                    The refund will appear on your original payment method within 3-5 business days.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Return Shipping</h4>
                  <p className="text-muted-foreground text-sm">
                    Return shipping is free for defective items. For other returns, a $10 
                    return shipping fee will be deducted from your refund.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-medium text-foreground mb-2">Need Help with a Return?</h3>
              <p className="text-muted-foreground mb-4">
                Our customer service team is here to make the return process as smooth as possible.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button>
                  Start Return Request
                </Button>
                <Button variant="outline">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


