"use client";

import { useState } from "react";
import { CategoryFilter } from "./category-filter";
import { PostCard } from "./post-card";
import type { Category, PostWithRelations } from "@/types";

type Props = {
  posts: PostWithRelations[];
  categories: Category[];
};

export function PostsSection({ posts, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? posts.filter((p) => p.category_id === activeCategory)
    : posts;

  return (
    <>
      <div className="mb-6">
        <CategoryFilter categories={categories} onFilter={setActiveCategory} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  );
}
