import { wpRequest } from "@/lib/wpClient";

export const revalidate = 300;

const QUERY_POST_BY_SLUG = /* GraphQL */ `
  query PostBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      content
      date
    }
  }
`;

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const data = await wpRequest<{ post: { title: string; content: string } }>(QUERY_POST_BY_SLUG, { slug });
  const post = data.post;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{post?.title}</h1>
      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: post?.content || "" }} />
    </div>
  );
}


