import Link from "next/link";
import { getPosts } from "@/lib/api";
import { DeletePostButton } from "@/components/delete-post-button";

export default async function AdminPage() {
  const posts = await getPosts();
  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">ダッシュボード</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          新規投稿
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#161B22]">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">公開中</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{published.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#161B22]">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">下書き</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{drafts.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#161B22]">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">全記事</h2>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{post.title}</p>
                <p className="text-xs text-zinc-500">{post.status}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/edit/${post.slug}`}
                  className="text-sm text-violet-600 hover:underline"
                >
                  編集
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
