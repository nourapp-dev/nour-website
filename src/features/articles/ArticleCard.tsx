"use client";
import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import {
  articleCategory,
  articleDate,
  type PublicArticle,
} from "./public-articles";
import { languageHref } from "../../core/i18n/public-language";
import publicStyles from "../../styles/public-content.module.css";
import styles from "./ArticleCard.module.css";
export default function ArticleCard({
  article,
  language,
}: {
  article: PublicArticle;
  language: "ar" | "en";
}) {
  const [contain, setContain] = useState(false), [imageFailed, setImageFailed] = useState(false);
  const ar = language === "ar",
    category = articleCategory(article),
    title = ar ? article.title_ar : article.title_en;
  const excerpt = ar ? article.excerpt_ar : article.excerpt_en,
    author = ar ? article.author_name_ar : article.author_name_en;
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return (
    <article
      className={
        publicStyles.surface + " " + styles.card + " public-article-card"
      }
      dir={ar ? "rtl" : "ltr"}
    >
      <div className={styles.image + " public-article-image" + (contain ? " " + styles.contain : "")}>
        {article.image && !imageFailed ? (
          <Image
            src={article.image}
            alt={ar ? article.imageAltAr : article.imageAltEn}
            fill
            sizes="(max-width:700px) 100vw, (max-width:1100px) 50vw, 380px"
            unoptimized
            onError={() => setImageFailed(true)}
            onLoad={e => setContain(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight < 1.3)}
          />
        ) : <span className={styles.placeholder}><BookOpen size={36} aria-hidden="true"/><span>{ar ? "من أدلة نور آب" : "A Nour App guide"}</span></span>}
      </div>
      <div className={styles.body + " public-article-body"}>
        {(category || article.published_at) && (
          <div className={styles.meta + " " + publicStyles.secondary}>
            {category && (
              <span>{ar ? category.name_ar : category.name_en}</span>
            )}
            {article.published_at && (
              <time dateTime={article.published_at}>
                {articleDate(article.published_at, language)}
              </time>
            )}
          </div>
        )}
        <h3
          className={publicStyles.cardTitle + " " + styles.title}
          title={title}
        >
          {title}
        </h3>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}
        {author && <small className={publicStyles.secondary}>{author}</small>}
        <Link
          className={publicStyles.textLink + " " + styles.link}
          href={languageHref(
            "/articles/" + encodeURIComponent(article.slug),
            language,
          )}
          aria-label={(ar ? "قراءة: " : "Read: ") + title}
        >
          {ar ? "قراءة المقال" : "Read article"}
          <Arrow size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
