import type { SupabaseClient } from "@supabase/supabase-js";
export type ArticleCategory = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
};
export type PublicArticle = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  content_ar?: string;
  content_en?: string;
  author_name_ar: string | null;
  author_name_en: string | null;
  published_at: string | null;
  is_featured: boolean;
  category_id: string | null;
  cover_media_id: string | null;
  article_categories: ArticleCategory | ArticleCategory[] | null;
  tags: string[];
  image: string;
  imageAltAr: string;
  imageAltEn: string;
  imageError?: boolean;
};
const columns =
  "id,slug,title_ar,title_en,excerpt_ar,excerpt_en,cover_media_id,published_at,is_featured,category_id,author_name_ar,author_name_en,tags,article_categories(id,name_ar,name_en,slug)";
async function attachMedia(
  client: SupabaseClient,
  rows: Omit<PublicArticle, "image" | "imageAltAr" | "imageAltEn">[],
) {
  const ids = [
    ...new Set(
      rows.map((r) => r.cover_media_id).filter((x): x is string => Boolean(x)),
    ),
  ];
  const media = new Map<
    string,
    {
      bucket: string;
      path: string;
      alt_ar: string | null;
      alt_en: string | null;
    }
  >();
  let imageError = false;
  for (let i = 0; i < ids.length; i += 200) {
    const result = await client
      .from("media")
      .select("id,bucket,path,alt_ar,alt_en")
      .in("id", ids.slice(i, i + 200))
      .is("deleted_at", null);
    if (result.error) {
      imageError = true;
      continue;
    }
    for (const r of result.data ?? []) media.set(r.id, r);
  }
  const correctedCovers: Record<string, string> = {
    "prepare-umrah-trip": "/images/articles/prepare-umrah.jpg",
    "choose-umrah-program": "/images/articles/choose-program.jpg",
    "umrah-guide": "/images/articles/umrah-guide.jpg",
  };
  return rows.map((r) => {
    const m = r.cover_media_id ? media.get(r.cover_media_id) : undefined;
    // Replace only the known CEO portrait accidentally reused as these covers.
    // A new cover selected in the dashboard always takes precedence.
    const corrected = m?.path.includes("900c7672-f0a0-4195-af34-bb64a89be211") ? correctedCovers[r.slug] : undefined;
    return {
      ...r,
      image: corrected || (m
        ? client.storage.from(m.bucket).getPublicUrl(m.path).data.publicUrl
        : ""),
      imageAltAr: corrected ? "الكعبة المشرفة والمسجد الحرام" : m?.alt_ar || r.title_ar,
      imageAltEn: corrected ? "The Kaaba and the Grand Mosque" : m?.alt_en || r.title_en,
      imageError,
    };
  });
}
export async function getPublicArticles(client: SupabaseClient) {
  const r = await client
    .from("articles")
    .select(columns)
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (r.error) throw r.error;
  return attachMedia(client, (r.data ?? []) as unknown as PublicArticle[]);
}
export async function getPublicArticle(client: SupabaseClient, slug: string) {
  const r = await client
    .from("articles")
    .select(columns + ",content_ar,content_en")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (r.error) throw r.error;
  if (!r.data) return null;
  return (await attachMedia(client, [r.data as unknown as PublicArticle]))[0];
}
export function articleCategory(article: PublicArticle) {
  return Array.isArray(article.article_categories)
    ? article.article_categories[0]
    : article.article_categories;
}
export function articleDate(value: string | null, language: "ar" | "en") {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-GB", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(value))
    : "";
}
