import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { getAllSlugs, getPost } from "@/lib/blog";

import { BlogPost } from "./BlogPost";

const mdxOptions = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
};

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: "Blog — Matiz" };
  // Default metadata to Spanish (primary market); per-page, single language.
  return {
    title: `${post.es.title} — Matiz`,
    description: post.es.description,
    openGraph: {
      title: post.es.title,
      description: post.es.description,
      type: "article",
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <BlogPost
      date={post.date}
      esMeta={post.es}
      enMeta={post.en}
      es={<MDXRemote source={post.bodyEs} options={mdxOptions} />}
      en={<MDXRemote source={post.bodyEn} options={mdxOptions} />}
    />
  );
}
