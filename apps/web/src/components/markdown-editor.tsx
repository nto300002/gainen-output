"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  function insert(before: string, after = "") {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(next);
    // カーソルを挿入後に移動
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    });
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      {/* タブバー */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-2 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mode === "edit"
                ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              mode === "preview"
                ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            プレビュー
          </button>
        </div>

        {/* 編集モード時のみツールバー表示 */}
        {mode === "edit" && (
          <div className="flex gap-1 py-1">
            <button
              type="button"
              aria-label="Bold"
              className="rounded px-2 py-0.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("**", "**")}
            >
              B
            </button>
            <button
              type="button"
              aria-label="Italic"
              className="rounded px-2 py-0.5 text-xs italic text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("_", "_")}
            >
              I
            </button>
            <button
              type="button"
              aria-label="H1 Heading"
              className="rounded px-2 py-0.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("# ")}
            >
              H1
            </button>
            <button
              type="button"
              aria-label="H2 Heading"
              className="rounded px-2 py-0.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("## ")}
            >
              H2
            </button>
            <button
              type="button"
              aria-label="Code"
              className="rounded px-2 py-0.5 font-mono text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("`", "`")}
            >
              {"</>"}
            </button>
            <button
              type="button"
              aria-label="Code block"
              className="rounded px-2 py-0.5 font-mono text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("```\n", "\n```")}
            >
              {"```"}
            </button>
            <button
              type="button"
              aria-label="Link"
              className="rounded px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() => insert("[", "](url)")}
            >
              Link
            </button>
          </div>
        )}
      </div>

      {/* 編集エリア */}
      {mode === "edit" ? (
        <textarea
          ref={ref}
          className="min-h-64 w-full resize-y bg-white p-3 font-mono text-sm focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
        />
      ) : (
        <div className="min-h-64 bg-white p-4 dark:bg-zinc-900">
          {value.trim() ? (
            <div className="prose prose-zinc max-w-none dark:prose-invert">
              <ReactMarkdown>{value.replace(/\\n/g, "\n")}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              本文を入力するとプレビューが表示されます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
