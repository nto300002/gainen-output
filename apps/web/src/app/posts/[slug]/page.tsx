import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getPosts } from "@/lib/api";
import { PostViewer } from "@/components/post-viewer";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPost(slug);
    return { title: post.title };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPost(slug);
  } catch {
    notFound();
  }

  const allPosts = await getPosts();
  const relatedPosts = allPosts.filter(
    (p) => p.id !== post.id && p.category_id === post.category_id && p.status === "published"
  );

  return <PostViewer post={post} relatedPosts={relatedPosts} />;
}
