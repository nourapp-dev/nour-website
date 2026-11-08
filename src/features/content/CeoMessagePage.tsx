"use client";
import {useLanguage} from "../../core/i18n";
import DraftPreview from '../admin-workspace/DraftPreview';
import {useUnsaved} from '../admin-workspace/useUnsaved';

import { useCallback, useEffect, useMemo, useState } from "react";
import {errorText} from "../admin-workspace/data";
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
  const {language}=useLanguage();const ar=language==='ar';
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<CeoMessageValue>(emptyValue);
  const [savedValue,setSavedValue]=useState<CeoMessageValue>(emptyValue);
  useUnsaved(JSON.stringify(value)!==JSON.stringify(savedValue),ar?'لديك تعديلات غير محفوظة. هل تريد المغادرة؟':'You have unsaved changes. Leave?');
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
    setSavedValue(content.value);
    setMedia(content.media);
  }, []);

  useEffect(() => {
    let active = true;
    fetchContent().then((content) => {
      if (active) applyContent(content);
    }).catch((error: unknown) => {
      if (active) setFeedback(errorText(error,ar));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchContent, applyContent, ar]);

  async function load() {
    setLoading(true);
    setFeedback("");
    try {
      applyContent(await fetchContent());
    } catch (error) {
      setFeedback(errorText(error,ar));
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
      setFeedback(errorText(error,ar));
      return;
    }

    setSavedValue(value);
    setFeedback((ar ? "تم حفظ كلمة الرئيس التنفيذي بنجاح." : "CEO message saved."));
  }

  const selectedImage = media.find((item) => item.id === value.image_media_id);

  if (loading) {
    return <section dir={ar?"rtl":"ltr"}><p>{ar ? "جارٍ تحميل كلمة الرئيس التنفيذي..." : "Loading CEO message?"}</p></section>;
  }

  return (
    <section dir={ar?"rtl":"ltr"} className="nr-ceo-admin-page">
      <header>
        <h1>{ar ? "كلمة الرئيس التنفيذي" : "CEO message"}</h1>
        <p>{ar ? "إدارة النص والصورة والمسمى الوظيفي بالعربية والإنجليزية، مع إمكانية إظهار القسم أو إخفائه من الموقع." : "Manage bilingual text, image and job title, and control whether this section appears on the site."}</p>
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
            <strong>{ar ? "إظهار قسم كلمة الرئيس التنفيذي في الموقع" : "Show the CEO message on the website"}</strong>
            <small>{value.enabled ? "القسم مفعّل وسيظهر عند اكتمال المحتوى." : (ar ? "القسم مخفي ويمكن حفظه كمسودة بدون تعبئة جميع الحقول." : "This section is hidden and may be saved as a draft without completing every field.")}</small>
          </span>
        </label>

        <div className="nr-ceo-admin-grid-2">
          <label>{ar ? "الاسم بالعربية" : "Arabic name"}<input required={value.enabled} value={value.name_ar} onChange={(e) => setValue({ ...value, name_ar: e.target.value })} />
          </label>
          <label>English name
            <input required={value.enabled} dir="ltr" value={value.name_en} onChange={(e) => setValue({ ...value, name_en: e.target.value })} />
          </label>
        </div>

        <div className="nr-ceo-admin-grid-2">
          <label>{ar ? "المسمى الوظيفي" : "Job title in Arabic"}<input required={value.enabled} value={value.title_ar} onChange={(e) => setValue({ ...value, title_ar: e.target.value })} />
          </label>
          <label>Job title
            <input required={value.enabled} dir="ltr" value={value.title_en} onChange={(e) => setValue({ ...value, title_en: e.target.value })} />
          </label>
        </div>

        <label>{ar ? "الكلمة بالعربية" : "Message in Arabic"}<textarea required={value.enabled} rows={8} value={value.message_ar} onChange={(e) => setValue({ ...value, message_ar: e.target.value })} />
        </label>

        <label>English message
          <textarea required={value.enabled} dir="ltr" rows={8} value={value.message_en} onChange={(e) => setValue({ ...value, message_en: e.target.value })} />
        </label>

        <label>{ar ? "صورة الرئيس التنفيذي" : "CEO image"}<select
            value={value.image_media_id ?? ""}
            onChange={(e) => setValue({ ...value, image_media_id: e.target.value || null })}
          >
            <option value="">{ar ? "بدون صورة" : "No image"}</option>
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
              <small>{ar ? "معاينة الصورة المستخدمة في قسم كلمة الرئيس التنفيذي." : "Preview of the image used in the CEO message."}</small>
            </div>
          </div>
        )}

        <DraftPreview titleAr={value.name_ar} titleEn={value.name_en} summaryAr={value.title_ar} summaryEn={value.title_en} bodyAr={value.message_ar} bodyEn={value.message_en}/>
        <div className="nr-ceo-admin-actions">
          <button className="admin-button" type="submit" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : (ar ? "حفظ الكلمة" : "Save message")}
          </button>
          <button type="button" disabled={saving} onClick={() => void load()}>{ar ? "إعادة تحميل" : "Reload"}</button>
        </div>
      </form>
    </section>
  );
}
