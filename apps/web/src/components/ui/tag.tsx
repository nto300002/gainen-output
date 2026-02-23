import type { Tag } from "@/types";

type Props = {
  tag: Tag;
};

export function TagBadge({ tag }: Props) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400">
      {tag.name}
    </span>
  );
}
