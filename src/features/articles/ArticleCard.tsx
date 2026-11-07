import Image from "next/image";
import Link from "next/link";
import {
  articleCategory,
  articleDate,
  type PublicArticle,
} from "./public-articles";
import { languageHref } from "../../core/i18n/public-language";
export default function ArticleCard({
  article,
  language,
}: {
  article: PublicArticle;
  language: "ar" | "en";
}) {
  const ar = language === "ar",
    category = articleCategory(article),
    title = ar ? article.title_ar : article.title_en;
  return (
    <article className="public-article-card" dir={ar ? "rtl" : "ltr"}>
      {article.image && (
        <div className="public-article-image">
          <Image
            src={article.image}
            alt={ar ? article.imageAltAr : article.imageAltEn}
            fill
            sizes="(max-width:700px) 100vw, (max-width:1100px) 50vw, 380px"
            unoptimized
          />
        </div>
      )}
      <div className="public-article-body">
        {category && <span>{ar ? category.name_ar : category.name_en}</span>}
        {article.published_at && (
          <time dateTime={article.published_at}>
            {articleDate(article.published_at, language)}
          </time>
        )}
        <h3>{title}</h3>
        <p>{ar ? article.excerpt_ar : article.excerpt_en}</p>
        {(ar ? article.author_name_ar : article.author_name_en) && (
          <small>{ar ? article.author_name_ar : article.author_name_en}</small>
        )}
        <Link
          href={languageHref(
            "/articles/" + encodeURIComponent(article.slug),
            language,
          )}
        >
          {ar ? "قراءة المقال" : "Read article"}
        </Link>
      </div>
      <style jsx>{`
        .public-article-card {
          min-width: 0;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          overflow: hidden;
          background: var(--nour-surface);
          color: var(--nour-text-primary);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .public-article-image {
          aspect-ratio: 16/9;
          position: relative;
        }
        .public-article-image :global(img) {
          object-fit: cover;
        }
        .public-article-body {
          display: grid;
          gap: 10px;
          padding: 22px;
          flex: 1;
        }
        h3,
        p {
          margin: 0;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }
        p {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        time,
        small {
          font-size: 12px;
        }
        span,
        a {
          color: var(--nour-primary, #176fe8);
        }
        a {
          font-weight: 700;
          min-height: 44px;
          display: flex;
          align-items: center;
        }
        a:focus-visible {
          outline: 3px solid #176fe8;
          outline-offset: 3px;
        }
      `}</style>
    </article>
  );
}
