import ReactMarkdown from "react-markdown";
import type { PostWithRelations } from "@/types";
import { PostCard } from "@/components/post-card";

type Props = {
  post: PostWithRelations;
  relatedPosts?: PostWithRelations[];
};

export function PostViewer({ post, relatedPosts = [] }: Props) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        {post.title}
      </h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown>{post.body.replace(/\\n/g, "\n")}</ReactMarkdown>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            関連記事
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedPosts.map((related) => (
              <PostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
