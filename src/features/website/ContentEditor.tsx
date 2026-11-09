"use client";
import usePublicProgramCatalog from "../programs/hooks/usePublicProgramCatalog";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../core/i18n";
import { createClient } from "../../lib/supabase/client";
import { useUnsaved } from "../admin-workspace/useUnsaved";
import {
  normalizePresentation,
  validatePresentation,
  PRESENTATION_KEY,
  DRAFT_KEY,
  type Presentation,
  type Bilingual,
} from "./presentation";
import type { PageContent } from "./page-content";
import { type TextSectionKey } from "./sections";
import MediaPicker from "./MediaPicker";
import styles from "./PresentationEditor.module.css";
type Snapshot = {
  value: unknown;
  revision: number;
  versionId?: number | null;
  baseRevision: number;
  updatedAt: string;
  updatedBy: string | null;
  updatedByName?: string | null;
};
type State = Record<string, Snapshot>;
function fieldName(key: string, ar: boolean) {
  const labels: Record<string, [string, string]> = {
    title: ["العنوان", "Title"],
    description: ["الوصف", "Description"],
    eyebrow: ["العبارة العلوية", "Eyebrow"],
    frontAlt: ["النص البديل للجوال الأمامي", "Front phone alt text"],
    backAlt: ["النص البديل للجوال الخلفي", "Back phone alt text"],
    imageAlt: ["النص البديل للصورة", "Image alt text"],
    button: ["نص الزر", "Button label"],
  };
  return labels[key]?.[ar ? 0 : 1] ?? key;
}
const EditLanguage = createContext<"ar" | "en">("ar");
const labels = {
  programs: ["البرامج المختارة", "Featured programs"],
  hero: ["الواجهة الرئيسية", "Hero"],
  videos: ["الفيديوهات", "Videos"],
  services: ["الخدمات", "Services"],
  map: ["الخريطة", "Map"],
  journey: ["كيف تعمل نور آب", "How it works"],
  showcase: ["عرض التطبيق", "App showcase"],
  why: ["لماذا نور آب", "Why NourApp"],
  priorities: ["ما نركز عليه", "Our focus"],
  payments: ["وسائل الدفع", "Payment methods"],
  download: ["التطبيق قريبًا", "App coming soon"],
} as const;
const links = [
  ["programs", "البرامج", "Programs"],
  ["countries", "الدول والأسواق", "Countries and markets"],
  ["cities", "المدن ونقاط التجمع", "Cities and meeting points"],
  ["ceo-message", "كلمة الرئيس التنفيذي", "CEO message"],
  ["articles", "المقالات", "Articles"],
  ["videos", "مكتبة الفيديوهات", "Video library"],
  ["legal", "المحتوى القانوني", "Legal content"],
  ["settings", "التواصل والتذييل", "Contact and footer"],
] as const;
export default function ContentEditor() {
  const client = useMemo(() => createClient("admin"), []);
  const { language } = useLanguage();
  const ar = language === "ar";
  const query = useQuery({
    queryKey: ["admin", "website-presentation"],
    queryFn: async () => {
      const [state, ...permissions] = await Promise.all([
        client.rpc("website_content_state"),
        ...[
          "website.edit",
          "settings.manage",
          "website.publish",
          "media.upload",
        ].map((permission_code) =>
          client.rpc("current_user_has_permission", { permission_code }),
        ),
      ]);
      for (const r of [state, ...permissions]) if (r.error) throw r.error;
      return {
        state: state.data as State,
        canEdit: permissions[0].data === true || permissions[1].data === true,
        canPublish: permissions[2].data === true,
        canUpload: permissions[3].data === true,
      };
    },
    refetchOnWindowFocus: false,
  });
  return (
    <main className={styles.page} dir={ar ? "rtl" : "ltr"}>
      {query.isPending ? (
        <p role="status">{ar ? "جارٍ تحميل المحتوى…" : "Loading content…"}</p>
      ) : query.isError ? (
        <div role="alert">
          <p>{query.error.message}</p>
          <button onClick={() => void query.refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      ) : (
        <Editor
          initial={query.data.state}
          canEdit={query.data.canEdit}
          canPublish={query.data.canPublish}
          canUpload={query.data.canUpload}
        />
      )}
    </main>
  );
}
function Editor({
  initial,
  canEdit,
  canPublish,
  canUpload,
}: {
  initial: State;
  canEdit: boolean;
  canPublish: boolean;
  canUpload: boolean;
}) {
  const client = useMemo(() => createClient("admin"), []),
    cache = useQueryClient(),
    router = useRouter();
  const { language } = useLanguage();
  const ar = language === "ar";
  const [editPage, setEditPage] = useState<"home" | "partner" | "careers">(
    "home",
  );
  const [state, setState] = useState(initial),
    [value, setValue] = useState(() =>
      normalizePresentation(
        initial[DRAFT_KEY]?.value ?? initial[PRESENTATION_KEY]?.value,
      ),
    ),
    [saved, setSaved] = useState(() =>
      JSON.stringify(
        normalizePresentation(
          initial[DRAFT_KEY]?.value ?? initial[PRESENTATION_KEY]?.value,
        ),
      ),
    ),
    [active, setActive] = useState<keyof typeof labels>("hero"),
    [editLanguage, setEditLanguage] = useState<"ar" | "en">(language),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState(""),
    [review, setReview] = useState(false),
    [preview, setPreview] = useState(false),
    [width, setWidth] = useState(1440),
    [previewLanguage, setPreviewLanguage] = useState(language),
    [theme, setTheme] = useState<"light" | "dark">("light");
  const dirty = JSON.stringify(value) !== saved;
  useUnsaved(
    dirty,
    ar ? "لديك تعديلات غير محفوظة. هل تريد تركها؟" : "Discard unsaved changes?",
  );
  const versions = useQuery({
    queryKey: ["admin", "website-versions"],
    queryFn: async () => {
      const r = await client
        .from("website_presentation_versions")
        .select("id,actor_id,created_at,operation,restored_from")
        .order("id", { ascending: false })
        .limit(50);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  const published = normalizePresentation(state[PRESENTATION_KEY]?.value);
  const changed = Object.keys(labels).filter((key) => {
    const k = key as keyof typeof labels;
    return (
      JSON.stringify(
        k in value
          ? value[k as "hero" | "showcase" | "download"]
          : value.sections[k as TextSectionKey],
      ) !==
      JSON.stringify(
        k in published
          ? published[k as "hero" | "showcase" | "download"]
          : published.sections[k as TextSectionKey],
      )
    );
  });
  function section<K extends keyof Presentation>(
    key: K,
    patch: Partial<Presentation[K]>,
  ) {
    setValue((v) => ({ ...v, [key]: { ...v[key], ...patch } }));
  }
  async function write(
    action: "draft" | "publish" | "restore",
    restoreId?: number,
  ) {
    setFeedback("");
    if (action === "publish") {
      const invalid = validatePresentation(value);
      if (invalid) {
        setFeedback(invalid);
        return;
      }
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          content: value,
          expectedDraft: state[DRAFT_KEY].revision,
          expectedPublished: state[PRESENTATION_KEY].revision,
          restoreId,
        }),
      });
      const next = await r.json();
      if (!r.ok) throw new Error(next.error);
      setState(next);
      const normalized = normalizePresentation(next[DRAFT_KEY].value);
      setValue(normalized);
      setSaved(JSON.stringify(normalized));
      setReview(false);
      setFeedback(
        ar
          ? action === "draft"
            ? "حُفظت المسودة دون تغيير الموقع العام."
            : "تم نشر إصدار جديد محليًا. حدّث التبويبات العامة المفتوحة."
          : action === "draft"
            ? "Draft saved; public content is unchanged."
            : "New version published locally. Refresh open public tabs.",
      );
      await cache.invalidateQueries({
        queryKey: ["admin", "website-versions"],
      });
      if (action !== "draft")
        await cache.invalidateQueries({
          queryKey: ["public", "platform-settings"],
        });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }
  const pagesChanged =
    JSON.stringify(value.pages) !== JSON.stringify(published.pages);
  const navigationChanged =
    JSON.stringify(value.navigation) !== JSON.stringify(published.navigation);
  const fields = (key: "hero" | "showcase" | "download") => {
    const target = value[key];
    return Object.entries(target)
      .filter(
        ([, v]) =>
          v &&
          typeof v === "object" &&
          !Array.isArray(v) &&
          "ar" in v &&
          "en" in v,
      )
      .map(([name, v]) => (
        <Pair
          key={name}
          label={fieldName(name, ar)}
          value={v as Bilingual}
          onChange={(pair) => section(key, { [name]: pair })}
        />
      ));
  };
  const image = (key: "frontImage" | "backImage" | "image", label: string) => (
    <MediaPicker
      label={label}
      src={value.hero[key]}
      onChange={(url) => section("hero", { [key]: url })}
      canUpload={canUpload}
    />
  );
  function status(key: keyof typeof labels) {
    if (key === "programs")
      return changed.includes(key)
        ? ar
          ? "مسودة"
          : "Draft"
        : ar
          ? "منشور"
          : "Published";
    const section =
      key === "hero"
        ? null
        : key === "showcase" || key === "download"
          ? value[key]
          : value.sections[key];
    if (section?.visible === false) return ar ? "مخفي" : "Hidden";
    const title = key === "hero" ? value.hero.title : section?.title;
    if (!title?.ar.trim() || !title?.en.trim())
      return ar ? "يحتاج استكمالًا" : "Incomplete";
    return changed.includes(key)
      ? ar
        ? "مسودة"
        : "Draft"
      : ar
        ? "منشور"
        : "Published";
  }
  return (
    <EditLanguage.Provider value={editLanguage}>
      <header className={styles.header}>
        <div>
          <h1>{ar ? "إدارة محتوى الموقع" : "Website content"}</h1>
          <p>
            {dirty
              ? ar
                ? "تغييرات غير محفوظة"
                : "Unsaved changes"
              : ar
                ? "المسودة محفوظة"
                : "Draft saved"}
          </p>
          <p className={styles.muted}>
            {ar ? "آخر تعديل" : "Last edit"}: {state[DRAFT_KEY].updatedAt} ·{" "}
            {state[DRAFT_KEY].updatedByName ??
              state[DRAFT_KEY].updatedBy ??
              "—"}{" "}
            · {ar ? "الإصدار المنشور" : "Published revision"}{" "}
            {state[PRESENTATION_KEY].revision} · {ar ? "الإصدار المنشور الحالي" : "Current published version"} #{state[PRESENTATION_KEY].versionId??"—"}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            disabled={busy || !canEdit}
            onClick={() => void write("draft")}
          >
            {ar ? "حفظ مسودة" : "Save draft"}
          </button>
          <button
            disabled={busy || dirty}
            title={dirty ? "Save draft first" : undefined}
            onClick={() => setPreview(!preview)}
          >
            {ar ? "معاينة المسودة المحفوظة" : "Preview saved draft"}
          </button>
          <button
            disabled={busy || !canPublish || dirty}
            onClick={() => setReview(true)}
          >
            {ar ? "مراجعة ونشر" : "Review and publish"}
          </button>
        </div>
      </header>
      {feedback && (
        <p role="status" className={styles.feedback}>
          {feedback}
        </p>
      )}
      <label className={styles.field}>
        {ar ? "الصفحة" : "Page"}
        <select
          value={editPage}
          onChange={(e) => {
            if (["home", "partner", "careers"].includes(e.target.value))
              setEditPage(e.target.value as typeof editPage);
            else router.push("/admin/" + e.target.value);
          }}
        >
          <option value="home">{ar ? "الرئيسية" : "Home"}</option>
          <option value="partner">
            {ar ? "صفحة الشراكة" : "Partnership page"}
          </option>
          <option value="careers">
            {ar ? "صفحة الانضمام" : "Careers page"}
          </option>
          {links.map(([path, a, e]) => (
            <option key={path} value={path}>
              {ar ? a : e}
            </option>
          ))}
        </select>
      </label>
      <nav
        className={styles.actions}
        aria-label={ar ? "أقسام الصفحة" : "Page sections"}
        style={{ display: editPage === "home" ? undefined : "none" }}
      >
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={active === key}
            onClick={() => setActive(key as keyof typeof labels)}
          >
            {label[ar ? 0 : 1]} · {status(key as keyof typeof labels)}
          </button>
        ))}
      </nav>
      <div
        className={styles.actions}
        role="tablist"
        aria-label="Content language"
      >
        {(["ar", "en"] as const).map((lang) => (
          <button
            key={lang}
            role="tab"
            aria-selected={editLanguage === lang}
            onClick={() => setEditLanguage(lang)}
          >
            {lang === "ar" ? "العربية" : "English"}
          </button>
        ))}
      </div>
      {review && (
        <section className={styles.section} aria-label="Publication review">
          <h2>
            {ar ? "مراجعة التغييرات قبل النشر" : "Review before publishing"}
          </h2>
          {changed.length || pagesChanged || navigationChanged ? (
            <ul>
              {changed.map((key) => (
                <li key={key}>
                  {labels[key as keyof typeof labels][ar ? 0 : 1]}
                  <Diff
                    before={
                      key in published
                        ? published[key as "hero" | "showcase" | "download"]
                        : published.sections[key as TextSectionKey]
                    }
                    after={
                      key in value
                        ? value[key as "hero" | "showcase" | "download"]
                        : value.sections[key as TextSectionKey]
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {ar
                ? "لا تغييرات على الإصدار المنشور"
                : "No changes from published version"}
            </p>
          )}
          {pagesChanged && (
            <div>
              <h3>{ar ? "الشراكة والانضمام" : "Partnership and careers"}</h3>
              <Diff before={published.pages} after={value.pages} />
            </div>
          )}
          {navigationChanged && (
            <div>
              <h3>{ar ? "التنقل" : "Navigation"}</h3>
              <Diff before={published.navigation} after={value.navigation} />
            </div>
          )}
          <button
            disabled={
              busy ||
              !canPublish ||
              dirty ||
              (!changed.length && !pagesChanged && !navigationChanged)
            }
            onClick={() => void write("publish")}
          >
            {ar ? "تأكيد نشر الإصدار" : "Confirm publication"}
          </button>
          <button onClick={() => setReview(false)}>
            {ar ? "إلغاء" : "Cancel"}
          </button>
        </section>
      )}
      {preview && (
        <section className={styles.section}>
          <div className={styles.actions}>
            {[390, 768, 1024, 1440].map((w) => (
              <button
                key={w}
                aria-pressed={width === w}
                onClick={() => setWidth(w)}
              >
                {w}px
              </button>
            ))}
            <button
              onClick={() =>
                setPreviewLanguage(previewLanguage === "ar" ? "en" : "ar")
              }
            >
              {previewLanguage === "ar" ? "English" : "العربية"}
            </button>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme}
            </button>
            <a
              href={`/admin/website/preview?lang=${previewLanguage}&theme=${theme}&page=${editPage}`}
              target="_blank"
              rel="noreferrer"
            >
              {ar ? "فتح المعاينة" : "Open preview"}
            </a>
          </div>
          <div style={{ overflow: "auto", maxWidth: "100%" }}>
            <iframe
              title="Private saved draft preview"
              key={`${previewLanguage}-${theme}-${state[DRAFT_KEY].revision}`}
              src={`/admin/website/preview?lang=${previewLanguage}&theme=${theme}&page=${editPage}`}
              style={{ width, height: 850, border: 0 }}
            />
          </div>
        </section>
      )}
      <fieldset
        disabled={busy || !canEdit}
        className={styles.fieldset}
        style={{ display: editPage === "home" ? undefined : "none" }}
      >
        <section className={styles.section}>
          <h2>{labels[active][ar ? 0 : 1]}</h2>
          {active === "programs" ? (
            <section>
              <Pair
                label="عنوان القسم / Section title"
                value={value.programs.title}
                onChange={(title) => section("programs", { title })}
              />
              <Pair
                label="الوصف / Description"
                value={value.programs.description}
                onChange={(description) => section("programs", { description })}
              />
              <FeaturedPrograms
                ids={value.programs.ids}
                onChange={(ids) => section("programs", { ids })}
              />
            </section>
          ) : active === "hero" ? (
            <>
              <label className={styles.field}>
                {ar ? "طريقة العرض" : "Display mode"}
                <select
                  value={value.hero.mode}
                  onChange={(e) =>
                    section("hero", {
                      mode: e.target.value as "photo" | "phones",
                    })
                  }
                >
                  <option value="phones">
                    {ar ? "الجوالان" : "Two phones"}
                  </option>
                  <option value="photo">
                    {ar ? "صورة أفقية" : "Landscape photo"}
                  </option>
                </select>
              </label>
              {fields("hero")}
              {value.hero.mode === "phones" ? (
                <>
                  {image(
                    "frontImage",
                    ar
                      ? "الجوال الأمامي — PNG شفاف"
                      : "Front phone — transparent PNG",
                  )}
                  {image(
                    "backImage",
                    ar
                      ? "الجوال الخلفي — PNG شفاف"
                      : "Back phone — transparent PNG",
                  )}
                </>
              ) : (
                <>
                  {image(
                    "image",
                    ar ? "صورة الواجهة — أفقية" : "Hero image — landscape",
                  )}
                  <Field
                    label={
                      ar ? "نقطة التركيز الأفقية (%)" : "Horizontal focus (%)"
                    }
                    type="number"
                    value={String(value.hero.focusX ?? 50)}
                    onChange={(v) => section("hero", { focusX: Number(v) })}
                  />
                  <Field
                    label={
                      ar ? "نقطة التركيز الرأسية (%)" : "Vertical focus (%)"
                    }
                    type="number"
                    value={String(value.hero.focusY ?? 50)}
                    onChange={(v) => section("hero", { focusY: Number(v) })}
                  />
                </>
              )}
              <Field
                label={ar ? "وجهة الرابط" : "Link destination"}
                value={value.hero.href}
                onChange={(href) => section("hero", { href })}
              />
              <p>
                {ar
                  ? "التبديل يحتفظ بصور الوضعين."
                  : "Switching modes retains both sets of images."}
              </p>
            </>
          ) : active === "showcase" ? (
            <>
              <Check
                value={value.showcase.visible}
                onChange={(visible) => section("showcase", { visible })}
              />
              {fields("showcase")}
              <Field
                label={ar ? "وجهة الرابط" : "Link destination"}
                value={value.showcase.href}
                onChange={(href) => section("showcase", { href })}
              />
              {value.showcase.screens.map((screen, index) => (
                <article className={styles.screen} key={screen.id}>
                  <h3>{index + 1}</h3>
                  <MediaPicker
                    src={screen.image}
                    label={
                      ar
                        ? "صورة طولية دون إطار"
                        : "Portrait screenshot without phone frame"
                    }
                    canUpload={canUpload}
                    onChange={(image) =>
                      section("showcase", {
                        screens: value.showcase.screens.map((s) =>
                          s.id === screen.id ? { ...s, image } : s,
                        ),
                      })
                    }
                  />
                  {(["title", "description"] as const).map((key) => (
                    <Pair
                      key={key}
                      label={
                        key === "title"
                          ? ar
                            ? "عنوان الشاشة والنص البديل"
                            : "Screen title / image alt"
                          : fieldName(key, ar)
                      }
                      value={screen[key]}
                      onChange={(v) =>
                        section("showcase", {
                          screens: value.showcase.screens.map((s) =>
                            s.id === screen.id ? { ...s, [key]: v } : s,
                          ),
                        })
                      }
                    />
                  ))}
                  <Check
                    value={screen.visible}
                    onChange={(visible) =>
                      section("showcase", {
                        screens: value.showcase.screens.map((s) =>
                          s.id === screen.id ? { ...s, visible } : s,
                        ),
                      })
                    }
                  />
                  <Check
                    label={
                      ar
                        ? "إظهار عبارة معاينة للتطبيق"
                        : "Show app preview label"
                    }
                    value={screen.preview}
                    onChange={(preview) =>
                      section("showcase", {
                        screens: value.showcase.screens.map((s) =>
                          s.id === screen.id ? { ...s, preview } : s,
                        ),
                      })
                    }
                  />
                  <button
                    disabled={!index}
                    onClick={() => {
                      const screens = [...value.showcase.screens];
                      [screens[index - 1], screens[index]] = [
                        screens[index],
                        screens[index - 1],
                      ];
                      section("showcase", { screens });
                    }}
                  >
                    {ar ? "للأعلى" : "Move up"}
                  </button>
                  <button
                    onClick={() =>
                      section("showcase", {
                        screens: value.showcase.screens.filter(
                          (s) => s.id !== screen.id,
                        ),
                      })
                    }
                  >
                    {ar ? "إزالة من العرض" : "Remove from showcase"}
                  </button>
                </article>
              ))}
              <button
                disabled={value.showcase.screens.length >= 8}
                onClick={() =>
                  section("showcase", {
                    screens: [
                      ...value.showcase.screens,
                      {
                        id: crypto.randomUUID(),
                        image: "",
                        title: { ar: "", en: "" },
                        description: { ar: "", en: "" },
                        visible: true,
                        preview: true,
                      },
                    ],
                  })
                }
              >
                {ar ? "إضافة شاشة" : "Add screen"}
              </button>
            </>
          ) : active === "download" ? (
            <>
              <Check
                value={value.download.visible}
                onChange={(visible) => section("download", { visible })}
              />
              <p role="note">
                {ar
                  ? "التطبيق قريبًا. روابط المتاجر محفوظة للتحضير فقط؛ لا تظهر روابط تحميل أو QR، ولا تفعّل الحجز. العنوان والتنبيه التشغيلي محميان أثناء الإغلاق."
                  : "App coming soon. Store URLs may be staged; download links and QR codes remain disabled. Launch notice and title are protected while closed."}
              </p>
              {(["appStore", "googlePlay", "appGallery"] as const).map(
                (key) => (
                  <Field
                    key={key}
                    label={fieldName(key, ar)}
                    value={value.download[key]}
                    onChange={(url) => section("download", { [key]: url })}
                  />
                ),
              )}
            </>
          ) : (
            <>
              <Check
                value={value.sections[active].visible}
                onChange={(visible) =>
                  section("sections", {
                    [active]: { ...value.sections[active], visible },
                  })
                }
              />
              {(["title", "description"] as const).map((key) => (
                <Pair
                  key={key}
                  label={key}
                  value={value.sections[active][key]}
                  onChange={(v) =>
                    section("sections", {
                      [active]: { ...value.sections[active], [key]: v },
                    })
                  }
                />
              ))}
              {value.sections[active].items
                .filter(
                  (item) => !(active === "services" && item.id === "payment"),
                )
                .map((item, index) => (
                  <article key={item.id} className={styles.screen}>
                    {(["title", "description"] as const).map((key) => (
                      <Pair
                        key={key}
                        label={`${index + 1} · ${fieldName(key, ar)}`}
                        value={item[key]}
                        onChange={(v) =>
                          section("sections", {
                            [active]: {
                              ...value.sections[active],
                              items: value.sections[active].items.map((i) =>
                                i.id === item.id ? { ...i, [key]: v } : i,
                              ),
                            },
                          })
                        }
                      />
                    ))}
                  </article>
                ))}
              {active === "map" && (
                <p>
                  {ar
                    ? "المواقع والبرامج والمواعيد تُدار من صفحاتها المرتبطة أدناه."
                    : "Locations, programs and departures use the linked catalog editors below."}
                </p>
              )}
              {active === "payments" && (
                <p>
                  {ar
                    ? "عرض تعريفي فقط. التنبيه التشغيلي ووسائل الدفع المعتمدة لا يغيّرها هذا المحرر."
                    : "Informational only. Approved providers and the closed-booking notice are managed by operational policy."}
                </p>
              )}
            </>
          )}
        </section>
      </fieldset>
      {editPage !== "home" && (
        <fieldset disabled={busy || !canEdit} className={styles.fieldset}>
          <PageContentForm
            value={value.pages[editPage]}
            onChange={(page) => section("pages", { [editPage]: page })}
          />
        </fieldset>
      )}
      <fieldset disabled={busy || !canEdit} className={styles.fieldset}>
        <section className={styles.section}>
          <h2>{ar ? "التنقل" : "Navigation"}</h2>
          <Check
            label={ar ? "إظهار مدخل الشراكة" : "Show partnership entry"}
            value={value.navigation.partnerVisible}
            onChange={(partnerVisible) =>
              section("navigation", { partnerVisible })
            }
          />
          <Pair
            label={ar ? "مسمى رابط الشراكة" : "Partnership link label"}
            value={value.navigation.partnerLabel}
            onChange={(partnerLabel) => section("navigation", { partnerLabel })}
          />
          <p>
            {ar
              ? "الوجهة المعتمدة: صفحة كن شريك نور آب."
              : "Approved destination: the partnership page."}
          </p>
        </section>
      </fieldset>
      <a href="/admin/website/readiness">
        {ar
          ? "جاهزية الإطلاق وإصدارات الدليل"
          : "Launch readiness and guide releases"}
      </a>
      <section className={styles.section}>
        <h2>{ar ? "مصادر المحتوى المرتبطة" : "Linked content sources"}</h2>
        <ul>
          {links.map(([path, a, e]) => (
            <li key={path}>
              <a href={"/admin/" + path}>{ar ? a : e}</a>
            </li>
          ))}
        </ul>
        <p>
          {ar
            ? "التواصل والتذييل يتبعان الإعدادات الحالية؛ لا توجد نسخة تحرير أخرى هنا."
            : "Contact and footer use the existing settings; they are not duplicated here."}
        </p>
      </section>
      <section className={styles.section}>
        <h2>{ar ? "الإصدارات المنشورة" : "Published versions"}</h2>
        {versions.isPending ? (
          <p>Loading…</p>
        ) : versions.isError ? (
          <p role="alert">
            {versions.error.message}
            <button onClick={() => void versions.refetch()}>Retry</button>
          </p>
        ) : (
          versions.data?.map((v) => (
            <article key={v.id}>
              <strong>
                #{v.id} {v.id===state[PRESENTATION_KEY].versionId?(ar?"— الحالي":"— current"):""} · {v.operation} · {v.created_at}
              </strong>
              <p>
                {ar ? "الناشر" : "Publisher"}: {v.actor_id ?? "—"}{" "}
                {v.restored_from ? `← #${v.restored_from}` : ""}
              </p>
              <button
                disabled={!canPublish || busy || dirty}
                onClick={() => {
                  if (
                    window.confirm(
                      ar
                        ? "الاستعادة تنشر إصدارًا جديدًا من هذه النسخة. هل تؤكد؟"
                        : "Restore this snapshot as a new published version?",
                    )
                  )
                    void write("restore", v.id);
                }}
              >
                {ar ? "استعادة بإصدار جديد" : "Restore as new version"}
              </button>
            </article>
          ))
        )}
      </section>
    </EditLanguage.Provider>
  );
}
function Pair({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Bilingual;
  onChange: (v: Bilingual) => void;
}) {
  const language = useContext(EditLanguage);
  return (
    <Field
      label={`${label} · ${language === "ar" ? "العربية" : "English"}`}
      value={value[language]}
      onChange={(v) => onChange({ ...value, [language]: v })}
    />
  );
}
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className={styles.field}>
      {label}
      <input
        type={type}
        value={value}
        maxLength={1600}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Check({
  value,
  onChange,
  label = "إظهار القسم / Show section",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className={styles.check}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function Diff({ before, after }: { before: unknown; after: unknown }) {
  const flatten = (input: unknown, prefix = ""): Record<string, string> => {
    if (input && typeof input === "object")
      return Object.assign(
        {},
        ...Object.entries(input).map(([k, v]) =>
          flatten(v, prefix ? `${prefix}.${k}` : k),
        ),
      );
    return { [prefix]: String(input ?? "") };
  };
  const a = flatten(before),
    b = flatten(after);
  return (
    <ul>
      {[...new Set([...Object.keys(a), ...Object.keys(b)])]
        .filter((k) => a[k] !== b[k])
        .map((k) => (
          <li key={k}>
            <strong>{k}</strong>: <del>{a[k] || "∅"}</del> →{" "}
            <ins>{b[k] || "∅"}</ins>
          </li>
        ))}
    </ul>
  );
}

function PageContentForm({
  value,
  onChange,
}: {
  value: PageContent;
  onChange: (v: PageContent) => void;
}) {
  return (
    <section className={styles.section}>
      <h2>محتوى الصفحة / Page content</h2>
      {(["title", "emphasis", "description"] as const).map((key) => (
        <Pair
          key={key}
          label={
            key === "emphasis"
              ? "العبارة المميزة / Emphasis"
              : key === "title"
                ? "العنوان / Title"
                : "الوصف / Description"
          }
          value={value[key]}
          onChange={(pair) => onChange({ ...value, [key]: pair })}
        />
      ))}
      <h3>الأسئلة الشائعة / Frequently asked questions</h3>
      {value.faqs.map((faq, index) => (
        <article className={styles.screen} key={faq.id}>
          <Pair
            label={`السؤال / Question ${index + 1}`}
            value={faq.question}
            onChange={(question) =>
              onChange({
                ...value,
                faqs: value.faqs.map((f) =>
                  f.id === faq.id ? { ...f, question } : f,
                ),
              })
            }
          />
          <Pair
            label="الإجابة / Answer"
            value={faq.answer}
            onChange={(answer) =>
              onChange({
                ...value,
                faqs: value.faqs.map((f) =>
                  f.id === faq.id ? { ...f, answer } : f,
                ),
              })
            }
          />
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                faqs: value.faqs.filter((f) => f.id !== faq.id),
              })
            }
          >
            إزالة السؤال / Remove question
          </button>
        </article>
      ))}
      <button
        type="button"
        disabled={value.faqs.length >= 30}
        onClick={() =>
          onChange({
            ...value,
            faqs: [
              ...value.faqs,
              {
                id: crypto.randomUUID(),
                question: { ar: "", en: "" },
                answer: { ar: "", en: "" },
              },
            ],
          })
        }
      >
        إضافة سؤال / Add question
      </button>
      <p>
        حقول الطلب وحالاته مستقلة عن هذا المحتوى. / Application fields and
        workflow states are managed independently.
      </p>
    </section>
  );
}

