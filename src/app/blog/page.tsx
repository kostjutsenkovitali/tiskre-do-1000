import { getPosts } from "@/lib/wpData";
import Link from "next/link";

export const revalidate = 300;

export default async function BlogIndexPage() {
  const posts = await getPosts(20);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="hover:underline font-medium">
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}



