"use client";
import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { uploadMedia } from "../media/repositories/media.repository";
import { imageInfo } from "../media/utils/imageInfo";
import { useLanguage } from "../../core/i18n";
import { safeImage } from "./presentation";
export default function MediaPicker({
  src,
  onChange,
  canUpload,
  label,
}: {
  src: string;
  onChange: (url: string) => void;
  canUpload: boolean;
  label: string;
}) {
  const client = useMemo(() => createClient("admin"), []),
    cache = useQueryClient();
  const { language } = useLanguage();
  const ar = language === "ar";
  const [open, setOpen] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [alt, setAlt] = useState({ ar: "", en: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dimensions, setDimensions] = useState<{
      width: number;
      height: number;
    } | null>(null);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const library = useQuery({
    queryKey: ["admin", "website-media-library"],
    enabled: open,
    queryFn: async () => {
      const r = await client
        .from("media")
        .select(
          "id,bucket,path,file_name,mime_type,size_bytes,width,height,alt_ar,alt_en",
        )
        .eq("bucket", "media")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (r.error) throw r.error;
      return r.data;
    },
  });
  return (
    <div>
      <strong>{label}</strong>
      {src && (
        <Image
          src={src}
          width={140}
          height={120}
          unoptimized
          alt={label}
          style={{ objectFit: "contain" }}
        />
      )}
      <button type="button" onClick={() => setOpen(!open)}>
        {ar ? "اختيار من مكتبة الوسائط" : "Choose from media library"}
      </button>
      {src && (
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                ar
                  ? "إزالة الصورة من هذا الموضع فقط؟ يبقى الأصل في المكتبة."
                  : "Remove from this placement? The original remains in the library.",
              )
            )
              onChange("");
          }}
        >
          {ar ? "إزالة من الموضع" : "Remove from placement"}
        </button>
      )}
      {open && (
        <section>
          <p>
            {ar
              ? "اختيار صورة موجودة لا يرفع نسخة جديدة. مكتبة آخر 200 ملف؛ لإدارة كامل المكتبة افتح الوسائط."
              : "Selecting an existing image reuses its original. Latest 200 files; use Media for the full library."}
          </p>
          <a href="/admin/media" target="_blank" rel="noreferrer">
            {ar ? "إدارة الوسائط والنص البديل" : "Manage media and alt text"}
          </a>
          {library.isPending ? (
            <p>Loading…</p>
          ) : library.isError ? (
            <p role="alert">
              {ar ? "تعذر تحميل المكتبة" : "Library unavailable"}{" "}
              <button onClick={() => void library.refetch()}>Retry</button>
            </p>
          ) : (
            <select
              value=""
              onChange={(e) => {
                const row = library.data?.find((r) => r.id === e.target.value);
                if (row) {
                  const url = client.storage
                    .from(row.bucket)
                    .getPublicUrl(row.path).data.publicUrl;
                  if (safeImage(url)) {
                    onChange(url);
                    setOpen(false);
                  } else setError("Unsupported media origin");
                }
              }}
            >
              <option value="">{ar ? "اختر صورة" : "Choose image"}</option>
              {library.data
                ?.filter((r) => r.mime_type?.startsWith("image/"))
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.file_name} · {r.width ?? "?"}×{r.height ?? "?"} ·{" "}
                    {Math.ceil(r.size_bytes / 1024)}KB · {r.mime_type} ·{" "}
                    {ar ? r.alt_ar : r.alt_en}
                  </option>
                ))}
            </select>
          )}
          <label>
            {ar ? "رفع أصل جديد" : "Upload a new original"}
            <input
              type="file"
              disabled={!canUpload || busy}
              accept="image/png,image/jpeg,image/webp"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                setError("");
                setFile(null);
                setDimensions(null);
                if (!f) return;
                try {
                  if (
                    f.size > 10 * 1024 * 1024 ||
                    !["image/png", "image/jpeg", "image/webp"].includes(f.type)
                  )
                    throw new Error("PNG/JPG/WebP · max 10MB");
                  const d = await imageInfo(f);
                  setDimensions(d);
                  setPreview(URL.createObjectURL(f));
                  setFile(f);
                } catch (err) {
                  setError(String(err));
                }
              }}
            />
          </label>
          {file && (
            <>
              <Image
                src={preview || src}
                width={160}
                height={160}
                unoptimized
                alt={ar ? alt.ar : alt.en}
              />
              <p>
                {dimensions?.width}×{dimensions?.height} ·{" "}
                {Math.ceil(file.size / 1024)}KB · {file.type}
              </p>
              <label>
                النص البديل بالعربية
                <input
                  value={alt.ar}
                  onChange={(e) => setAlt({ ...alt, ar: e.target.value })}
                />
              </label>
              <label>
                English alt text
                <input
                  value={alt.en}
                  onChange={(e) => setAlt({ ...alt, en: e.target.value })}
                />
              </label>
              <button
                type="button"
                disabled={busy || !alt.ar.trim() || !alt.en.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await uploadMedia(client, {
                      file,
                      folder: "website/presentation",
                      altAr: alt.ar,
                      altEn: alt.en,
                    });
                    onChange(r.publicUrl);
                    setFile(null);
                    setOpen(false);
                    await cache.invalidateQueries({
                      queryKey: ["admin", "website-media-library"],
                    });
                  } catch (err) {
                    setError(String(err));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {ar
                  ? "تأكيد الرفع واستخدام الصورة"
                  : "Confirm upload and use image"}
              </button>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}
