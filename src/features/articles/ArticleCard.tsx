import Image from "next/image";
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
      <div className={styles.image + " public-article-image"}>
        {article.image && (
          <Image
            src={article.image}
            alt={ar ? article.imageAltAr : article.imageAltEn}
            fill
            sizes="(max-width:700px) 100vw, (max-width:1100px) 50vw, 380px"
            unoptimized
          />
        )}
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
        >
          {ar ? "قراءة المقال" : "Read article"}
          <Arrow size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