function FeaturedPrograms({
  ids,
  onChange,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  const query = usePublicProgramCatalog();
  return (
    <section>
      <h3>
        مراجع البرامج المنشورة وترتيبها / Published program references and order
      </h3>
      <p>
        لا تُنسخ بيانات البطاقة. اختيار فارغ يستخدم ترتيب كتالوج البرامج. / Card
        data stays in the catalogue. An empty selection uses catalogue order.
      </p>
      {query.isError ? (
        <button type="button" onClick={() => void query.refetch()}>
          إعادة تحميل البرامج / Retry programs
        </button>
      ) : query.isPending ? (
        <p>جارٍ تحميل البرامج / Loading programs</p>
      ) : (
        <>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onChange([...ids, e.target.value]);
            }}
            disabled={ids.length >= 12}
          >
            <option value="">إضافة برنامج منشور / Add published program</option>
            {query.data
              ?.filter((p) => !ids.includes(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titleAr} / {p.titleEn}
                </option>
              ))}
          </select>
          <ol>
            {ids.map((id, index) => (
              <li key={id}>
                {query.data?.find((p) => p.id === id)?.titleAr ??
                  "مرجع غير منشور / Unpublished reference"}{" "}
                <button
                  type="button"
                  disabled={!index}
                  onClick={() => {
                    const next = [...ids];
                    [next[index - 1], next[index]] = [
                      next[index],
                      next[index - 1],
                    ];
                    onChange(next);
                  }}
                >
                  نقل لأعلى / Move up
                </button>
                <button
                  type="button"
                  onClick={() => onChange(ids.filter((x) => x !== id))}
                >
                  إزالة / Remove
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
