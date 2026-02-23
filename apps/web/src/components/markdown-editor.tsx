"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after = "") {
    onChange(`${before}${value}${after}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <button
          type="button"
          aria-label="Bold"
          className="rounded px-2 py-1 text-sm font-bold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={() => insert("**", "**")}
        >
          B
        </button>
        <button
          type="button"
          aria-label="H1 Heading"
          className="rounded px-2 py-1 text-sm font-bold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          onClick={() => insert("# ")}
        >
          H1
        </button>
      </div>

      <textarea
        ref={ref}
        className="min-h-64 w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
      />
    </div>
  );
}
