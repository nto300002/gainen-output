"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPost, getCategories, getTags, updatePost, uploadImage, deleteCategory, deleteTag } from "@/lib/api";
import { useCanvaExport } from "@/hooks/useCanvaExport";
import { MarkdownEditor } from "@/components/markdown-editor";
import type { Category, Tag } from "@/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditPostPage({ params }: Props) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // SSR-safe: window.location.origin is set in useEffect (client-only)
  const [apiOrigin, setApiOrigin] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { sessionToken } = useCanvaExport({
    onExport: (imageKey) => {
      setImagePreview(`/api/images/${imageKey}`);
      setImageKey(imageKey);
    },
  });

  useEffect(() => {
    setApiOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    params.then(({ id: slug }) => {
      Promise.all([getPost(slug), getCategories(), getTags()]).then(([post, cats, tgs]) => {
        setPostId(post.id);
        setTitle(post.title);
        setBody(post.body);
        setCategoryId(post.category_id ?? "");
        setSelectedTagIds(post.tags.map((t) => t.id));
        setImageKey(post.image_key);
        if (post.image_key) setImagePreview(`/api/images/${post.image_key}`);
        setCategories(cats);
        setTags(tgs);
        setInitialized(true);
      });
    });
  }, [params]);

  async function handleDeleteCategory(id: string) {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (categoryId === id) setCategoryId("");
  }

  async function handleDeleteTag(id: string) {
    await deleteTag(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    setSelectedTagIds((prev) => prev.filter((t) => t !== id));
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleFile(file: File) {
    setImagePreview(URL.createObjectURL(file));
    setImageLoading(true);
    try {
      const result = await uploadImage(file);
      setImageKey(result.key);
    } catch {
      setError("画像のアップロードに失敗しました");
      setImagePreview(null);
    } finally {
      setImageLoading(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    handleFile(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    const file = item?.getAsFile();
    if (!file) return;
    handleFile(file);
  }

  async function handleSave() {
    if (!postId) return;
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updatePost(postId, {
        title,
        body,
        category_id: categoryId || null,
        tag_ids: selectedTagIds,
        image_key: imageKey,
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
          <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">カテゴリ</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="inline-flex items-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    categoryId === cat.id
                      ? "bg-violet-600 text-white"
                      : "bg-white text-zinc-700 hover:bg-violet-50 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {cat.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id)}
                  aria-label={`${cat.name}を削除`}
                  className="border-l border-zinc-200 px-1.5 py-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:hover:bg-red-900/20"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">タグ</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? "bg-violet-600 text-white"
                      : "bg-white text-zinc-700 hover:bg-violet-50 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {tag.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id)}
                  aria-label={`${tag.name}を削除`}
                  className="border-l border-zinc-200 px-1.5 py-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:hover:bg-red-900/20"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 概念作成 & 画像アップロード */}
        <div
          role="region"
          aria-label="画像ドロップゾーン"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`flex flex-col gap-2 rounded-lg transition-colors ${
            isDragOver
              ? "ring-2 ring-violet-400 bg-violet-50 dark:bg-violet-950/20"
              : ""
          }`}
        >
          {isDragOver && (
            <div className="pointer-events-none flex items-center justify-center rounded-lg border-2 border-dashed border-violet-400 py-6 text-sm font-medium text-violet-600 dark:text-violet-400">
              ドロップして追加
            </div>
          )}
          <div className="flex gap-2">
            <a
              href={`https://www.canva.com/apps/${process.env.NEXT_PUBLIC_CANVA_APP_ID ?? ""}?session=${sessionToken}&api=${apiOrigin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#7C3AED" opacity="0.2"/>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#7C3AED"/>
              </svg>
              概念作成
            </a>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={imageLoading}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {imageLoading ? "アップロード中..." : "画像をアップロード"}
            </button>
          </div>
          {imagePreview && (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="プレビュー" className="h-32 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageKey(null); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs text-white hover:bg-zinc-900"
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
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
