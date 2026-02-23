"use client";

import { useState } from "react";
import type { Category } from "@/types";

type Props = {
  categories: Category[];
  onFilter: (categoryId: string | null) => void;
};

export function CategoryFilter({ categories, onFilter }: Props) {
  const [active, setActive] = useState<string | null>(null);

  function handleClick(id: string | null) {
    setActive(id);
    onFilter(id);
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="カテゴリフィルター">
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

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={active === category.id}
          onClick={() => handleClick(category.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === category.id
              ? "bg-violet-600 text-white shadow-sm"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:ring-violet-300 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
