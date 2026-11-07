"use client";
import {
  useUnsaved,
  serializeDraft,
  confirmLeaving,
} from "../admin-workspace/useUnsaved";
import { useLanguage } from "../../core/i18n";
import DraftPreview from "../admin-workspace/DraftPreview";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorText } from "../admin-workspace/data";
import { createClient } from "../../lib/supabase/client";
import {
  getMedia,
  type MediaItem,
} from "../media/repositories/media.repository";

type Article = {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_active: boolean;
  published_at: string | null;
  updated_at: string;
};

type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  is_active: boolean;
  sort_order: number;
};

type FormState = {
  id?: string;
  title_ar: string;
  title_en: string;
  slug: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  category_id: string;
  cover_media_id: string;
  author_name_ar: string;
  author_name_en: string;
  tags: string;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_active: boolean;
  published_at: string | null;
  seo_title_ar: string;
  seo_title_en: string;
  seo_description_ar: string;
  seo_description_en: string;
};

const empty: FormState = {
  title_ar: "",
  title_en: "",
  slug: "",
  excerpt_ar: "",
  excerpt_en: "",
  content_ar: "",
  content_en: "",
  category_id: "",
  cover_media_id: "",
  author_name_ar: "",
  author_name_en: "",
  tags: "",
  status: "draft",
  is_featured: false,
  is_active: true,
  published_at: null,
  seo_title_ar: "",
  seo_title_en: "",
  seo_description_ar: "",
  seo_description_en: "",
};

const categoryEmpty = {
  name_ar: "",
  name_en: "",
  slug: "",
  description_ar: "",
  description_en: "",
  sort_order: 0,
};

