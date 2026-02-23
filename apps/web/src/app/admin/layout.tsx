import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0D1117]">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#161B22]">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link href="/admin" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            管理画面
          </Link>
          <Link href="/admin/new" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
            新規投稿
          </Link>
          <Link href="/" className="ml-auto text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-500">
            サイトへ戻る
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
