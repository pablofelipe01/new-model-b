import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { Lang } from "@/lib/i18n";

/**
 * File-based bilingual blog.
 *
 * Each post is a folder under content/blog/<slug>/ with one MDX file per
 * language (es.mdx, en.mdx). Frontmatter holds the per-language title,
 * description, etc. The slug (folder name) is the shared URL; the language
 * toggle swaps the rendered content, mirroring the rest of the site.
 *
 * Covers, if any, live in /public (e.g. /blog/<slug>.jpg) and are referenced
 * by the `cover` frontmatter field, since only /public is web-served.
 */
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface PostMeta {
  title: string;
  description: string;
  date: string; // ISO date string
  author?: string;
  tags?: string[];
  cover?: string;
  draft?: boolean;
}

export interface PostStub {
  slug: string;
  date: string;
  cover?: string;
  es: PostMeta;
  en: PostMeta;
}

export interface Post extends PostStub {
  bodyEs: string;
  bodyEn: string;
}

function readLang(slug: string, lang: Lang): { meta: PostMeta; body: string } | null {
  const file = path.join(BLOG_DIR, slug, `${lang}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const meta: PostMeta = {
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: data.date ? new Date(data.date).toISOString() : new Date(0).toISOString(),
    author: data.author ? String(data.author) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    cover: data.cover ? String(data.cover) : undefined,
    draft: Boolean(data.draft),
  };
  return { meta, body: content };
}

/** All post slugs that have at least one language file. */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) =>
      ["es", "en"].some((l) =>
        fs.existsSync(path.join(BLOG_DIR, slug, `${l}.mdx`)),
      ),
    );
}

/** Full post (both languages) by slug, or null if missing. */
export function getPost(slug: string): Post | null {
  const es = readLang(slug, "es");
  const en = readLang(slug, "en");
  // A language without its own file falls back to the other one's content.
  const primary = es ?? en;
  if (!primary) return null;
  const esResolved = es ?? primary;
  const enResolved = en ?? primary;
  return {
    slug,
    date: primary.meta.date,
    cover: primary.meta.cover,
    es: esResolved.meta,
    en: enResolved.meta,
    bodyEs: esResolved.body,
    bodyEn: enResolved.body,
  };
}

/** Published post stubs (no body), newest first. Drafts are excluded. */
export function getPostStubs(): PostStub[] {
  return getAllSlugs()
    .map((slug) => getPost(slug))
    .filter((p): p is Post => p !== null)
    .filter((p) => !p.es.draft && !p.en.draft)
    .map(({ bodyEs: _e, bodyEn: _n, ...stub }) => stub)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
