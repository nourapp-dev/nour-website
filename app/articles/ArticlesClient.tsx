"use client";
import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "../../src/core/i18n";
import { createClient } from "../../src/lib/supabase/client";
import {
  getPublicArticles,
  articleCategory,
} from "../../src/features/articles/public-articles";
import ArticleCard from "../../src/features/articles/ArticleCard";
import { languageHref } from "../../src/core/i18n/public-language";
export default function ArticlesClient() {
  return (
    <Suspense fallback={<p>تحميل المقالات / Loading articles…</p>}>
      <ArticleList />
    </Suspense>
  );
}
function ArticleList() {
  const { language } = useLanguage(),
    ar = language === "ar",
    client = useMemo(() => createClient("pilgrim"), []),
    params = useSearchParams(),
    router = useRouter();
  const category = params.get("category") || "all";
  const q = useQuery({
    queryKey: ["public", "articles"],
    queryFn: () => getPublicArticles(client),
    staleTime: 60000,
  });
  const categories = [
    ...new Map(
      (q.data ?? [])
        .map(articleCategory)
        .filter((c) => c != null)
        .map((c) => [c.id, c]),
    ).values(),
  ];
  const articles = (q.data ?? []).filter(
    (a) => category === "all" || a.category_id === category,
  );
  return (
    <main className="nour-redesign articles-page" dir={ar ? "rtl" : "ltr"}>
      <div className="nr-container">
        <header>
          <span>{ar ? "مركز المعرفة" : "Knowledge center"}</span>
          <h1>
            {ar
              ? "مقالات وإرشادات لرحلتك"
              : "Articles and guides for your journey"}
          </h1>
          <p>
            {ar
              ? "اطّلع على المحتوى المنشور والتصنيفات المتاحة."
              : "Explore published articles and their categories."}
          </p>
        </header>
        <label>
          {ar ? "التصنيف" : "Category"}
          <select
            value={category}
            onChange={(e) => {
              const next = new URLSearchParams(params.toString());
              if (e.target.value === "all") next.delete("category");
              else next.set("category", e.target.value);
              router.replace(
                languageHref(
                  "/articles" + (next.size ? "?" + next : ""),
                  language,
                ),
                { scroll: false },
              );
            }}
          >
            <option value="all">
              {ar ? "كل التصنيفات" : "All categories"}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {ar ? c.name_ar : c.name_en}
              </option>
            ))}
          </select>
        </label>
        {q.isPending ? (
          <p role="status">
            {ar ? "جارٍ تحميل المقالات…" : "Loading articles…"}
          </p>
        ) : q.isError ? (
          <div role="alert">
            <p>
              {ar ? "تعذر تحميل المقالات." : "Articles could not be loaded."}
            </p>
            <button onClick={() => void q.refetch()}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : !articles.length ? (
          <p role="status">
            {q.data?.length
              ? ar
                ? "لا توجد مقالات تطابق التصنيف."
                : "No articles in this category."
              : ar
                ? "لا توجد مقالات منشورة حاليًا."
                : "No published articles right now."}
          </p>
        ) : (
          <>
            <p role="status">
              {articles.length} {ar ? "مقالات" : "articles"}
            </p>
            <div className="articles-grid">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  language={language}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .articles-page {
          padding: 70px 0;
          background: var(--nour-background);
          color: var(--nour-text-primary);
          min-height: 70vh;
        }
        header {
          max-width: 900px;
          margin-bottom: 30px;
        }
        h1 {
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1.5;
        }
        p {
          line-height: 1.8;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 300px), 1fr)
          );
          gap: 24px;
        }
        select,
        button {
          padding: 10px 16px;
          border: 1px solid var(--nour-border);
          border-radius: 10px;
          background: var(--nour-surface);
          color: inherit;
          font: inherit;
          min-height: 44px;
        }
        label {
          display: grid;
          gap: 8px;
          max-width: 360px;
        }
      `}</style>
    </main>
  );
}
