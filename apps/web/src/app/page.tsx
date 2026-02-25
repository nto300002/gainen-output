export const dynamic = "force-dynamic";

import { getPosts, getCategories } from "@/lib/api";
import { PostsSection } from "@/components/posts-section";

export default async function HomePage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  const sorted = [...posts]
    .sort((a, b) => b.is_pinned - a.is_pinned)
    .filter((p) => p.status === "published");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Hero */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            概念
            <span className="text-violet-600 dark:text-violet-400">理解</span>
            ノート
          </h1>
          <p className="mt-3 font-mono text-sm text-zinc-500 dark:text-zinc-400">
            Visualize concepts, deepen understanding
          </p>
        </header>

        <PostsSection posts={sorted} categories={categories} />
      </div>
    </main>
  );
}
