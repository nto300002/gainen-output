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
            ? "bg-violet-600 text-white"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        すべて
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-pressed={active === category.id}
          onClick={() => handleClick(category.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === category.id
              ? "bg-violet-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
