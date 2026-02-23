import Link from "next/link";
import Image from "next/image";
import type { PostWithRelations } from "@/types";
import { TagBadge } from "@/components/ui/tag";
import { CategoryBadge } from "@/components/ui/category-badge";

type Props = {
  post: PostWithRelations;
};

export function PostCard({ post }: Props) {
  const category = post.category_name
    ? { id: post.category_id!, name: post.category_name, color: post.category_color, slug: "", sort_order: 0, created_at: "" }
    : null;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      {post.is_pinned === 1 && (
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          📌 Pin
        </span>
      )}

      {post.image_key && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <Image
            src={`/${post.image_key}`}
            alt={post.title}
            width={600}
            height={300}
            className="h-40 w-full object-cover"
          />
        </div>
      )}

      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400">
        {post.title}
      </h2>

      <div className="mb-3 flex flex-wrap gap-1">
        {category && (
          <CategoryBadge category={{ ...category, color: category.color ?? null, slug: category.slug, sort_order: category.sort_order, created_at: category.created_at }} />
        )}
        {post.tags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} />
        ))}
      </div>

      <time
        className="mt-auto text-xs text-zinc-500 dark:text-zinc-400"
        dateTime={post.created_at}
      >
        {new Date(post.created_at).toLocaleDateString("ja-JP")}
      </time>
    </Link>
  );
}
