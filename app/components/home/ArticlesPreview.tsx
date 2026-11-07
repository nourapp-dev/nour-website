"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { createClient } from "../../../src/lib/supabase/client";
import { getPublicArticles } from "../../../src/features/articles/public-articles";
import ArticleCard from "../../../src/features/articles/ArticleCard";
import { languageHref } from "../../../src/core/i18n/public-language";
export default function ArticlesPreview({
  language,
}: {
  language: "ar" | "en";
}) {
  const ar = language === "ar",
    client = useMemo(() => createClient("pilgrim"), []);
  const q = useQuery({
    queryKey: ["public", "articles"],
    queryFn: () => getPublicArticles(client),
    staleTime: 60000,
  });
  if (!q.isPending && !q.isError && !q.data?.length) return null;
  return (
    <section className="articles-preview" dir={ar ? "rtl" : "ltr"}>
      <div className="nr-container">
        <header>
          <h2>
            {ar
              ? "مقالات وإرشادات تساعدك في رحلتك"
              : "Articles and guides for your journey"}
          </h2>
          <Link href={languageHref("/articles", language)}>
            {ar ? "جميع المقالات" : "All articles"}
          </Link>
        </header>
        {q.isPending ? (
          <p role="status">
            {ar ? "جارٍ تحميل المقالات…" : "Loading articles…"}
          </p>
        ) : q.isError ? (
          <p role="alert">
            {ar ? "تعذر تحميل المقالات." : "Articles could not be loaded."}{" "}
            <button onClick={() => void q.refetch()}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </p>
        ) : (
          <div className="articles-grid">
            {q.data?.slice(0, 3).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .articles-preview {
          padding: 70px 0;
          background: var(--nour-background);
          color: var(--nour-text-primary);
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          margin-bottom: 26px;
        }
        h2 {
          font-size: clamp(26px, 3vw, 36px);
          line-height: 1.5;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 300px), 1fr)
          );
          gap: 24px;
        }
        a {
          color: #176fe8;
          font-weight: 700;
          white-space: nowrap;
        }
        button {
          font: inherit;
          padding: 10px 16px;
        }
        @media (max-width: 700px) {
          header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
