import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // セッション検証（Workers に直接問い合わせ）
  const cookieStore = await cookies();
  const apiUrl = process.env.API_URL ?? "http://localhost:8787";

  const res = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0D1117]">
      <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#161B22]">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
          >
            管理画面
          </Link>
          <Link
            href="/admin/new"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
          >
            新規投稿
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-500"
          >
            サイトへ戻る
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
