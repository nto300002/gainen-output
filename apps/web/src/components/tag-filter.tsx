"use client";

import { useState } from "react";
import type { Tag } from "@/types";

type Props = {
  tags: Tag[];
  onFilter: (tagId: string | null) => void;
};

export function TagFilter({ tags, onFilter }: Props) {
  const [active, setActive] = useState<string | null>(null);

  if (tags.length === 0) return null;

  function handleClick(id: string | null) {
    setActive(id);
    onFilter(id);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="タグフィルター">
      <button
        type="button"
        aria-pressed={active === null}
        onClick={() => handleClick(null)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active === null
            ? "bg-violet-600 text-white shadow-sm"
            : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-violet-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
        }`}
      >
        All
      </button>

      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          aria-pressed={active === tag.id}
          onClick={() => handleClick(tag.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === tag.id
              ? "bg-violet-600 text-white shadow-sm"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-violet-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
