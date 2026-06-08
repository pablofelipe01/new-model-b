"use client";

import Link from "next/link";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { PostStub } from "@/lib/blog";

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function BlogIndex({ posts }: { posts: PostStub[] }) {
  const { lang } = useLanguage();
  const en = lang === "en";

  return (
    <div className="dashboard">
      <div className="page-head">
        <div>
          <div className="label">Blog</div>
          <h1 className="page-title fraunces-italic">
            {en ? "Ideas & updates" : "Ideas y novedades"}
          </h1>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="muted-small">
          {en ? "No posts yet. Coming soon." : "Aún no hay publicaciones. Pronto."}
        </p>
      ) : (
        <div className="blog-grid">
          {posts.map((p) => {
            const m = en ? p.en : p.es;
            return (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="blog-card">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="blog-card-cover" />
                ) : (
                  <div className="blog-card-cover" />
                )}
                <div className="blog-card-body">
                  <div className="blog-card-date">{formatDate(p.date, lang)}</div>
                  <h3>{m.title}</h3>
                  <p>{m.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
