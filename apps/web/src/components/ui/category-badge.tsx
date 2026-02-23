import type { Category } from "@/types";

type Props = {
  category: Category;
};

export function CategoryBadge({ category }: Props) {
  const color = category.color ?? "#6366f1";
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: color, color }}
    >
      {category.name}
    </span>
  );
}
