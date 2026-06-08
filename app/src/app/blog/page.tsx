import type { Metadata } from "next";

import { getPostStubs } from "@/lib/blog";

import { BlogIndex } from "./BlogIndex";

export const metadata: Metadata = {
  title: "Blog — Matiz",
  description:
    "Ideas sobre tokenización social, bonding curves y la economía del creador.",
};

export default function BlogPage() {
  const posts = getPostStubs();
  return <BlogIndex posts={posts} />;
}
