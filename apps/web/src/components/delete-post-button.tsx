"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/api";

type Props = { postId: string };

export function DeletePostButton({ postId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("この投稿を削除しますか？")) return;
    setLoading(true);
    try {
      await deletePost(postId);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "..." : "削除"}
    </button>
  );
}