export default function ArticlesPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [savedForm, setSavedForm] = useState<FormState>(empty);
  const [cat, setCat] = useState(categoryEmpty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const leaveMessage = ar
    ? "لديك تعديلات غير محفوظة. هل تريد المتابعة؟"
    : "You have unsaved changes. Continue?";
  useUnsaved(
    serializeDraft(form) !== serializeDraft(savedForm) ||
      serializeDraft(cat) !== serializeDraft(categoryEmpty),
    leaveMessage,
  );
  function resetEditor() {
    if (!confirmLeaving(leaveMessage)) return;
    setForm(empty);
    setSavedForm(empty);
  }
  const fetchContent = useCallback(async () => {
    const [
      { data: articles, error: articlesError },
      { data: categoryRows, error: categoriesError },
      mediaItems,
    ] = await Promise.all([
      supabase
        .from("articles")
        .select(
          "id,title_ar,title_en,slug,status,is_featured,is_active,published_at,updated_at",
        )
        .is("deleted_at", null)
        .order("updated_at", { ascending: false }),
      supabase
        .from("article_categories")
        .select(
          "id,name_ar,name_en,slug,description_ar,description_en,is_active,sort_order",
        )
        .is("deleted_at", null)
        .order("sort_order"),
      getMedia(supabase).catch(() => []),
    ]);

    if (articlesError || categoriesError) {
      throw new Error(
        articlesError?.message ||
          categoriesError?.message ||
          (ar ? "تعذر تحميل بيانات المقالات." : "Unable to load articles."),
      );
    }

    return {
      articles: (articles ?? []) as Article[],
      categories: (categoryRows ?? []) as Category[],
      media: mediaItems.filter((item) => item.mimeType.startsWith("image/")),
    };
  }, [supabase, ar]);

  const applyContent = useCallback(
    (content: Awaited<ReturnType<typeof fetchContent>>) => {
      setItems(content.articles);
      setCategories(content.categories);
      setMedia(content.media);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    fetchContent()
      .then((content) => {
        if (active) applyContent(content);
      })
      .catch((error: unknown) => {
        if (active) setError(errorText(error, ar));
      });
    return () => {
      active = false;
    };
  }, [fetchContent, applyContent, ar]);

  async function load() {
    try {
      applyContent(await fetchContent());
    } catch (error) {
      setError(errorText(error, ar));
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const publishedAt =
      form.status === "published"
        ? form.published_at || new Date().toISOString()
        : null;

    const payload = {
      title_ar: form.title_ar,
      title_en: form.title_en,
      slug: form.slug,
      excerpt_ar: form.excerpt_ar || null,
      excerpt_en: form.excerpt_en || null,
      content_ar: form.content_ar,
      content_en: form.content_en,
      category_id: form.category_id || null,
      cover_media_id: form.cover_media_id || null,
      author_name_ar: form.author_name_ar || null,
      author_name_en: form.author_name_en || null,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: form.status,
      is_featured: form.is_featured,
      is_active: form.is_active,
      published_at: publishedAt,
      seo_title_ar: form.seo_title_ar || null,
      seo_title_en: form.seo_title_en || null,
      seo_description_ar: form.seo_description_ar || null,
      seo_description_en: form.seo_description_en || null,
    };

    const query = form.id
      ? supabase.from("articles").update(payload).eq("id", form.id)
      : supabase.from("articles").insert(payload);

    const { error: saveError } = await query;
    setBusy(false);

    if (saveError) {
      setError(errorText(saveError, ar));
      return;
    }

    setForm(empty);
    await load();
  }

  async function edit(id: string) {
    if (!confirmLeaving(leaveMessage)) return;
    const { data, error: loadError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !data) {
      setError(errorText(loadError, ar));
      return;
    }

    setForm({
      ...empty,
      ...data,
      category_id: data.category_id || "",
      cover_media_id: data.cover_media_id || "",
      tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
      published_at: data.published_at || null,
    });
    setSavedForm({
      ...empty,
      ...data,
      category_id: data.category_id || "",
      cover_media_id: data.cover_media_id || "",
      tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
      published_at: data.published_at || null,
    });
  }

  async function archive(id: string) {
    setBusy(true);
    const { error: archiveError } = await supabase
      .from("articles")
      .update({ status: "archived", is_active: false })
      .eq("id", id);
    setBusy(false);

    if (archiveError) setError(errorText(archiveError, ar));
    else await load();
  }

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error: categoryError } = await supabase
      .from("article_categories")
      .insert({ ...cat, is_active: true });
    setBusy(false);

    if (categoryError) {
      setError(errorText(categoryError, ar));
      return;
    }

    setCat(categoryEmpty);
    await load();
  }

  async function removeCategory(id: string) {
    setBusy(true);
    const { error: categoryError } = await supabase
      .from("article_categories")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", id);
    setBusy(false);

    if (categoryError) setError(errorText(categoryError, ar));
    else await load();
  }

  const cover = media.find((item) => item.id === form.cover_media_id);

  return (
    <section dir={ar ? "rtl" : "ltr"} className="nr-articles-admin-page">
      <header>
        <h1>{ar ? "إدارة المقالات" : "Article management"}</h1>
        <p>
          {ar
            ? "إدارة المقالات والتصنيفات وصور الغلاف بالعربية والإنجليزية."
            : "Manage articles, categories and cover images in Arabic and English."}
        </p>
      </header>

      {error && (
        <div className="admin-card nr-articles-admin-error">{error}</div>
      )}

      <div className="nr-articles-admin-layout">
        <div className="nr-articles-admin-main">
          <div className="admin-card nr-articles-admin-card nr-articles-admin-table-card">
            <div className="nr-articles-admin-card-head">
              <h2>{ar ? "المقالات" : "Articles"}</h2>
              <button className="admin-button" onClick={resetEditor}>
                {ar ? "مقال جديد" : "New article"}
              </button>
            </div>

            <div className="nr-articles-admin-table-wrap">
              <table className="nr-articles-admin-table">
                <thead>
                  <tr>
                    <th>{ar ? "العنوان" : "Title"}</th>
                    <th>{ar ? "الحالة" : "Status"}</th>
                    <th>{ar ? "مميز" : "Featured"}</th>
                    <th>{ar ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title_ar}</strong>
                        <div>{item.title_en}</div>
                      </td>
                      <td>{item.status}</td>
                      <td>{item.is_featured ? "نعم" : "—"}</td>
                      <td className="nr-articles-admin-row-actions">
                        <button onClick={() => void edit(item.id)}>
                          {ar ? "تعديل" : "Edit"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => void archive(item.id)}
                        >
                          {ar ? "أرشفة" : "Archive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={4} className="nr-articles-admin-empty">
                        {ar ? "لا توجد مقالات بعد." : "No articles yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card nr-articles-admin-card">
            <h2>{ar ? "التصنيفات" : "Categories"}</h2>
            <form onSubmit={addCategory} className="nr-articles-category-form">
              <input
                required
                placeholder={ar ? "اسم التصنيف" : "Category name"}
                value={cat.name_ar}
                onChange={(e) => setCat({ ...cat, name_ar: e.target.value })}
              />
              <input
                required
                dir="ltr"
                placeholder="Category name"
                value={cat.name_en}
                onChange={(e) => setCat({ ...cat, name_en: e.target.value })}
              />
              <input
                required
                dir="ltr"
                placeholder="slug"
                value={cat.slug}
                onChange={(e) => setCat({ ...cat, slug: e.target.value })}
              />
              <button disabled={busy} className="admin-button">
                {ar ? "إضافة" : "Add"}
              </button>
            </form>

            <div className="nr-articles-category-list">
              {categories.map((category) => (
                <span key={category.id}>
                  {category.name_ar}
                  <button
                    title={ar ? "حذف" : "Delete"}
                    onClick={() => void removeCategory(category.id)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <form className="admin-card nr-articles-editor" onSubmit={save}>
          <div className="nr-articles-editor-head">
            <div>
              <h2>
                {form.id ? "تعديل المقال" : ar ? "إضافة مقال" : "Add article"}
              </h2>
              <p>
                {form.id
                  ? "سيتم حفظ التعديل دون تغيير تاريخ النشر الأصلي."
                  : ar
                    ? "أنشئ المقال كمسودة أو انشره مباشرة."
                    : "Create a draft or publish the article."}
              </p>
            </div>
            {form.id && (
              <button type="button" onClick={resetEditor}>
                {ar ? "إلغاء التعديل" : "Cancel editing"}
              </button>
            )}
          </div>

          <input
            required
            placeholder={ar ? "العنوان بالعربية" : "Title in Arabic"}
            value={form.title_ar}
            onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
          />
          <input
            required
            dir="ltr"
            placeholder="English title"
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
          />
          <input
            required
            dir="ltr"
            placeholder="slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <textarea
            placeholder={ar ? "الملخص بالعربية" : "Summary in Arabic"}
            value={form.excerpt_ar}
            onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })}
          />
          <textarea
            dir="ltr"
            placeholder="English excerpt"
            value={form.excerpt_en}
            onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })}
          />
          <textarea
            required
            rows={8}
            placeholder={
              ar ? "محتوى المقال بالعربية" : "Article content in Arabic"
            }
            value={form.content_ar}
            onChange={(e) => setForm({ ...form, content_ar: e.target.value })}
          />
          <textarea
            required
            dir="ltr"
            rows={8}
            placeholder="English content"
            value={form.content_en}
            onChange={(e) => setForm({ ...form, content_en: e.target.value })}
          />

          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">{ar ? "بدون تصنيف" : "No category"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_ar} / {category.name_en}
              </option>
            ))}
          </select>

          <label>
            {ar ? "صورة الغلاف" : "Cover image"}
            <select
              value={form.cover_media_id}
              onChange={(e) =>
                setForm({ ...form, cover_media_id: e.target.value })
              }
            >
              <option value="">{ar ? "بدون صورة" : "No image"}</option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.altAr || item.fileName}
                </option>
              ))}
            </select>
          </label>

          {cover && (
            <img
              className="nr-articles-cover-preview"
              src={cover.publicUrl}
              alt={cover.altAr || cover.fileName}
            />
          )}
          <DraftPreview
            titleAr={form.title_ar}
            titleEn={form.title_en}
            summaryAr={form.excerpt_ar}
            summaryEn={form.excerpt_en}
            bodyAr={form.content_ar}
            bodyEn={form.content_en}
          />

          <div className="nr-articles-admin-grid-2">
            <input
              placeholder={ar ? "اسم الكاتب" : "Author name"}
              value={form.author_name_ar}
              onChange={(e) =>
                setForm({ ...form, author_name_ar: e.target.value })
              }
            />
            <input
              dir="ltr"
              placeholder="Author"
              value={form.author_name_en}
              onChange={(e) =>
                setForm({ ...form, author_name_en: e.target.value })
              }
            />
          </div>

          <input
            placeholder={ar ? "الوسوم مفصولة بفاصلة" : "Comma-separated tags"}
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as FormState["status"],
              })
            }
          >
            <option value="draft">{ar ? "مسودة" : "Draft"}</option>
            <option value="published">{ar ? "منشور" : "Published"}</option>
            <option value="archived">{ar ? "مؤرشف" : "Archived"}</option>
          </select>

          <div className="nr-articles-admin-checks">
            <label>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm({ ...form, is_featured: e.target.checked })
                }
              />
              {ar ? "مقال مميز" : "Featured article"}
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />
              {ar ? "نشط" : "Active"}
            </label>
          </div>

          <details>
            <summary>{ar ? "إعدادات SEO" : "SEO settings"}</summary>
            <div className="nr-articles-seo-grid">
              <input
                placeholder="SEO title AR"
                value={form.seo_title_ar}
                onChange={(e) =>
                  setForm({ ...form, seo_title_ar: e.target.value })
                }
              />
              <input
                dir="ltr"
                placeholder="SEO title EN"
                value={form.seo_title_en}
                onChange={(e) =>
                  setForm({ ...form, seo_title_en: e.target.value })
                }
              />
              <textarea
                placeholder="SEO description AR"
                value={form.seo_description_ar}
                onChange={(e) =>
                  setForm({ ...form, seo_description_ar: e.target.value })
                }
              />
              <textarea
                dir="ltr"
                placeholder="SEO description EN"
                value={form.seo_description_en}
                onChange={(e) =>
                  setForm({ ...form, seo_description_en: e.target.value })
                }
              />
            </div>
          </details>

          <button className="admin-button" disabled={busy} type="submit">
            {busy ? "جارٍ الحفظ..." : ar ? "حفظ المقال" : "Save article"}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .nr-articles-admin-page {
          display: grid;
          gap: 24px;
        }
        .nr-articles-admin-page > header p {
          color: var(--admin-text-muted, #64748b);
        }
        .nr-articles-admin-error {
          padding: 16px;
        }
        .nr-articles-admin-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.85fr);
          gap: 20px;
          align-items: start;
        }
        .nr-articles-admin-main {
          display: grid;
          gap: 20px;
          min-width: 0;
        }
        .nr-articles-admin-card,
        .nr-articles-editor {
          padding: 20px;
        }
        .nr-articles-admin-card-head,
        .nr-articles-editor-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .nr-articles-admin-card-head {
          margin-bottom: 16px;
        }
        .nr-articles-editor {
          display: grid;
          gap: 12px;
          position: sticky;
          top: 18px;
        }
        .nr-articles-editor-head {
          align-items: flex-start;
        }
        .nr-articles-editor-head p {
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--admin-text-muted, #64748b);
          line-height: 1.6;
        }
        .nr-articles-admin-table-wrap {
          overflow-x: auto;
        }
        .nr-articles-admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 620px;
        }
        .nr-articles-admin-table th,
        .nr-articles-admin-table td {
          text-align: start;
          padding: 12px 8px;
        }
        .nr-articles-admin-table td > div {
          font-size: 12px;
          opacity: 0.65;
          margin-top: 3px;
        }
        .nr-articles-admin-row-actions {
          white-space: nowrap;
        }
        .nr-articles-admin-row-actions button + button {
          margin-inline-start: 8px;
        }
        .nr-articles-admin-empty {
          padding: 24px !important;
          text-align: center !important;
        }
        .nr-articles-category-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 8px;
          margin-bottom: 16px;
        }
        .nr-articles-category-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .nr-articles-category-list > span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid var(--admin-border, #ddd);
          border-radius: 999px;
          padding: 7px 10px;
        }
        .nr-articles-category-list button {
          line-height: 1;
        }
        .nr-articles-editor label {
          display: grid;
          gap: 7px;
          font-weight: 700;
        }
        .nr-articles-cover-preview {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          border-radius: 14px;
        }
        .nr-articles-admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .nr-articles-admin-checks {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }
        .nr-articles-admin-checks label {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .nr-articles-seo-grid {
          display: grid;
          gap: 8px;
          margin-top: 10px;
        }
        @media (max-width: 1120px) {
          .nr-articles-admin-layout {
            grid-template-columns: 1fr;
          }
          .nr-articles-editor {
            position: static;
          }
        }
        @media (max-width: 760px) {
          .nr-articles-admin-card,
          .nr-articles-editor {
            padding: 16px;
          }
          .nr-articles-category-form,
          .nr-articles-admin-grid-2 {
            grid-template-columns: 1fr;
          }
          .nr-articles-admin-card-head,
          .nr-articles-editor-head {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
