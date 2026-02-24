"use client";

import { useState, useMemo } from "react";
import { CategoryFilter } from "./category-filter";
import { TagFilter } from "./tag-filter";
import { PostCard } from "./post-card";
import type { Category, PostWithRelations } from "@/types";

type Props = {
  posts: PostWithRelations[];
  categories: Category[];
};

export function PostsSection({ posts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const uniqueTags = useMemo(() => {
    const seen = new Set<string>();
    const tags = [];
    for (const post of posts) {
      for (const tag of post.tags) {
        if (!seen.has(tag.id)) {
          seen.add(tag.id);
          tags.push(tag);
        }
      }
    }
    return tags;
  }, [posts]);

  const filtered = posts.filter((p) => {
    if (activeCategory && p.category_id !== activeCategory) return false;
    if (activeTag && !p.tags.some((t) => t.id === activeTag)) return false;
    return true;
  });

  return (
    <>
      <div className="mb-4">
        <CategoryFilter categories={categories} onFilter={setActiveCategory} />
      </div>
      {uniqueTags.length > 0 && (
        <div className="mb-6">
          <TagFilter tags={uniqueTags} onFilter={setActiveTag} />
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
