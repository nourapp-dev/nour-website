"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "../../core/i18n";
import { useUnsaved, serializeDraft } from "../admin-workspace/useUnsaved";
import MediaPicker from "../website/MediaPicker";
import {
  emptyVideo,
  type Video,
  videoCategories,
  categoryLabels,
  durationLabel,
} from "./model";
import {
  listVideos,
  saveVideo,
  uploadVideo,
  setFeaturedVideo,
  archiveVideo,
} from "./service";
import { VideoPlayer } from "./VideoShowcase";
import styles from "./VideosAdmin.module.css";
export default function VideosAdmin() {
  const { language } = useLanguage(),
    ar = language === "ar",
    client = useMemo(() => createClient("admin"), []),
    cache = useQueryClient();
  const [editing, setEditing] = useState<Video | null>(null),
    [original, setOriginal] = useState<Video | null>(null),
    [preview, setPreview] = useState<Video | null>(null),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [trash, setTrash] = useState(false),
    [filter, setFilter] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const permissions = useQuery({
    queryKey: ["admin", "video-permissions"],
    queryFn: async () => {
      const r = await Promise.all(
        ["website.edit", "website.publish", "media.upload"].map(
          async (permission_code) => {
            const v = await client.rpc("current_user_has_permission", {
              permission_code,
            });
            if (v.error) throw v.error;
            return Boolean(v.data);
          },
        ),
      );
      return { edit: r[0], publish: r[1], upload: r[2] };
    },
  });
  const canEdit = permissions.data?.edit ?? false,
    canPublish = permissions.data?.publish ?? false;
  const q = useQuery({
    queryKey: ["admin", "videos", trash],
    enabled: canEdit || canPublish,
    queryFn: () => listVideos(client, true, trash),
  });
  const dirty = Boolean(
    editing && (serializeDraft(editing) !== serializeDraft(original) || file),
  );
  useUnsaved(
    dirty,
    ar
      ? "لديك تعديلات فيديو غير محفوظة. هل تريد المغادرة؟"
      : "Video changes are unsaved. Leave?",
  );
  const editingId = editing?.id;
  useEffect(() => {
    if (editingId) dialog.current?.showModal();
  }, [editingId]);
  const rows = (q.data ?? [])
    .filter((v) => !filter || v.status === filter)
    .filter((v) =>
      (v.title_ar + " " + v.title_en)
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const message = (e: unknown) =>
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String(e.message)
        : ar
          ? "تعذر إتمام العملية"
          : "Operation failed";
  function close() {
    if (
      dirty &&
      !window.confirm(
        ar ? "تجاهل التعديلات غير المحفوظة؟" : "Discard unsaved changes?",
      )
    )
      return;
    setEditing(null);
    setOriginal(null);
    setFile(null);
    setError("");
  }
  function open(v?: Video) {
    const next = v ? { ...v } : emptyVideo();
    setOriginal(next);
    setEditing(next);
    setFile(null);
    setError("");
  }
  function field<K extends keyof Video>(key: K, value: Video[K]) {
    setEditing((v) => (v ? { ...v, [key]: value } : v));
  }
  async function refresh() {
    await cache.invalidateQueries({ queryKey: ["admin", "videos"] });
    await cache.invalidateQueries({ queryKey: ["public", "videos"] });
  }
  async function action(work: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const value = { ...editing };
    setBusy(true);
    setError("");
    try {
      if (file) {
        value.storage_path = await uploadVideo(client, value.id, file);
        value.source_url = "";
        value.source_kind = "file";
        setEditing(value);
        setFile(null);
      }
      await saveVideo(client, value, Boolean(original?.updated_at));
      setEditing(null);
      setOriginal(null);
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function readMetadata(f: File) {
    const u = URL.createObjectURL(f),
      v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      setEditing((current) =>
        current
          ? {
              ...current,
              duration_seconds: Number.isFinite(v.duration)
                ? Math.round(v.duration)
                : 0,
              orientation:
                v.videoHeight > v.videoWidth ? "portrait" : "landscape",
            }
          : current,
      );
      URL.revokeObjectURL(u);
      v.removeAttribute("src");
      v.load();
    };
    v.onerror = () => URL.revokeObjectURL(u);
    v.src = u;
  }
  return (
    <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <header className={styles.header}>
        <div>
          <span>{ar ? "المحتوى والموقع" : "Content & site"}</span>
          <h1>{ar ? "مكتبة الفيديوهات" : "Video library"}</h1>
          <p>
            {ar
              ? "أضف فيديوهات نور آب، اختر الرئيسي ورتّب ظهورها في الموقع."
              : "Manage Nour App videos, select a featured video and arrange their display."}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href="/admin/website">
            {ar ? "عنوان القسم وظهوره" : "Section title & visibility"}
          </Link>
          <Link
            href={"/videos?lang=" + language}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ar ? "المكتبة العامة" : "Public library"}
          </Link>
          {canEdit && (
            <button onClick={() => open()}>
              {ar ? "إضافة فيديو" : "Add video"}
            </button>
          )}
        </div>
      </header>
      {error && !editing && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {permissions.isPending ? (
        <p role="status">
          {ar ? "جارٍ التحقق من الصلاحيات…" : "Checking permissions…"}
        </p>
      ) : permissions.isError ? (
        <p role="alert">
          {ar ? "تعذر التحقق من الصلاحيات" : "Permissions could not be checked"}{" "}
          <button onClick={() => void permissions.refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </p>
      ) : !canEdit && !canPublish ? (
        <p role="alert">
          {ar
            ? "لا تملك صلاحية إدارة الفيديوهات."
            : "Video management permission is required."}
        </p>
      ) : (
        <>
          <div className={styles.filters}>
            <label>
              {ar ? "البحث" : "Search"}
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              {ar ? "الحالة" : "Status"}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
                <option value="draft">{ar ? "مسودة" : "Draft"}</option>
                <option value="published">{ar ? "منشور" : "Published"}</option>
                <option value="hidden">{ar ? "مخفي" : "Hidden"}</option>
              </select>
            </label>
            <button onClick={() => setTrash((v) => !v)}>
              {trash
                ? ar
                  ? "العودة للفيديوهات"
                  : "Back to videos"
                : ar
                  ? "سلة المحذوفات"
                  : "Trash"}
            </button>
          </div>
          {q.isPending ? (
            <p role="status">
              {ar ? "جارٍ تحميل الفيديوهات…" : "Loading videos…"}
            </p>
          ) : q.isError ? (
            <p role="alert">
              {ar ? "تعذر تحميل الفيديوهات" : "Videos could not be loaded"}{" "}
              <button onClick={() => void q.refetch()}>
                {ar ? "إعادة المحاولة" : "Retry"}
              </button>
            </p>
          ) : !rows.length ? (
            <div className={styles.empty}>
              <h2>{ar ? "لا توجد فيديوهات هنا بعد" : "No videos here yet"}</h2>
              <p>
                {ar
                  ? "ابدأ بفيديو تعريفي أو شرح قصير للتطبيق."
                  : "Start with an introduction or a short app guide."}
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {rows.map((v) => (
                <article key={v.id} className={styles.row}>
                  {/* Poster URLs are checked on save and by the database. */}
                  {v.cover_url && (
                    <Image
                      unoptimized
                      src={v.cover_url}
                      alt=""
                      width={142}
                      height={90}
                      className={styles.thumbnail}
                    />
                  )}
                  <div className={styles.rowCopy}>
                    <h2>{ar ? v.title_ar : v.title_en}</h2>
                    <p>
                      {categoryLabels[v.category][ar ? 0 : 1]} ·{" "}
                      {v.status === "published"
                        ? ar
                          ? "منشور"
                          : "Published"
                        : v.status === "draft"
                          ? ar
                            ? "مسودة"
                            : "Draft"
                          : ar
                            ? "مخفي"
                            : "Hidden"}{" "}
                      · {durationLabel(v.duration_seconds)} ·{" "}
                      {ar ? "الترتيب" : "Order"} {v.sort_order}
                    </p>
                    {v.is_featured && (
                      <strong>
                        {ar ? "الفيديو الرئيسي" : "Featured video"}
                      </strong>
                    )}
                    {!v.show_on_home && (
                      <small>{ar ? "في المكتبة فقط" : "Library only"}</small>
                    )}
                  </div>
                  <div className={styles.actions}>
                    {trash ? (
                      <button
                        disabled={busy || !canEdit}
                        onClick={() =>
                          void action(() => archiveVideo(client, v, true))
                        }
                      >
                        {ar ? "استعادة كمسودة" : "Restore as draft"}
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setPreview(v)}>
                          {ar ? "معاينة" : "Preview"}
                        </button>
                        <button
                          disabled={
                            !canEdit ||
                            (v.status === "published" && !canPublish)
                          }
                          onClick={() => open(v)}
                        >
                          {ar ? "تعديل" : "Edit"}
                        </button>
                        {v.status === "published" &&
                          v.show_on_home &&
                          !v.is_featured &&
                          canPublish && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                void action(() =>
                                  setFeaturedVideo(client, v.id),
                                )
                              }
                            >
                              {ar ? "تعيين كرئيسي" : "Set featured"}
                            </button>
                          )}
                        <button
                          disabled={
                            busy ||
                            !canEdit ||
                            (v.status === "published" && !canPublish)
                          }
                          onClick={() => {
                            if (
                              window.confirm(
                                ar
                                  ? "نقل الفيديو إلى سلة المحذوفات؟"
                                  : "Move video to trash?",
                              )
                            )
                              void action(() => archiveVideo(client, v));
                          }}
                        >
                          {ar ? "حذف" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {editing && (
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby="video-form-title"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
        >
          <form onSubmit={(e) => void submit(e)}>
            <div className={styles.header}>
              <h2 id="video-form-title">
                {original?.updated_at
                  ? ar
                    ? "تعديل الفيديو"
                    : "Edit video"
                  : ar
                    ? "إضافة فيديو"
                    : "Add video"}
              </h2>
              <button type="button" disabled={busy} onClick={close}>
                {ar ? "إغلاق" : "Close"}
              </button>
            </div>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <fieldset disabled={busy} className={styles.fields}>
              <div className={styles.grid}>
                {(["ar", "en"] as const).map((lang) => (
                  <div key={lang}>
                    <label>
                      {lang === "ar" ? "العنوان بالعربية" : "Title in English"}
                      <input
                        maxLength={180}
                        value={editing[`title_${lang}`]}
                        required
                        onChange={(e) => field(`title_${lang}`, e.target.value)}
                      />
                    </label>
                    <label>
                      {lang === "ar"
                        ? "الوصف بالعربية"
                        : "Description in English"}
                      <textarea
                        maxLength={1600}
                        rows={3}
                        value={editing[`description_${lang}`]}
                        onChange={(e) =>
                          field(`description_${lang}`, e.target.value)
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
              <label>
                {ar ? "مصدر الفيديو" : "Video source"}
                <select
                  value={editing.source_kind}
                  disabled={busy}
                  onChange={(e) => {
                    field(
                      "source_kind",
                      e.target.value as Video["source_kind"],
                    );
                    field("source_url", "");
                    field("storage_path", null);
                    setFile(null);
                  }}
                >
                  <option value="link">
                    {ar ? "رابط فيديو" : "Video link"}
                  </option>
                  <option value="file">
                    {ar ? "رفع ملف MP4 / WebM" : "Upload MP4 / WebM"}
                  </option>
                </select>
              </label>
              {editing.source_kind === "link" ? (
                <label>
                  {ar ? "رابط YouTube أو Vimeo" : "YouTube or Vimeo link"}
                  <input
                    dir="ltr"
                    value={editing.source_url}
                    required
                    placeholder="https://www.youtube.com/watch?v=…"
                    onChange={(e) => field("source_url", e.target.value)}
                  />
                  <small>
                    {ar
                      ? "روابط الفيديوهات المحلية المنشورة من الموقع مدعومة أيضًا."
                      : "Published local website video links are also supported."}
                  </small>
                </label>
              ) : (
                <label>
                  {ar ? "ملف الفيديو — حتى 50MB" : "Video file — up to 50MB"}
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    disabled={busy}
                    onChange={(e) => {
                      const next = e.target.files?.[0];
                      if (!next) return;
                      if (
                        !["video/mp4", "video/webm"].includes(next.type) ||
                        next.size > 52428800
                      ) {
                        setError(
                          ar
                            ? "اختر MP4 أو WebM حتى 50MB"
                            : "Choose MP4 or WebM up to 50MB",
                        );
                        e.target.value = "";
                        return;
                      }
                      setError("");
                      setFile(next);
                      void readMetadata(next);
                    }}
                  />
                  {editing.storage_path && (
                    <small>
                      {ar
                        ? "يوجد ملف مرفوع؛ اختيار ملف جديد يستبدل المصدر عند الحفظ."
                        : "An uploaded file is attached; a new selection replaces its source on save."}
                    </small>
                  )}
                </label>
              )}
              <MediaPicker
                src={editing.cover_url}
                onChange={(v) => field("cover_url", v)}
                canUpload={permissions.data?.upload ?? false}
                label={ar ? "صورة غلاف الفيديو" : "Video poster"}
              />
              <div className={styles.grid}>
                <label>
                  {ar ? "التصنيف" : "Category"}
                  <select
                    value={editing.category}
                    onChange={(e) =>
                      field("category", e.target.value as Video["category"])
                    }
                  >
                    {videoCategories.map((c) => (
                      <option key={c} value={c}>
                        {categoryLabels[c][ar ? 0 : 1]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {ar ? "أبعاد الفيديو" : "Video orientation"}
                  <select
                    value={editing.orientation}
                    onChange={(e) =>
                      field(
                        "orientation",
                        e.target.value as Video["orientation"],
                      )
                    }
                  >
                    <option value="landscape">
                      {ar ? "أفقي" : "Landscape"}
                    </option>
                    <option value="portrait">
                      {ar ? "عمودي" : "Portrait"}
                    </option>
                  </select>
                </label>
                <label>
                  {ar ? "المدة بالثواني" : "Duration in seconds"}
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    value={editing.duration_seconds}
                    onChange={(e) =>
                      field("duration_seconds", Number(e.target.value))
                    }
                  />
                </label>
                <label>
                  {ar ? "ترتيب الظهور" : "Display order"}
                  <input
                    type="number"
                    min={0}
                    value={editing.sort_order}
                    onChange={(e) =>
                      field("sort_order", Number(e.target.value))
                    }
                  />
                </label>
              </div>
              <div className={styles.grid}>
                <label>
                  {ar
                    ? "نص الزر بالعربية — اختياري"
                    : "Arabic button label — optional"}
                  <input
                    value={editing.cta_ar}
                    onChange={(e) => field("cta_ar", e.target.value)}
                  />
                </label>
                <label>
                  {ar
                    ? "نص الزر بالإنجليزية — اختياري"
                    : "English button label — optional"}
                  <input
                    value={editing.cta_en}
                    onChange={(e) => field("cta_en", e.target.value)}
                  />
                </label>
              </div>
              <label>
                {ar
                  ? "رابط الزر الداخلي — اختياري"
                  : "Internal button link — optional"}
                <input
                  dir="ltr"
                  placeholder="/programs"
                  value={editing.cta_href}
                  onChange={(e) => field("cta_href", e.target.value)}
                />
              </label>
              <div className={styles.grid}>
                <label>
                  {ar ? "حالة النشر" : "Publication status"}
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      field("status", e.target.value as Video["status"])
                    }
                  >
                    <option value="draft">{ar ? "مسودة" : "Draft"}</option>
                    <option value="published" disabled={!canPublish}>
                      {ar ? "منشور" : "Published"}
                    </option>
                    <option value="hidden">{ar ? "مخفي" : "Hidden"}</option>
                  </select>
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={editing.show_on_home}
                    onChange={(e) => field("show_on_home", e.target.checked)}
                  />
                  {ar ? "يظهر في الرئيسية" : "Show on homepage"}
                </label>
              </div>
              <p className={styles.hint}>
                {ar
                  ? "الرفع لا ينشر الفيديو. بعد نشره، يمكنك تعيينه كرئيسي من القائمة."
                  : "Uploading does not publish a video. After publishing, you can feature it from the list."}
              </p>
              <button className={styles.save} type="submit" disabled={busy}>
                {busy
                  ? ar
                    ? "جارٍ الحفظ…"
                    : "Saving…"
                  : ar
                    ? "حفظ الفيديو"
                    : "Save video"}
              </button>
            </fieldset>
          </form>
        </dialog>
      )}
      {preview && (
        <VideoPlayer
          video={preview}
          language={language}
          admin
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
