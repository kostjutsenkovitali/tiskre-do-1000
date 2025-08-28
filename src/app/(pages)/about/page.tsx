// About page – local content using site styles

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-6">About Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We believe in the power of simplicity and the beauty of well-made things.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-medium text-foreground mb-6">Our Story</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Founded in 2020, Minimalist Store emerged from a simple belief: that less can be more.
                We started as a small team passionate about curating products that combine functionality,
                sustainability, and timeless design.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our journey began when we noticed how overwhelmed people felt by endless choices and
                cluttered spaces. We wanted to create a different kind of shopping experience—one that
                values quality over quantity and thoughtful design over fleeting trends.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we work with makers and designers around the world who share our commitment to
                craftsmanship, sustainability, and creating products that truly improve daily life.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-6">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Sustainability</h3>
                <p className="text-sm text-muted-foreground">
                  We prioritize eco-friendly materials and ethical production practices.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Every product is carefully selected for its craftsmanship and durability.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">Purpose</h3>
                <p className="text-sm text-muted-foreground">
                  We believe every item should serve a clear purpose and bring joy.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-8">
            <h2 className="text-2xl font-medium text-foreground mb-6 text-center">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-medium">SJ</span>
                </div>
                <h3 className="font-medium text-foreground">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">Founder & Creative Director</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-black/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-medium">MC</span>
                </div>
                <h3 className="font-medium text-foreground">Michael Chen</h3>
                <p className="text-sm text-muted-foreground">Head of Product Curation</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
