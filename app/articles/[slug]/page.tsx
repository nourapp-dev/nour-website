import type { Metadata } from "next";
import ArticleDetailsClient from "./ArticleDetailsClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};
type SeoRow = Record<string, string | null>;

async function readArticle(slug: string): Promise<SeoRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const query = new URLSearchParams({
    select:
      "title_ar,title_en,excerpt_ar,excerpt_en,seo_title_ar,seo_title_en,seo_description_ar,seo_description_en,cover_media_id,published_at",
    slug: `eq.${slug}`,
    status: "eq.published",
    is_active: "eq.true",
    deleted_at: "is.null",
    published_at: `lte.${new Date().toISOString()}`,
    limit: "1",
  });
  try {
    const response = await fetch(`${url}/rest/v1/articles?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return ((await response.json()) as SeoRow[])[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const lang = (await searchParams).lang === "en" ? "en" : "ar";
  const path = `/articles/${encodeURIComponent(slug)}`;
  const article = await readArticle(slug);
  if (!article)
    return {
      title: lang === "ar" ? "المقال | NourApp" : "Article | NourApp",
      robots: { index: false, follow: true },
    };
  const title =
    article[`seo_title_${lang}`] || article[`title_${lang}`] || "NourApp";
  const description =
    article[`seo_description_${lang}`] ||
    article[`excerpt_${lang}`] ||
    undefined;
  let images: string[] | undefined;
  if (article.cover_media_id) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
      const query = new URLSearchParams({
        select: "bucket,path",
        id: `eq.${article.cover_media_id}`,
        deleted_at: "is.null",
        limit: "1",
      });
      const response = await fetch(`${url}/rest/v1/media?${query}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 300 },
      });
      if (response.ok) {
        const [media] = await response.json();
        if (media)
          images = [
            `${url}/storage/v1/object/public/${encodeURIComponent(media.bucket)}/${media.path.split("/").map(encodeURIComponent).join("/")}`,
          ];
      }
    } catch {
      /* Article metadata remains usable if its secondary media request fails. */
    }
  }
  return {
    title: `${title} | NourApp`,
    description,
    alternates: {
      canonical: `${path}?lang=${lang}`,
      languages: { ar: `${path}?lang=ar`, en: `${path}?lang=en` },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      publishedTime: article.published_at || undefined,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

export default function ArticlePage() {
  return <ArticleDetailsClient />;
}
