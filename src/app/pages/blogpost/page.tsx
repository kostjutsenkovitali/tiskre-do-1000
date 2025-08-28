"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

type MockPost = {
  id: string;
  title: string;
  image: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
};

const mockBlogPosts: MockPost[] = [
  {
    id: "1",
    title: "Designing With Less",
    image: "/about-img-2.webp",
    date: "2024-01-20",
    author: "Jane Smith",
    excerpt: "A practical guide to embracing minimalism in your everyday life.",
    content: "Minimalism is about clarity and purpose.\nIt helps remove friction from daily routines.\nStart small: one room, one shelf, one habit.",
  },
  {
    id: "2",
    title: "Materials That Last",
    image: "/about-img-1.webp",
    date: "2024-01-15",
    author: "Alex Brown",
    excerpt: "Why durable materials save money and reduce waste.",
    content: "Choose materials with proven longevity.\nRepair beats replace.\nQuality pays for itself over time.",
  },
];

export default function BlogPost() {
  const search = useSearchParams();
  const id = search.get("id") || "";

  const post = useMemo(() => mockBlogPosts.find((p) => p.id === id), [id]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Post Not Found</h1>
          <Link href="/blog">
            <Button>Return to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/blog"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Link>

        <article>
          <div className="aspect-video rounded-lg overflow-hidden mb-8">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          <header className="mb-8">
            <h1 className="text-3xl font-medium text-foreground mb-4">{post.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <span>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="mx-3">•</span>
              <span>By {post.author}</span>
            </div>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{post.excerpt}</p>
            <div className="text-foreground leading-relaxed space-y-4">
              {post.content.split("\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center mr-4">
                <span className="font-medium">
                  {post.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">{post.author}</h3>
                <p className="text-sm text-muted-foreground">Writer & Minimalist</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}


