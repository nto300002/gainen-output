import type { Category } from "@/types";

type Props = {
  category: Category;
};

export function CategoryBadge({ category }: Props) {
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-400 px-2 py-0.5 text-xs font-medium text-indigo-500 dark:border-indigo-500 dark:text-indigo-400">
      {category.name}
    </span>
  );
}
