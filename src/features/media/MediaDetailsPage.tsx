"use client";

import Link from "next/link";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";

import Button from "../../components/ui/Button";
import { useLanguage } from "../../core/i18n";
import { useToast } from "../../core/notifications";
import { createClient } from "../../lib/supabase/client";

import {
  getMediaById,
  updateMediaAltText,
} from "./services";

type MediaDetailsPageProps = {
  mediaId: string;
};

function formatFileSize(
  sizeBytes: number,
): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(
      sizeBytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    sizeBytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function MediaDetailsPage({
  mediaId,
}: MediaDetailsPageProps) {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const isArabic = language === "ar";

  const supabase = useMemo(() => createClient(), []);

  const [altAr, setAltAr] = useState("");
  const [altEn, setAltEn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: media,
    isLoading,
    isError,
    error,
    refetch: refetchMedia,
  } = useQuery({
    queryKey: ["media", mediaId],
    queryFn: () => getMediaById(supabase, mediaId),
  });

  const [previousMedia, setPreviousMedia] = useState<typeof media>(undefined);
  if (media !== previousMedia) {
    setPreviousMedia(media);
    if (media) {
      setAltAr(media.altAr);
      setAltEn(media.altEn);
    }
  }

  async function handleSaveAltText(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      await updateMediaAltText(
        supabase,
        mediaId,
        altAr,
        altEn,
      );

      await refetchMedia();

      showToast({
        title: isArabic
          ? "تم تحديث النص البديل بنجاح"
          : "Alternative text updated successfully",
        variant: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر تحديث النص البديل."
            : "Unable to update alternative text.";

      setFormError(message);

      showToast({
        title: isArabic
          ? "تعذر تحديث النص البديل"
          : "Unable to update alternative text",
        description: message,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="nr-dashboard">
        <div className="nr-state">
          <strong>
            {isArabic
              ? "جاري تحميل تفاصيل الوسيط..."
              : "Loading media details..."}
          </strong>
        </div>
      </section>
    );
  }

  if (isError || !media) {
    return (
      <section className="nr-dashboard">
        <div className="nr-state">
          <strong>
            {isArabic
              ? "تعذر تحميل الوسيط"
              : "Unable to load media"}
          </strong>

          <p>
            {error instanceof Error
              ? error.message
              : isArabic
                ? "ملف الوسائط غير موجود."
                : "Media file not found."}
          </p>

          <Link
            href="/admin/media"
            className="nr-program-action"
          >
            {isArabic
              ? "العودة إلى الوسائط"
              : "Back to Media"}
          </Link>
        </div>
      </section>
    );
  }

  const isImage = media.mimeType.startsWith("image/");
  const hasAltChanges =
    altAr !== media.altAr || altEn !== media.altEn;

  return (
    <section className="nr-dashboard">
      <div className="nr-program-details-heading">
        <div>
          <span className="nr-dashboard-kicker">
            {isArabic ? "تفاصيل الوسيط" : "Media Details"}
          </span>
          <h1>{media.fileName}</h1>
          <p>{media.mimeType}</p>
        </div>

        <Link
          href="/admin/media"
          className="nr-program-action"
        >
          {isArabic ? "العودة إلى الوسائط" : "Back to Media"}
        </Link>
      </div>

      {isImage ? (
        <div className="nr-media-details-preview">
          <img
            src={media.publicUrl}
            alt={
              isArabic
                ? media.altAr || media.fileName
                : media.altEn || media.fileName
            }
          />
        </div>
      ) : (
        <div className="nr-state">
          <strong>
            {isArabic
              ? "معاينة الملف غير متاحة"
              : "File preview unavailable"}
          </strong>
          <a
            href={media.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="nr-program-action"
          >
            {isArabic ? "فتح الملف" : "Open File"}
          </a>
        </div>
      )}

      <div className="nr-media-details-grid">
        <article className="nr-program-details-card">
          <span>{isArabic ? "حجم الملف" : "File Size"}</span>
          <strong>{formatFileSize(media.sizeBytes)}</strong>
        </article>

        <article className="nr-program-details-card">
          <span>{isArabic ? "الأبعاد" : "Dimensions"}</span>
          <strong>
            {media.width && media.height
              ? `${media.width} × ${media.height}`
              : isArabic
                ? "غير متاحة"
                : "Unavailable"}
          </strong>
        </article>

        <article className="nr-program-details-card">
          <span>{isArabic ? "تاريخ الرفع" : "Uploaded At"}</span>
          <strong>
            {new Date(media.createdAt).toLocaleDateString(
              isArabic ? "ar-SA" : "en-GB",
            )}
          </strong>
        </article>

        <article className="nr-program-details-card">
          <span>{isArabic ? "آخر تحديث" : "Last Updated"}</span>
          <strong>
            {new Date(media.updatedAt).toLocaleDateString(
              isArabic ? "ar-SA" : "en-GB",
            )}
          </strong>
        </article>
      </div>

      <div className="nr-media-details-sections">
        <article className="nr-program-details-description">
          <h2>
            {isArabic ? "تعديل النص البديل" : "Edit Alternative Text"}
          </h2>

          <form
            className="nr-media-alt-form"
            onSubmit={(event) => {
              void handleSaveAltText(event);
            }}
          >
            <label>
              <span>
                {isArabic
                  ? "النص البديل بالعربية"
                  : "Arabic Alternative Text"}
              </span>
              <input
                type="text"
                className="nr-input"
                value={altAr}
                onChange={(event) => setAltAr(event.target.value)}
                disabled={isSaving}
              />
            </label>

            <label>
              <span>
                {isArabic
                  ? "النص البديل بالإنجليزية"
                  : "English Alternative Text"}
              </span>
              <input
                type="text"
                className="nr-input"
                value={altEn}
                onChange={(event) => setAltEn(event.target.value)}
                disabled={isSaving}
              />
            </label>

            {formError ? (
              <p className="nr-admin-login-error">{formError}</p>
            ) : null}

            <div className="nr-media-alt-actions">
              <Button
                type="submit"
                disabled={isSaving || !hasAltChanges}
              >
                {isSaving
                  ? isArabic
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? "حفظ التعديلات"
                    : "Save Changes"}
              </Button>
            </div>
          </form>
        </article>

        <article className="nr-program-details-description">
          <h2>{isArabic ? "أماكن الاستخدام" : "Used In"}</h2>

          {media.usage.programs.length === 0 &&
          media.usage.countries.length === 0 ? (
            <p>
              {isArabic
                ? "هذا الملف غير مستخدم حاليًا."
                : "This file is not currently used."}
            </p>
          ) : (
            <>
              {media.usage.programs.length > 0 ? (
                <div className="nr-media-usage-group">
                  <h3>{isArabic ? "البرامج" : "Programs"}</h3>
                  {media.usage.programs.map((program) => (
                    <Link
                      key={program.id}
                      href={`/admin/programs/${program.id}`}
                      className="nr-media-usage-item"
                    >
                      {isArabic ? program.titleAr : program.titleEn}
                    </Link>
                  ))}
                </div>
              ) : null}

              {media.usage.countries.length > 0 ? (
                <div className="nr-media-usage-group">
                  <h3>{isArabic ? "الدول" : "Countries"}</h3>
                  {media.usage.countries.map((country) => (
                    <span
                      key={country.id}
                      className="nr-media-usage-item"
                    >
                      {isArabic ? country.nameAr : country.nameEn}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </article>
      </div>
    </section>
  );
}