"use client";

import cardStyles from "./MediaCards.module.css";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../src/lib/supabase/client";

type Props = { language: "ar" | "en" };
type Category = { name_ar: string; name_en: string };
type Row = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  cover_media_id: string | null;
  published_at: string | null;
  is_featured: boolean;
  article_categories: Category | Category[] | null;
};
type Item = Row & { image: string };

export default function ArticlesPreview({ language }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("articles")
        .select("id,slug,title_ar,title_en,excerpt_ar,excerpt_en,cover_media_id,published_at,is_featured,article_categories(name_ar,name_en)")
        .eq("status", "published")
        .eq("is_active", true)
        .is("deleted_at", null)
        .lte("published_at", new Date().toISOString())
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(3);

      const rows = (data || []) as Row[];
      const mapped = await Promise.all(
        rows.map(async (row) => {
          let image = "";
          if (row.cover_media_id) {
            const { data: media } = await supabase
              .from("media")
              .select("bucket,path")
              .eq("id", row.cover_media_id)
              .maybeSingle();
            if (media) image = supabase.storage.from(media.bucket).getPublicUrl(media.path).data.publicUrl;
          }
          return { ...row, image };
        }),
      );
      setItems(mapped);
    })();
  }, [supabase]);

  if (!items.length) return null;
  const ar = language === "ar";

  return (
    <section className={"nr-articles-preview " + cardStyles.scope} dir={ar ? "rtl" : "ltr"}>
      <div className="nr-container">
        <div className="nr-articles-head">
          <div className="nr-articles-head-copy">
            <span className="nr-kicker">{ar ? "مركز المعرفة" : "KNOWLEDGE CENTER"}</span>
            <h2>{ar ? "مقالات وإرشادات تساعدك في رحلتك" : "Articles and guides for your journey"}</h2>
            <p>{ar ? "محتوى واضح وموثوق يساعدك على الاستعداد للعمرة وفهم تفاصيل الرحلة خطوة بخطوة." : "Clear, trusted content to help you prepare for Umrah and understand your journey step by step."}</p>
          </div>
          <Link href="/articles" className="nr-articles-all-link">{ar ? "عرض جميع المقالات" : "View all articles"}<span aria-hidden="true">←</span></Link>
        </div>

        <div className="nr-articles-grid">
          {items.map((item, index) => {
            const category = Array.isArray(item.article_categories) ? item.article_categories[0] : item.article_categories;
            const title = ar ? item.title_ar : item.title_en;
            const excerpt = ar ? item.excerpt_ar : item.excerpt_en;
            const date = item.published_at
              ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(new Date(item.published_at))
              : "";
            return (
              <motion.article
                key={item.id}
                className={"nr-article-card " + cardStyles.card}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
              >
                <Link href={`/articles/${item.slug}`} className="nr-article-image" aria-label={title}>
                  {item.image ? <img loading="lazy" decoding="async" src={item.image} alt={title} /> : <div className="nr-article-image-placeholder">NourApp</div>}
                  {item.is_featured ? <span className="nr-article-featured-badge">{ar ? "مميز" : "Featured"}</span> : null}
                </Link>
                <div className="nr-article-card-body">
                  <div className="nr-article-card-meta">
                    {category ? <span>{ar ? category.name_ar : category.name_en}</span> : null}
                    {date ? <time>{date}</time> : null}
                  </div>
                  <h3><Link href={`/articles/${item.slug}`}>{title}</Link></h3>
                  {excerpt ? <p>{excerpt}</p> : null}
                  <Link className="nr-article-more" href={`/articles/${item.slug}`}>{ar ? "اقرأ المقال" : "Read article"}<span aria-hidden="true">←</span></Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .nr-articles-preview{padding:104px 0;background:linear-gradient(180deg,var(--nr-bg) 0%,color-mix(in srgb,var(--nr-soft) 76%,var(--nr-bg)) 100%);overflow:hidden}
        .nr-articles-head{display:flex;align-items:end;justify-content:space-between;gap:34px;margin-bottom:42px}
        .nr-articles-head-copy{max-width:760px}.nr-articles-head h2{font-size:clamp(34px,4.2vw,52px);line-height:1.3;margin:14px 0 12px;text-wrap:balance}.nr-articles-head p{margin:0;color:var(--nr-muted);font-size:17px;line-height:1.9;max-width:700px}
        .nr-articles-all-link{display:inline-flex;align-items:center;gap:9px;min-height:46px;padding:0 15px;border-radius:14px;background:var(--nr-bg);border:1px solid color-mix(in srgb,var(--nr-text) 9%,transparent);color:var(--nr-blue);font-weight:900;box-shadow:0 10px 28px rgba(24,47,79,.06);white-space:nowrap;transition:transform .2s ease,box-shadow .2s ease}.nr-articles-all-link:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(24,47,79,.1)}
        .nr-articles-grid{display:grid;grid-template-columns:1.35fr .825fr .825fr;gap:22px;align-items:stretch}.nr-article-card{display:flex;flex-direction:column;border:1px solid color-mix(in srgb,var(--nr-text) 8%,transparent);border-radius:26px;overflow:hidden;background:var(--nr-bg);box-shadow:0 20px 50px rgba(24,47,79,.07);min-width:0;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}.nr-article-card:hover{transform:translateY(-4px);box-shadow:0 26px 60px rgba(24,47,79,.11);border-color:color-mix(in srgb,var(--nr-blue) 18%,transparent)}
        .nr-article-image{position:relative;display:block;aspect-ratio:16/10;overflow:hidden;background:var(--nr-soft)}.nr-article-card--featured .nr-article-image{aspect-ratio:16/9}.nr-article-image img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}.nr-article-card:hover .nr-article-image img{transform:scale(1.045)}.nr-article-image-placeholder{width:100%;height:100%;display:grid;place-items:center;color:var(--nr-blue);font-weight:900;font-size:24px;background:linear-gradient(145deg,var(--nr-soft),color-mix(in srgb,var(--nr-blue) 7%,var(--nr-soft)))}
        .nr-article-featured-badge{position:absolute;top:16px;inset-inline-start:16px;display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:rgba(255,195,19,.95);color:#172033;font-size:12px;font-weight:900;box-shadow:0 8px 20px rgba(0,0,0,.14)}
        .nr-article-card-body{display:flex;flex-direction:column;flex:1;padding:23px}.nr-article-card-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--nr-muted)}.nr-article-card-meta span{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:999px;background:color-mix(in srgb,var(--nr-blue) 8%,var(--nr-soft));color:var(--nr-blue);font-weight:800}
        .nr-article-card h3{font-size:21px;line-height:1.55;margin:11px 0 9px}.nr-article-card--featured h3{font-size:clamp(24px,2vw,30px)}.nr-article-card h3 a{color:var(--nr-text)}.nr-article-card-body p{margin:0;color:var(--nr-muted);line-height:1.85;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.nr-article-card--featured .nr-article-card-body p{-webkit-line-clamp:4}
        .nr-article-more{display:inline-flex;align-items:center;gap:8px;margin-top:auto;padding-top:20px;color:var(--nr-blue);font-weight:900}.nr-article-more:hover{gap:11px}
        @media(max-width:1000px){.nr-articles-grid{grid-template-columns:1fr 1fr}.nr-article-card--featured{grid-column:1/-1}.nr-article-card--featured .nr-article-image{aspect-ratio:16/7.5}}
        @media(max-width:760px){.nr-articles-preview{padding:76px 0}.nr-articles-head{align-items:flex-start;flex-direction:column;margin-bottom:30px}.nr-articles-head h2{font-size:34px}.nr-articles-head p{font-size:15px}.nr-articles-grid{grid-template-columns:1fr}.nr-article-card--featured{grid-column:auto}.nr-article-card--featured .nr-article-image,.nr-article-image{aspect-ratio:16/10}.nr-article-card-body{padding:20px}.nr-article-card--featured h3{font-size:23px}.nr-articles-all-link{min-height:44px}}
      `}</style>
    </section>
  );
}
