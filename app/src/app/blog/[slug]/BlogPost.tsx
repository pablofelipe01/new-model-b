"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { PostMeta } from "@/lib/blog";

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Props {
  date: string;
  esMeta: PostMeta;
  enMeta: PostMeta;
  es: ReactNode;
  en: ReactNode;
}

export function BlogPost({ date, esMeta, enMeta, es, en }: Props) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const meta = isEn ? enMeta : esMeta;

  return (
    <article className="paper">
      <Link href="/blog" className="back-link">
        ← Blog
      </Link>

      <header className="blog-head">
        <div className="paper-kicker">
          {formatDate(date, lang)}
          {meta.author ? ` · ${meta.author}` : ""}
        </div>
        <h1 className="display-m fraunces-italic" style={{ margin: "12px 0 8px" }}>
          {meta.title}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 17, margin: 0 }}>
          {meta.description}
        </p>
      </header>

      <div className="blog-body">{isEn ? en : es}</div>
    </article>
  );
}
