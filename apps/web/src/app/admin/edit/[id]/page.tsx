"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPost, getCategories, getTags, updatePost } from "@/lib/api";
import { MarkdownEditor } from "@/components/markdown-editor";
import type { Category, Tag } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
      Promise.all([getPost(resolvedId), getCategories(), getTags()]).then(([post, cats, tgs]) => {
        setTitle(post.title);
        setBody(post.body);
        setCategoryId(post.category_id ?? "");
        setSelectedTagIds(post.tags.map((t) => t.id));
        setCategories(cats);
        setTags(tgs);
        setInitialized(true);
      });
    });
  }, [params]);

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleSave() {
    if (!id) return;
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePost(id, {
        title,
        body,
        category_id: categoryId || null,
        tag_ids: selectedTagIds,
      });
      router.push("/admin");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) {
    return <div className="p-8 text-zinc-500">読み込み中...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">投稿を編集</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            タイトル
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            カテゴリ
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">カテゴリなし</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">タグ</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedTagIds.includes(tag.id)
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">本文</p>
          <MarkdownEditor value={body} onChange={setBody} />
        </div>

        <div>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
