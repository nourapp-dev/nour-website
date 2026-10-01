"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../../core/utils/errors";
import { createClient } from "../../lib/supabase/client";
import { getMedia, type MediaItem } from "../media/repositories/media.repository";
import "./ceo-message-admin.css";

type CeoMessageValue = {
  enabled: boolean;
  name_ar: string;
  name_en: string;
  title_ar: string;
  title_en: string;
  message_ar: string;
  message_en: string;
  image_media_id: string | null;
};

const emptyValue: CeoMessageValue = {
  enabled: false,
  name_ar: "",
  name_en: "",
  title_ar: "الرئيس التنفيذي",
  title_en: "Chief Executive Officer",
  message_ar: "",
  message_en: "",
  image_media_id: null,
};

export default function CeoMessagePage() {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<CeoMessageValue>(emptyValue);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const fetchContent = useCallback(async () => {
    const [{ data, error }, mediaItems] = await Promise.all([
      supabase
        .from("platform_settings")
        .select("value_json")
        .eq("setting_key", "home.ceo_message")
        .single(),
      getMedia(supabase).catch(() => []),
    ]);

    if (error) throw error;
    return {
      value: { ...emptyValue, ...(data?.value_json as Partial<CeoMessageValue>) },
      media: mediaItems.filter((item) => item.mimeType.startsWith("image/")),
    };
  }, [supabase]);

  const applyContent = useCallback((content: Awaited<ReturnType<typeof fetchContent>>) => {
    setValue(content.value);
    setMedia(content.media);
  }, []);

  useEffect(() => {
    let active = true;
    fetchContent().then((content) => {
      if (active) applyContent(content);
    }).catch((error: unknown) => {
      if (active) setFeedback(`تعذر تحميل كلمة الرئيس التنفيذي: ${getErrorMessage(error, "يرجى المحاولة مجددًا.")}`);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchContent, applyContent]);

  async function load() {
    setLoading(true);
    setFeedback("");
    try {
      applyContent(await fetchContent());
    } catch (error) {
      setFeedback(`تعذر تحميل كلمة الرئيس التنفيذي: ${getErrorMessage(error, "يرجى المحاولة مجددًا.")}`);
    } finally {
      setLoading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");

    const { error } = await supabase.rpc("update_platform_setting", {
      p_setting_key: "home.ceo_message",
      p_value_json: value,
    });

    setSaving(false);

    if (error) {
      setFeedback(`تعذر حفظ كلمة الرئيس التنفيذي: ${error.message}`);
      return;
    }

    setFeedback("تم حفظ كلمة الرئيس التنفيذي بنجاح.");
  }

  const selectedImage = media.find((item) => item.id === value.image_media_id);

  if (loading) {
    return <section dir="rtl"><p>جارٍ تحميل كلمة الرئيس التنفيذي...</p></section>;
  }

  return (
    <section dir="rtl" className="nr-ceo-admin-page">
      <header>
        <h1>كلمة الرئيس التنفيذي</h1>
        <p>إدارة النص والصورة والمسمى الوظيفي بالعربية والإنجليزية، مع إمكانية إظهار القسم أو إخفائه من الموقع.</p>
      </header>

      {feedback && <div className="admin-card nr-ceo-admin-feedback">{feedback}</div>}

      <form className="admin-card nr-ceo-admin-form" onSubmit={save}>
        <label className="nr-ceo-admin-toggle">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => setValue({ ...value, enabled: e.target.checked })}
          />
          <span>
            <strong>إظهار قسم كلمة الرئيس التنفيذي في الموقع</strong>
            <small>{value.enabled ? "القسم مفعّل وسيظهر عند اكتمال المحتوى." : "القسم مخفي ويمكن حفظه كمسودة بدون تعبئة جميع الحقول."}</small>
          </span>
        </label>

        <div className="nr-ceo-admin-grid-2">
          <label>الاسم بالعربية
            <input required={value.enabled} value={value.name_ar} onChange={(e) => setValue({ ...value, name_ar: e.target.value })} />
          </label>
          <label>English name
            <input required={value.enabled} dir="ltr" value={value.name_en} onChange={(e) => setValue({ ...value, name_en: e.target.value })} />
          </label>
        </div>

        <div className="nr-ceo-admin-grid-2">
          <label>المسمى الوظيفي
            <input required={value.enabled} value={value.title_ar} onChange={(e) => setValue({ ...value, title_ar: e.target.value })} />
          </label>
          <label>Job title
            <input required={value.enabled} dir="ltr" value={value.title_en} onChange={(e) => setValue({ ...value, title_en: e.target.value })} />
          </label>
        </div>

        <label>الكلمة بالعربية
          <textarea required={value.enabled} rows={8} value={value.message_ar} onChange={(e) => setValue({ ...value, message_ar: e.target.value })} />
        </label>

        <label>English message
          <textarea required={value.enabled} dir="ltr" rows={8} value={value.message_en} onChange={(e) => setValue({ ...value, message_en: e.target.value })} />
        </label>

        <label>صورة الرئيس التنفيذي
          <select
            value={value.image_media_id ?? ""}
            onChange={(e) => setValue({ ...value, image_media_id: e.target.value || null })}
          >
            <option value="">بدون صورة</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>{item.altAr || item.fileName}</option>
            ))}
          </select>
        </label>

        {selectedImage && (
          <div className="nr-ceo-admin-image-preview">
            <img
              src={selectedImage.publicUrl}
              alt={selectedImage.altAr || selectedImage.fileName}
            />
            <div>
              <strong>{selectedImage.altAr || selectedImage.fileName}</strong>
              <small>معاينة الصورة المستخدمة في قسم كلمة الرئيس التنفيذي.</small>
            </div>
          </div>
        )}

        <div className="nr-ceo-admin-actions">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ الكلمة"}
          </button>
          <button type="button" disabled={saving} onClick={() => void load()}>
            إعادة تحميل
          </button>
        </div>
      </form>
    </section>
  );
}
