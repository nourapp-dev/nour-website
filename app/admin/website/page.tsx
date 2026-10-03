"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";
import { uploadMedia } from "../../../src/features/media/repositories/media.repository";
import {
  normalizePresentation,
  validatePresentation,
  savePresentation,
  PRESENTATION_KEY,
  DRAFT_KEY,
  type Bilingual,
  type Presentation,
} from "../../../src/features/website/presentation";
import Hero from "../../components/home/Hero";
import Showcase from "../../components/home/Showcase";
import CTA from "../../components/home/CTA";
import { copy } from "../../data/home";
import styles from "../../../src/features/website/PresentationEditor.module.css";

const errorText = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "تعذر إتمام العملية / Unable to complete the operation";
export default function WebsitePage() {
  const client = useMemo(() => createClient("admin"), []);
  const { language } = useLanguage();
  const ar = language === "ar";
  const query = useQuery({
    queryKey: ["admin", "website-presentation"],
    queryFn: async () => {
      const [settings, manage, upload] = await Promise.all([
        client
          .from("platform_settings")
          .select("setting_key,value_json,updated_at")
          .in("setting_key", [PRESENTATION_KEY, DRAFT_KEY])
          .is("deleted_at", null),
        client.rpc("current_user_has_permission", {
          permission_code: "settings.manage",
        }),
        client.rpc("current_user_has_permission", {
          permission_code: "media.upload",
        }),
      ]);
      if (settings.error) throw settings.error;
      if (manage.error) throw manage.error;
      if (upload.error) throw upload.error;
      const published = settings.data.find(
          (r) => r.setting_key === PRESENTATION_KEY,
        ),
        draft = settings.data.find((r) => r.setting_key === DRAFT_KEY);
      if (!published || !draft)
        throw new Error(
          ar
            ? "تعذر تحميل إعدادات الموقع. تحقق من صلاحية settings.read وتطبيق تحديث قاعدة البيانات."
            : "Cannot load website settings. Check settings.read permission and the database migration.",
        );
      const initial =
        Object.keys(draft.value_json ?? {}).length &&
        draft.updated_at >= published.updated_at
          ? draft
          : published;
      return {
        initial: normalizePresentation(initial.value_json),
        canManage: manage.data === true,
        canUpload: upload.data === true,
      };
    },
    refetchOnWindowFocus: false,
  });
  return (
    <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
      {query.isPending ? (
        <p>{ar ? "جارٍ تحميل إعدادات الموقع…" : "Loading website settings…"}</p>
      ) : query.isError ? (
        <div role="alert">
          <p>{errorText(query.error)}</p>
          <button onClick={() => void query.refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </div>
      ) : (
        <Editor
          initial={query.data.initial}
          canManage={query.data.canManage}
          canUpload={query.data.canUpload}
        />
      )}
    </div>
  );
}
function Editor({
  initial,
  canManage,
  canUpload,
}: {
  initial: Presentation;
  canManage: boolean;
  canUpload: boolean;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const client = useMemo(() => createClient("admin"), []);
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initial),
    [busy, setBusy] = useState(false),
    [feedback, setFeedback] = useState("");
  const [preview, setPreview] = useState(false),
    [mobile, setMobile] = useState(false),
    [previewLanguage, setPreviewLanguage] = useState<"ar" | "en">(language);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const dirty = JSON.stringify(value) !== saved;
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function section<K extends keyof Presentation>(
    key: K,
    patch: Partial<Presentation[K]>,
  ) {
    setValue((v) => ({ ...v, [key]: { ...v[key], ...patch } }));
  }
  function screen(
    id: string,
    patch: Partial<Presentation["showcase"]["screens"][number]>,
  ) {
    setValue((v) => ({
      ...v,
      showcase: {
        ...v.showcase,
        screens: v.showcase.screens.map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      },
    }));
  }
  function move(index: number, delta: number) {
    setValue((v) => {
      const rows = [...v.showcase.screens];
      [rows[index], rows[index + delta]] = [rows[index + delta], rows[index]];
      return { ...v, showcase: { ...v.showcase, screens: rows } };
    });
  }
  async function save(publish: boolean) {
    setFeedback("");
    if (!canManage) return;
    if (publish) {
      const error = validatePresentation(value);
      if (error) {
        setFeedback(error);
        return;
      }
    }
    setBusy(true);
    try {
      await savePresentation(client, value, publish);
      setSaved(JSON.stringify(value));
      if (publish)
        await queryClient.invalidateQueries({
          queryKey: ["public", "platform-settings"],
        });
      setFeedback(
        publish
          ? ar
            ? "تم نشر المحتوى. يظهر للزوار الجدد فور التحميل، وقد يحتاج التبويب المفتوح إلى تحديث."
            : "Published. Reload open website tabs to see changes."
          : ar
            ? "حُفظت المسودة دون تغيير الموقع المنشور."
            : "Draft saved. The published website is unchanged.",
      );
    } catch (error) {
      setFeedback(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>{ar ? "إدارة واجهة الموقع" : "Website presentation"}</h1>
          <p className={styles.muted}>
            {ar
              ? "الواجهة الرئيسية · عرض التطبيق · التحميل"
              : "Hero · App showcase · Downloads"}
          </p>
        </div>
        <div className={styles.actions}>
          <button disabled={busy} onClick={() => setPreview(!preview)}>
            {preview
              ? ar
                ? "إغلاق المعاينة"
                : "Close preview"
              : ar
                ? "معاينة"
                : "Preview"}
          </button>
          <button
            disabled={busy || !canManage}
            onClick={() => void save(false)}
          >
            {ar ? "حفظ مسودة" : "Save draft"}
          </button>
          <button
            className={styles.primary}
            disabled={busy || !canManage}
            onClick={() => void save(true)}
          >
            {ar ? "نشر التغييرات" : "Publish changes"}
          </button>
        </div>
      </div>
      <p className={styles.muted}>
        {ar
          ? "يمكن ترك صورة الواجهة فارغة وإضافتها لاحقًا. الصور هنا تعريفية ولا تنشئ برامج أو حجوزات."
          : "Leave the hero image empty until your photo is ready. Presentation images do not create programs or bookings."}{" "}
        {dirty
          ? ar
            ? "لديك تغييرات غير محفوظة."
            : "You have unsaved changes."
          : ""}
      </p>
      {!canManage && (
        <p role="status">
          {ar
            ? "عرض فقط: يلزم إذن إدارة الإعدادات للحفظ."
            : "Read only: settings.manage permission is required to save."}
        </p>
      )}
      {feedback && (
        <div role="status" className={styles.feedback}>
          {feedback}
        </div>
      )}
      {preview && (
        <section className={styles.section}>
          <div className={styles.actions}>
            <strong>{ar ? "معاينة غير منشورة" : "Unpublished preview"}</strong>
            <button onClick={() => setMobile(!mobile)}>
              {mobile
                ? ar
                  ? "عرض الكمبيوتر"
                  : "Desktop width"
                : ar
                  ? "عرض الجوال"
                  : "Mobile width"}
            </button>
            <button
              onClick={() =>
                setPreviewLanguage(previewLanguage === "ar" ? "en" : "ar")
              }
            >
              {previewLanguage === "ar" ? "English" : "العربية"}
            </button>
          </div>
          <div
            className={styles.preview}
            style={{ width: mobile ? 390 : "100%" }}
          >
            <Hero
              t={copy[previewLanguage]}
              presentation={normalizePresentation(value)}
            />
            <Showcase
              language={previewLanguage}
              presentation={normalizePresentation(value)}
            />
            <CTA
              language={previewLanguage}
              presentation={normalizePresentation(value)}
            />
          </div>
        </section>
      )}
      <fieldset disabled={busy || !canManage} className={styles.fieldset}>
        <section className={styles.section}>
          <h2>{ar ? "الواجهة الرئيسية" : "Hero"}</h2>
          <Pair
            label={ar ? "العبارة العلوية" : "Eyebrow"}
            value={value.hero.eyebrow}
            onChange={(v) => section("hero", { eyebrow: v })}
          />
          <Pair
            label={ar ? "العنوان" : "Title"}
            value={value.hero.title}
            onChange={(v) => section("hero", { title: v })}
          />
          <Pair
            label={ar ? "الوصف" : "Description"}
            value={value.hero.description}
            onChange={(v) => section("hero", { description: v })}
            multiline
          />
          <ImageField
            src={value.hero.image}
            label={
              ar
                ? "صورة الحرم — تضاف لاحقًا (يفضل صورة أفقية عالية الدقة)"
                : "Hero photo — add later (high resolution landscape preferred)"
            }
            onChange={(image) => section("hero", { image })}
            onBusy={setBusy}
            onError={setFeedback}
            canUpload={canUpload}
          />
          <Pair
            label={ar ? "وصف الصورة" : "Image description"}
            value={value.hero.imageAlt}
            onChange={(v) => section("hero", { imageAlt: v })}
          />
          <Pair
            label={ar ? "نص الزر التعريفي" : "Information link label"}
            value={value.hero.button}
            onChange={(v) => section("hero", { button: v })}
          />
          <Field
            label={
              ar
                ? "وجهة الزر (مثل #journey)"
                : "Link destination (e.g. #journey)"
            }
            value={value.hero.href}
            onChange={(href) => section("hero", { href })}
          />
          <p className={styles.muted}>
            {ar
              ? "بحث البرامج وتنبيه الحجز مرتبطان ببيانات الموقع وإعداداته التشغيلية."
              : "Program search and booking notices follow the live catalog and operational settings."}
          </p>
        </section>
        <section className={styles.section}>
          <h2>{ar ? "عرض التطبيق" : "App showcase"}</h2>
          <Check
            label={ar ? "إظهار القسم" : "Show section"}
            value={value.showcase.visible}
            onChange={(visible) => section("showcase", { visible })}
          />
          <Pair
            label={ar ? "العنوان" : "Title"}
            value={value.showcase.title}
            onChange={(title) => section("showcase", { title })}
          />
          <Pair
            label={ar ? "الوصف" : "Description"}
            value={value.showcase.description}
            onChange={(description) => section("showcase", { description })}
            multiline
          />
          <Pair
            label={ar ? "نص الزر" : "Button label"}
            value={value.showcase.button}
            onChange={(button) => section("showcase", { button })}
          />
          <Field
            label={ar ? "وجهة الزر" : "Button destination"}
            value={value.showcase.href}
            onChange={(href) => section("showcase", { href })}
          />
          {value.showcase.screens.map((item, index) => (
            <article className={styles.screen} key={item.id}>
              <div className={styles.screenHeader}>
                <strong>
                  {ar ? `الشاشة ${index + 1}` : `Screen ${index + 1}`}
                </strong>
                <div className={styles.actions}>
                  <button
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    {ar ? "للأعلى" : "Move up"}
                  </button>
                  <button
                    disabled={index === value.showcase.screens.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    {ar ? "للأسفل" : "Move down"}
                  </button>
                  <button
                    onClick={() =>
                      section("showcase", {
                        screens: value.showcase.screens.filter(
                          (s) => s.id !== item.id,
                        ),
                      })
                    }
                  >
                    {ar ? "إزالة من العرض" : "Remove from showcase"}
                  </button>
                </div>
              </div>
              <ImageField
                src={item.image}
                label={
                  ar
                    ? "صورة الشاشة (صورة طولية دون إطار جوال)"
                    : "Screen image (portrait screenshot, no phone frame)"
                }
                onChange={(image) => screen(item.id, { image })}
                onBusy={setBusy}
                onError={setFeedback}
                canUpload={canUpload}
              />
              <Pair
                label={ar ? "اسم الشاشة" : "Screen title"}
                value={item.title}
                onChange={(title) => screen(item.id, { title })}
              />
              <Pair
                label={ar ? "وصف الشاشة" : "Screen description"}
                value={item.description}
                onChange={(description) => screen(item.id, { description })}
                multiline
              />
              <Check
                label={ar ? "إظهار الشاشة" : "Show screen"}
                value={item.visible}
                onChange={(visible) => screen(item.id, { visible })}
              />
              <Check
                label={
                  ar
                    ? "بيانات توضيحية — إظهار عبارة معاينة للتطبيق"
                    : "Illustrative data — display preview label"
                }
                value={item.preview}
                onChange={(preview) => screen(item.id, { preview })}
              />
            </article>
          ))}
          <div className={styles.actions}>
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
              {ar ? "إضافة شاشة (حتى 8)" : "Add screen (up to 8)"}
            </button>
          </div>
        </section>
        <section className={styles.section}>
          <h2>{ar ? "تحميل التطبيق" : "App downloads"}</h2>
          <Check
            label={ar ? "إظهار القسم" : "Show section"}
            value={value.download.visible}
            onChange={(visible) => section("download", { visible })}
          />
          <Pair
            label={ar ? "العنوان" : "Title"}
            value={value.download.title}
            onChange={(title) => section("download", { title })}
          />
          <Pair
            label={ar ? "الوصف" : "Description"}
            value={value.download.description}
            onChange={(description) => section("download", { description })}
            multiline
          />
          <div className={styles.grid}>
            {(["appStore", "googlePlay", "appGallery"] as const).map((key) => (
              <Field
                key={key}
                label={
                  {
                    appStore: "App Store",
                    googlePlay: "Google Play",
                    appGallery: "AppGallery",
                  }[key]
                }
                value={value.download[key]}
                onChange={(url) => section("download", { [key]: url })}
              />
            ))}
          </div>
          <p className={styles.muted}>
            {ar
              ? "اترك الرابط فارغًا ليظهر «قريبًا». يُنشأ QR تلقائيًا لأول متجر له رابط صالح."
              : "Empty links show Coming soon. A QR code is generated for the first available store."}
          </p>
        </section>
      </fieldset>
    </>
  );
}
function Pair({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: Bilingual;
  onChange: (value: Bilingual) => void;
  multiline?: boolean;
}) {
  return (
    <div className={styles.grid}>
      {(["ar", "en"] as const).map((lang) => (
        <Field
          key={lang}
          label={`${label} — ${lang === "ar" ? "العربية" : "English"}`}
          value={value[lang]}
          onChange={(v) => onChange({ ...value, [lang]: v })}
          dir={lang === "ar" ? "rtl" : "ltr"}
          multiline={multiline}
        />
      ))}
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  dir,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "rtl" | "ltr";
  multiline?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          dir={dir}
          value={value}
          maxLength={1600}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          dir={dir}
          value={value}
          maxLength={400}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
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
function ImageField({
  src,
  label,
  onChange,
  onBusy,
  onError,
  canUpload,
}: {
  src: string;
  label: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
  canUpload: boolean;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  return (
    <div className={styles.image}>
      {src && (
        <Image src={src} alt={label} width={100} height={130} unoptimized />
      )}
      <label className={styles.field}>
        <span>{label}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={!canUpload}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            onBusy(true);
            onError("");
            try {
              const result = await uploadMedia(createClient("admin"), {
                file,
                folder: "website/presentation",
                altAr: label,
                altEn: label,
              });
              onChange(result.publicUrl);
            } catch (error) {
              onError(errorText(error));
            } finally {
              onBusy(false);
            }
          }}
        />
        <small>
          {ar
            ? "PNG / JPG / WebP — حتى 10 MB"
            : "PNG / JPG / WebP — up to 10 MB"}
        </small>
        {!canUpload && (
          <small>
            {ar ? "يلزم إذن رفع الوسائط" : "media.upload permission required"}
          </small>
        )}
      </label>
      {src && (
        <button type="button" onClick={() => onChange("")}>
          {ar ? "إزالة الصورة" : "Remove image"}
        </button>
      )}
    </div>
  );
}
