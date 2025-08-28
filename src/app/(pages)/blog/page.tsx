"use client";
import Link from "next/link";

type MockPost = {
  id: string;
  title: string;
  image: string;
  date: string;
  author: string;
  excerpt: string;
};

const mockBlogPosts: MockPost[] = [
  {
    id: "1",
    title: "Designing With Less",
    image: "/about-img-2.webp",
    date: "2024-01-20",
    author: "Jane Smith",
    excerpt: "A practical guide to embracing minimalism in your everyday life.",
  },
  {
    id: "2",
    title: "Materials That Last",
    image: "/about-img-1.webp",
    date: "2024-01-15",
    author: "Alex Brown",
    excerpt: "Why durable materials save money and reduce waste.",
  },
  {
    id: "3",
    title: "Calm Spaces, Clear Minds",
    image: "/hero-image1.webp",
    date: "2024-01-10",
    author: "Sam Lee",
    excerpt: "How to reduce visual noise and improve focus at home.",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-foreground mb-4">Blog</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Insights on minimalist living, sustainable choices, and thoughtful design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockBlogPosts.map((post) => (
            <article key={post.id} className="group overflow-hidden border rounded-lg hover:border-black/20 transition-colors">
              <Link href={`/pages/blogpost?id=${post.id}`}>
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              <div className="p-6">
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <span>{post.author}</span>
                </div>

                <Link href={`/pages/blogpost?id=${post.id}`}>
                  <h2 className="text-xl font-medium text-foreground group-hover:text-black/70 transition-colors mb-3">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>

                <Link
                  href={`/pages/blogpost?id=${post.id}`}
                  className="inline-block mt-4 text-sm font-medium hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}


