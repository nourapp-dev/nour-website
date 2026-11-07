"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicArticle,
  getPublicArticles,
} from "../../../src/features/articles/public-articles";
import ArticleCard from "../../../src/features/articles/ArticleCard";
import { languageHref } from "../../../src/core/i18n/public-language";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";

type ContentBlock = { type: "heading" | "paragraph"; text: string };

function toContentBlocks(content: string): ContentBlock[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const cleaned = block.replace(/^#{1,6}\s*/, "").trim();
      const isSingleLine = !cleaned.includes("\n");
      const looksLikeHeading =
        /^#{1,6}\s+/.test(block) ||
        (isSingleLine &&
          cleaned.length <= 90 &&
          (/^(أولًا|أولاً|ثانيًا|ثانياً|ثالثًا|ثالثاً|رابعًا|رابعاً|خامسًا|خامساً|سادسًا|سادساً|نصائح|كيف يساعدك|الاستعداد|Preparing|Ihram|Entering|Tawaf|Prayer|Sa.?i|Shaving|Tips|How NourApp)/i.test(
            cleaned,
          ) ||
            /[:：]$/.test(cleaned)));
      return {
        type: looksLikeHeading ? "heading" : "paragraph",
        text: cleaned,
      };
    });
}

export default function ArticleDetailsClient() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const params = useParams<{ slug: string }>();
  const slug =
    typeof params.slug === "string" ? decodeURIComponent(params.slug) : "";
  const supabase = useMemo(() => createClient(), []);
  const {
    data: article,
    isPending: loading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["public", "article", slug],
    enabled: Boolean(slug),
    queryFn: () => getPublicArticle(supabase, slug),
  });
  const relatedQuery = useQuery({
    queryKey: ["public", "articles"],
    enabled: Boolean(article?.category_id),
    queryFn: () => getPublicArticles(supabase),
    staleTime: 60000,
  });
  const related = (relatedQuery.data ?? [])
    .filter(
      (a) => a.id !== article?.id && a.category_id === article?.category_id,
    )
    .slice(0, 3);
  useEffect(() => {
    const savedTheme = localStorage.getItem("nour-theme");
    document.documentElement.dataset.theme =
      savedTheme === "dark" ? "dark" : "light";
  }, []);

  if (isError)
    return (
      <main className="nour-redesign nr-article-state" role="alert">
        <h1>{ar ? "تعذر تحميل المقال" : "Article could not be loaded"}</h1>
        <button onClick={() => void refetch()}>
          {ar ? "إعادة المحاولة" : "Retry"}
        </button>
        <Link href={languageHref("/articles", language)}>
          {ar ? "العودة للمقالات" : "Back to articles"}
        </Link>
      </main>
    );
  if (loading)
    return (
      <main className="nour-redesign nr-article-state">
        {ar ? "جارٍ تحميل المقال..." : "Loading article..."}
      </main>
    );
  if (!article)
    return (
      <main className="nour-redesign nr-article-state">
        <strong>404</strong>
        <p>
          {ar
            ? "المقال غير موجود أو غير منشور."
            : "This article does not exist or is not published."}
        </p>
        <Link href={languageHref("/articles", language)}>
          {ar ? "العودة للمقالات" : "Back to articles"}
        </Link>
      </main>
    );

  const title = ar ? article.title_ar : article.title_en;
  const excerpt = ar ? article.excerpt_ar : article.excerpt_en;
  const content = (ar ? article.content_ar : article.content_en) ?? "";
  const author = ar ? article.author_name_ar : article.author_name_en;
  const category = Array.isArray(article.article_categories)
    ? article.article_categories[0]
    : article.article_categories;
  const blocks = toContentBlocks(content);

  return (
    <main className="nour-redesign nr-article-detail" dir={ar ? "rtl" : "ltr"}>
      <header className="nr-article-detail-hero">
        <div className="nr-container nr-article-hero-inner">
          <Link
            href={languageHref("/articles", language)}
            className="nr-article-back"
          >
            ← {ar ? "المقالات" : "Articles"}
          </Link>
          <div className="nr-article-meta">
            {category ? (
              <span className="nr-article-category">
                {ar ? category.name_ar : category.name_en}
              </span>
            ) : null}
            {article.published_at ? (
              <time>
                {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", {
                  dateStyle: "long",
                }).format(new Date(article.published_at))}
              </time>
            ) : null}
          </div>
          <h1>{title}</h1>
          {excerpt ? <p className="nr-article-lead">{excerpt}</p> : null}
          {author ? (
            <div className="nr-article-author">
              {ar ? "بقلم" : "By"} <strong>{author}</strong>
            </div>
          ) : null}
        </div>
      </header>
      {article.image ? (
        <div className="nr-container nr-article-cover">
          <Image
            src={article.image}
            alt={ar ? article.imageAltAr : article.imageAltEn}
            width={1600}
            height={900}
            unoptimized
            sizes="100vw"
          />
        </div>
      ) : null}
      <article className="nr-container nr-article-body">
        <div className="nr-article-prose">
          {blocks.map((block, index) =>
            block.type === "heading" ? (
              <h2 key={`${block.text}-${index}`}>{block.text}</h2>
            ) : (
              <p key={`${block.text.slice(0, 24)}-${index}`}>{block.text}</p>
            ),
          )}
        </div>
        {article.tags?.length ? (
          <div
            className="nr-article-tags"
            aria-label={ar ? "وسوم المقال" : "Article tags"}
          >
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        {related.length > 0 && (
          <section>
            <h2>{ar ? "من التصنيف نفسه" : "From the same category"}</h2>
            <div className="nr-related-articles">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} language={language} />
              ))}
            </div>
          </section>
        )}
        {relatedQuery.isError && (
          <p role="alert">
            {ar
              ? "تعذر تحميل المقالات المرتبطة"
              : "Related articles could not be loaded"}{" "}
            <button onClick={() => void relatedQuery.refetch()}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </p>
        )}
        <div className="nr-article-footer">
          <Link
            href={languageHref("/articles", language)}
            className="nr-article-footer-link"
          >
            ← {ar ? "العودة إلى جميع المقالات" : "Back to all articles"}
          </Link>
        </div>
      </article>
      <style jsx global>{`
        .nr-related-articles {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 260px), 1fr)
          );
          gap: 18px;
        }
        .nr-article-detail {
          min-height: 100vh;
          background: var(--nr-bg);
          color: var(--nr-text);
          transition:
            background 0.25s ease,
            color 0.25s ease;
        }
        .nr-article-detail-hero {
          padding: 68px 0 90px;
          background: linear-gradient(
            145deg,
            #0b4ead 0%,
            #176fe8 72%,
            #2996ef 100%
          );
          color: #fff;
          transition: background 0.25s ease;
        }
        .nr-article-hero-inner {
          max-width: 1040px;
        }
        .nr-article-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          color: rgba(255, 255, 255, 0.86);
          font-weight: 800;
        }
        .nr-article-back:hover {
          color: #fff;
        }
        .nr-article-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.72);
        }
        .nr-article-category {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 0 11px;
          border-radius: 999px;
          background: rgba(255, 195, 19, 0.14);
          color: #ffd45a;
          font-weight: 900;
        }
        .nr-article-detail-hero h1 {
          max-width: 940px;
          font-size: clamp(36px, 4.2vw, 58px);
          line-height: 1.3;
          letter-spacing: -0.02em;
          margin: 17px 0 13px;
          text-wrap: balance;
        }
        .nr-article-lead {
          max-width: 840px;
          margin: 0;
          font-size: clamp(17px, 1.45vw, 20px);
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.86);
        }
        .nr-article-author {
          margin-top: 18px;
          color: rgba(255, 255, 255, 0.78);
        }
        .nr-article-author strong {
          color: #fff;
        }
        .nr-article-cover {
          max-width: 1180px;
          margin-top: -50px;
          position: relative;
          z-index: 2;
        }
        .nr-article-cover img {
          display: block;
          width: 100%;
          aspect-ratio: 16/8.4;
          object-fit: cover;
          border-radius: 26px;
          box-shadow: 0 22px 50px rgba(19, 45, 80, 0.16);
        }
        .nr-article-body {
          max-width: 920px;
          padding-top: 44px;
          padding-bottom: 96px;
        }
        .nr-article-prose {
          font-size: 18px;
          line-height: 2;
          color: color-mix(in srgb, var(--nr-text) 90%, transparent);
        }
        .nr-article-prose h2 {
          position: relative;
          margin: 48px 0 18px;
          padding-inline-start: 18px;
          font-size: clamp(24px, 2.2vw, 30px);
          line-height: 1.5;
          color: var(--nr-text);
          font-weight: 900;
        }
        .nr-article-prose h2:first-child {
          margin-top: 0;
        }
        .nr-article-prose h2::before {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          top: 0.35em;
          width: 5px;
          height: 1.05em;
          border-radius: 999px;
          background: var(--nr-gold, #ffc313);
        }
        .nr-article-prose p {
          margin: 0 0 22px;
          white-space: pre-line;
        }
        .nr-article-tags {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          margin-top: 48px;
          padding-top: 30px;
          border-top: 1px solid var(--nr-border);
        }
        .nr-article-tags span {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: var(--nr-soft);
          color: var(--nr-blue);
          font-size: 13px;
          font-weight: 800;
          border: 1px solid var(--nr-border);
        }
        .nr-article-footer {
          margin-top: 36px;
        }
        .nr-article-footer-link {
          display: inline-flex;
          align-items: center;
          min-height: 46px;
          padding: 0 16px;
          border-radius: 14px;
          background: var(--nr-card);
          color: var(--nr-blue);
          font-weight: 900;
          border: 1px solid var(--nr-border);
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }
        .nr-article-footer-link:hover {
          transform: translateY(-2px);
          background: var(--nr-soft);
        }
        .nr-article-state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 12px;
          text-align: center;
          padding: 40px;
          background: var(--nr-bg);
          color: var(--nr-text);
        }
        .nr-article-state strong {
          font-size: 60px;
          color: var(--nr-blue);
        }
        html[data-theme="dark"] .nr-article-detail-hero {
          background: linear-gradient(
            145deg,
            #06111e 0%,
            #0b315f 52%,
            #0f58a8 100%
          );
        }
        html[data-theme="dark"] .nr-article-cover img {
          box-shadow: 0 24px 58px rgba(0, 0, 0, 0.34);
        }
        @media (max-width: 760px) {
          .nr-article-detail-hero {
            padding: 56px 0 72px;
          }
          .nr-article-detail-hero h1 {
            font-size: 34px;
            line-height: 1.36;
          }
          .nr-article-lead,
          .nr-article-prose {
            font-size: 16px;
          }
          .nr-article-cover {
            margin-top: -32px;
            padding-inline: 18px;
          }
          .nr-article-cover img {
            aspect-ratio: 16/10;
            border-radius: 20px;
          }
          .nr-article-body {
            padding: 36px 22px 72px;
          }
          .nr-article-prose h2 {
            margin-top: 38px;
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}
