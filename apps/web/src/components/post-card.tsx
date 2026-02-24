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
    ? {
        id: post.category_id!,
        name: post.category_name,
        color: post.category_color ?? null,
        slug: "",
        sort_order: 0,
        created_at: "",
      }
    : null;

  const date = new Date(post.created_at).toLocaleDateString("sv-SE"); // YYYY-MM-DD

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-violet-100 transition-shadow hover:shadow-md dark:bg-zinc-900 dark:ring-zinc-800"
    >
      {/* Image / Concept visualization area */}
      <div className="relative h-44 overflow-hidden bg-violet-50 dark:bg-violet-950/20">
        {/* Dot grid pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, #a78bfa 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {post.image_key ? (
          <Image
            src={`/api/images/${post.image_key}`}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-cyan-300 to-sky-400 shadow-sm" />
            <span className="text-lg font-light text-violet-300 dark:text-violet-700">—</span>
            <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-sm" />
          </div>
        )}

        {/* PIN badge */}
        {post.is_pinned === 1 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
            📌 PIN
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {category && <CategoryBadge category={category} />}

        <h2 className="text-base font-semibold leading-snug text-zinc-900 group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-400">
          {post.title}
        </h2>

        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(post.tags ?? []).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        <time
          className="mt-auto pt-1 text-xs text-zinc-400 dark:text-zinc-500"
          dateTime={post.created_at}
        >
          {date}
        </time>
      </div>
    </Link>
  );
}
