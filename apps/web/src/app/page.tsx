import { getPosts, getCategories } from "@/lib/api";
import { PostCard } from "@/components/post-card";
import { DotGrid } from "@/components/ui/dot-grid";

export default async function HomePage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  const sorted = [...posts].sort((a, b) => b.is_pinned - a.is_pinned);
  const published = sorted.filter((p) => p.status === "published");

  return (
    <main className="relative min-h-screen bg-zinc-50 dark:bg-[#0D1117]">
      <DotGrid />

      <div className="relative mx-auto max-w-4xl px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            概念理解ノート
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            学びの記録と概念整理
          </p>
        </header>

        <section>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
