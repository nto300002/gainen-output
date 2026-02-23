"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/lib/api";

type UploadResult = { key: string; url: string };

type Props = {
  onUpload: (result: UploadResult) => void;
};

export function ImageUploader({ onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      const result = await uploadImage(file);
      onUpload(result);
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-900"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {loading ? (
          <span>Uploading...</span>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="h-full w-full object-contain" />
        ) : (
          <span>画像をドロップまたはクリックしてアップロード</span>
        )}
      </div>

      <input
        ref={inputRef}
        data-testid="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
