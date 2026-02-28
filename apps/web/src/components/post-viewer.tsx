import type { PostWithRelations } from "@/types";
import { PostCard } from "@/components/post-card";
import { MarkdownContent } from "@/components/markdown-content";

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

      {post.image_key && (
        <div className="mb-8 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images/${post.image_key}`}
            alt="アイキャッチ画像"
            className="w-full object-cover"
          />
        </div>
      )}

      <div className="rounded-xl bg-white p-8 dark:bg-[#161B22]">
        <MarkdownContent className="prose prose-zinc dark:prose-invert max-w-none">
          {post.body}
        </MarkdownContent>
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
