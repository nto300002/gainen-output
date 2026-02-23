import type { Tag } from "@/types";

type Props = {
  tag: Tag;
};

export function TagBadge({ tag }: Props) {
  return (
    <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
      {tag.name}
    </span>
  );
}
