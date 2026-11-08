"use client";
import {useUnsaved} from "../../../../src/features/admin-workspace/useUnsaved";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  History,
  Save,
  Send,
} from "lucide-react";

import { useLanguage } from "../../../../src/core/i18n";
import { createClient } from "../../../../src/lib/supabase/client";
import {
  getLegalPageById,
  publishLegalPage,
  updateLegalPage,
} from "../../../../src/features/legal/services/legal.repository";
import type {
  LegalPage,
  LegalPageFormValues,
} from "../../../../src/features/legal/types/legal";

const copy = {
  ar: {
    back: "المحتوى القانوني",
    kicker: "إدارة المحتوى القانوني",
    subtitle:
      "عدّل النسخة الحالية واحفظها كمسودة، ثم انشرها عندما تصبح جاهزة.",
    versions: "سجل الإصدارات",
    draft: "مسودة",
    published: "منشور",
    inactive: "غير نشط",
    loading: "جاري تحميل المحتوى القانوني...",
    notFound: "لم يتم العثور على الصفحة القانونية.",
    backToLegal: "العودة إلى المحتوى القانوني",
    pageInfo: "معلومات الصفحة",
    pageInfoText: "العناوين ورقم الإصدار وحالة التفعيل.",
    titleAr: "العنوان بالعربية",
    titleEn: "العنوان بالإنجليزية",
    version: "رقم الإصدار",
    pageStatus: "حالة الصفحة",
    active: "نشطة",
    inactiveToggle: "غير نشطة",
    arabicContent: "المحتوى العربي",
    arabicContentText: "اكتب النص الذي سيظهر للمستخدم باللغة العربية.",
    englishContent: "المحتوى الإنجليزي",
    englishContentText: "اكتب النسخة الإنجليزية المقابلة للمحتوى.",
    arabicPlaceholder: "اكتب سياسة الخصوصية أو الشروط والأحكام هنا...",
    englishPlaceholder: "Enter the English legal content here...",
    lastPublished: "آخر نشر:",
    neverPublished: "لم ينشر بعد",
    saveDraft: "حفظ المسودة",
    saving: "جارٍ الحفظ...",
    publish: "نشر الإصدار",
    publishing: "جارٍ النشر...",
    saved: "تم حفظ المسودة بنجاح.",
    publishedSuccess: (version: string) =>
      `تم نشر الإصدار ${version} بنجاح.`,
    titleArRequired: "العنوان العربي مطلوب.",
    titleEnRequired: "العنوان الإنجليزي مطلوب.",
    versionRequired: "رقم الإصدار مطلوب.",
    contentArRequired: "المحتوى العربي مطلوب قبل النشر.",
    contentEnRequired: "المحتوى الإنجليزي مطلوب قبل النشر.",
    activeRequired: "يجب تفعيل الصفحة قبل نشرها.",
    saveError: "تعذر حفظ المسودة.",
    publishError: "تعذر نشر المحتوى القانوني.",
    loadError: "تعذر تحميل المحتوى القانوني.",
  },
  en: {
    back: "Legal Content",
    kicker: "Legal Content Management",
    subtitle:
      "Edit the current working copy, save it as a draft, then publish it when ready.",
    versions: "Version history",
    draft: "Draft",
    published: "Published",
    inactive: "Inactive",
    loading: "Loading legal content...",
    notFound: "The legal page could not be found.",
    backToLegal: "Back to Legal Content",
    pageInfo: "Page information",
    pageInfoText: "Titles, version number, and activation status.",
    titleAr: "Arabic title",
    titleEn: "English title",
    version: "Version number",
    pageStatus: "Page status",
    active: "Active",
    inactiveToggle: "Inactive",
    arabicContent: "Arabic content",
    arabicContentText: "Enter the text shown to Arabic-speaking users.",
    englishContent: "English content",
    englishContentText: "Enter the corresponding English version.",
    arabicPlaceholder: "Enter the Arabic legal content here...",
    englishPlaceholder: "Enter the English legal content here...",
    lastPublished: "Last published:",
    neverPublished: "Not published yet",
    saveDraft: "Save draft",
    saving: "Saving...",
    publish: "Publish version",
    publishing: "Publishing...",
    saved: "Draft saved successfully.",
    publishedSuccess: (version: string) =>
      `Version ${version} published successfully.`,
    titleArRequired: "Arabic title is required.",
    titleEnRequired: "English title is required.",
    versionRequired: "Version number is required.",
    contentArRequired: "Arabic content is required before publishing.",
    contentEnRequired: "English content is required before publishing.",
    activeRequired: "The page must be active before publishing.",
    saveError: "Unable to save the draft.",
    publishError: "Unable to publish legal content.",
    loadError: "Unable to load legal content.",
  },
} as const;

const emptyForm: LegalPageFormValues = {
  titleAr: "",
  titleEn: "",
  contentAr: "",
  contentEn: "",
  version: "1.0",
  isActive: true,
};

export default function AdminLegalEditPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const t = copy[language];

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const legalPageId =
    typeof params?.id === "string" ? params.id : "";

  const supabase = useMemo(() => createClient(), []);

  const [page, setPage] = useState<LegalPage | null>(null);
  const [form, setForm] =
    useState<LegalPageFormValues>(emptyForm);
  useUnsaved(!!page && (form.titleAr !== page.titleAr || form.titleEn !== page.titleEn || form.contentAr !== page.contentAr || form.contentEn !== page.contentEn || form.version !== page.version || form.isActive !== page.isActive), language==='ar' ? 'لديك تعديلات غير محفوظة. هل تريد المغادرة؟' : 'Unsaved changes. Leave?');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!legalPageId) return;

      try {
        setIsLoading(true);
        setErrorMessage("");

        const result = await getLegalPageById(
          supabase,
          legalPageId,
        );

        if (!mounted) return;

        setPage(result);
        setForm({
          titleAr: result.titleAr,
          titleEn: result.titleEn,
          contentAr: result.contentAr,
          contentEn: result.contentEn,
          version: result.version,
          isActive: result.isActive,
        });
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : t.loadError,
        );
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [legalPageId, supabase, t.loadError]);

  function updateField<K extends keyof LegalPageFormValues>(
    key: K,
    value: LegalPageFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.titleAr.trim()) return t.titleArRequired;
    if (!form.titleEn.trim()) return t.titleEnRequired;
    if (!form.version.trim()) return t.versionRequired;
    return "";
  }

  function validatePublish() {
    const formError = validateForm();
    if (formError) return formError;
    if (!form.contentAr.trim()) return t.contentArRequired;
    if (!form.contentEn.trim()) return t.contentEnRequired;
    if (!form.isActive) return t.activeRequired;
    return "";
  }

  async function saveDraft(event?: FormEvent) {
    event?.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return null;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const updated = await updateLegalPage(
        supabase,
        legalPageId,
        form,
      );

      setPage(updated);
      setForm({
        titleAr: updated.titleAr,
        titleEn: updated.titleEn,
        contentAr: updated.contentAr,
        contentEn: updated.contentEn,
        version: updated.version,
        isActive: updated.isActive,
      });

      setSuccessMessage(t.saved);
      return updated;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.saveError,
      );
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    const validationError = validatePublish();

    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    try {
      setIsPublishing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const saved = await updateLegalPage(
        supabase,
        legalPageId,
        form,
      );

      await publishLegalPage(supabase, legalPageId);

      const refreshed = await getLegalPageById(
        supabase,
        legalPageId,
      );

      setPage(refreshed);
      setForm({
        titleAr: refreshed.titleAr,
        titleEn: refreshed.titleEn,
        contentAr: refreshed.contentAr,
        contentEn: refreshed.contentEn,
        version: refreshed.version,
        isActive: refreshed.isActive,
      });

      setSuccessMessage(t.publishedSuccess(saved.version));
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.publishError,
      );
    } finally {
      setIsPublishing(false);
    }
  }

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <main
        className="legal-editor-page"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="legal-editor-card">{t.loading}</div>
        <style>{baseStyles}</style>
      </main>
    );
  }

  if (!page) {
    return (
      <main
        className="legal-editor-page"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="legal-editor-card">
          <p>{errorMessage || t.notFound}</p>
          <Link
            href="/admin/legal"
            className="legal-button legal-button-secondary"
          >
            {t.backToLegal}
          </Link>
        </div>
        <style>{baseStyles}</style>
      </main>
    );
  }

  const statusLabel =
    page.status === "published"
      ? t.published
      : page.status === "inactive"
        ? t.inactive
        : t.draft;

  const displayTitle = isArabic ? page.titleAr : page.titleEn;

  return (
    <main
      className="legal-editor-page"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="legal-editor-header">
        <div>
          <Link href="/admin/legal" className="legal-back-link">
            <BackIcon size={17} strokeWidth={1.9} />
            {t.back}
          </Link>

          <span className="legal-editor-kicker">{t.kicker}</span>
          <h1>{displayTitle}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className="legal-editor-header-actions">
          <span
            className={`legal-editor-status legal-editor-status-${page.status}`}
          >
            {statusLabel}
          </span>

          <Link
            href={`/admin/legal/${page.id}/versions`}
            className="legal-button legal-button-secondary"
          >
            <History size={17} />
            {t.versions}
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="legal-message legal-message-error">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="legal-message legal-message-success">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      ) : null}

      <form className="legal-editor-form" onSubmit={saveDraft}>
        <section className="legal-editor-card">
          <div className="legal-editor-section-heading">
            <div>
              <FileText size={20} strokeWidth={1.9} />
            </div>

            <div>
              <h2>{t.pageInfo}</h2>
              <p>{t.pageInfoText}</p>
            </div>
          </div>

          <div className="legal-form-grid">
            <label className="legal-field">
              <span>{t.titleAr}</span>
              <input
                type="text"
                value={form.titleAr}
                onChange={(event) =>
                  updateField("titleAr", event.target.value)
                }
                dir="rtl"
              />
            </label>

            <label className="legal-field">
              <span>{t.titleEn}</span>
              <input
                type="text"
                value={form.titleEn}
                onChange={(event) =>
                  updateField("titleEn", event.target.value)
                }
                dir="ltr"
              />
            </label>

            <label className="legal-field">
              <span>{t.version}</span>
              <input
                type="text"
                value={form.version}
                onChange={(event) =>
                  updateField("version", event.target.value)
                }
                placeholder="1.0"
                dir="ltr"
              />
            </label>

            <label className="legal-switch-field">
              <span>{t.pageStatus}</span>
              <span className="legal-switch-row">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                />
                <strong>
                  {form.isActive ? t.active : t.inactiveToggle}
                </strong>
              </span>
            </label>
          </div>
        </section>

        <section className="legal-editor-card">
          <div className="legal-editor-section-heading">
            <div>
              <FileText size={20} strokeWidth={1.9} />
            </div>
            <div>
              <h2>{t.arabicContent}</h2>
              <p>{t.arabicContentText}</p>
            </div>
          </div>

          <label className="legal-field">
            <textarea
              value={form.contentAr}
              onChange={(event) =>
                updateField("contentAr", event.target.value)
              }
              dir="rtl"
              rows={18}
              placeholder={t.arabicPlaceholder}
            />
          </label>
        </section>

        <section className="legal-editor-card">
          <div className="legal-editor-section-heading">
            <div>
              <FileText size={20} strokeWidth={1.9} />
            </div>
            <div>
              <h2>{t.englishContent}</h2>
              <p>{t.englishContentText}</p>
            </div>
          </div>

          <label className="legal-field">
            <textarea
              value={form.contentEn}
              onChange={(event) =>
                updateField("contentEn", event.target.value)
              }
              dir="ltr"
              rows={18}
              placeholder={t.englishPlaceholder}
            />
          </label>
        </section>

        <section className="legal-editor-footer">
          <div>
            <strong>{t.lastPublished}</strong>
            <span>
              {page.publishedAt
                ? new Intl.DateTimeFormat(
                    isArabic ? "ar-SA" : "en-US",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  ).format(new Date(page.publishedAt))
                : t.neverPublished}
            </span>
          </div>

          <div className="legal-editor-footer-actions">
            <button
              type="submit"
              className="legal-button legal-button-secondary"
              disabled={isSaving || isPublishing}
            >
              <Save size={17} />
              {isSaving ? t.saving : t.saveDraft}
            </button>

            <button
              type="button"
              className="legal-button legal-button-primary"
              onClick={handlePublish}
              disabled={isSaving || isPublishing}
            >
              <Send size={17} />
              {isPublishing ? t.publishing : t.publish}
            </button>
          </div>
        </section>
      </form>

      <style>{baseStyles}</style>
    </main>
  );
}

const baseStyles = `
  .legal-editor-page {
    display: flex;
    flex-direction: column;
    gap: 22px;
    width: 100%;
    color: var(--nour-text-primary, #15233b);
  }

  .legal-editor-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  .legal-back-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 16px;
    color: var(--nour-primary, #176fe8);
    text-decoration: none;
    font-size: 13px;
    font-weight: 800;
  }

  .legal-editor-kicker {
    display: block;
    color: var(--nour-primary, #176fe8);
    font-size: 12px;
    font-weight: 800;
  }

  .legal-editor-header h1 {
    margin: 7px 0 6px;
    color: var(--nour-text-primary, #15233b);
    font-size: clamp(26px, 3vw, 36px);
    line-height: 1.3;
  }

  .legal-editor-header p {
    margin: 0;
    color: var(--nour-text-secondary, #667085);
  }

  .legal-editor-header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legal-editor-status {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 13px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
  }

  .legal-editor-status-draft {
    background: rgba(245, 158, 11, 0.12);
    color: #b66a00;
  }

  .legal-editor-status-published {
    background: rgba(24, 121, 78, 0.12);
    color: #18794e;
  }

  .legal-editor-status-inactive {
    background: var(--nour-surface-muted, #f2f4f7);
    color: var(--nour-text-secondary, #667085);
  }

  .legal-editor-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .legal-editor-card,
  .legal-editor-footer {
    border: 1px solid var(--nour-border, #e7eaf0);
    background: var(--nour-surface, #ffffff);
    color: var(--nour-text-primary, #15233b);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  }

  .legal-editor-card {
    padding: 24px;
    border-radius: 20px;
  }

  .legal-editor-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
  }

  .legal-editor-section-heading > div:first-child {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 12px;
    background: rgba(23, 111, 232, 0.1);
    color: var(--nour-primary, #176fe8);
  }

  .legal-editor-section-heading h2 {
    margin: 0 0 4px;
    color: var(--nour-text-primary, #15233b);
    font-size: 18px;
  }

  .legal-editor-section-heading p {
    margin: 0;
    color: var(--nour-text-secondary, #667085);
    font-size: 13px;
  }

  .legal-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .legal-field,
  .legal-switch-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .legal-field > span,
  .legal-switch-field > span:first-child {
    color: var(--nour-text-primary, #15233b);
    font-size: 13px;
    font-weight: 800;
  }

  .legal-field input,
  .legal-field textarea,
  .legal-switch-row {
    border: 1px solid var(--nour-border, #dfe4ec);
    background: var(--nour-surface-muted, #f8fafc);
    color: var(--nour-text-primary, #15233b);
  }

  .legal-field input,
  .legal-field textarea {
    width: 100%;
    border-radius: 13px;
    font: inherit;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .legal-field input {
    min-height: 46px;
    padding: 0 14px;
  }

  .legal-field textarea {
    min-height: 320px;
    padding: 16px;
    line-height: 1.9;
    resize: vertical;
  }

  .legal-field input::placeholder,
  .legal-field textarea::placeholder {
    color: var(--nour-text-muted, #98a2b3);
    opacity: 1;
  }

  .legal-field input:focus,
  .legal-field textarea:focus {
    border-color: var(--nour-primary, #176fe8);
    box-shadow: 0 0 0 3px rgba(23, 111, 232, 0.1);
  }

  .legal-switch-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 46px;
    padding: 0 14px;
    border-radius: 13px;
  }

  .legal-switch-row input {
    width: 18px;
    height: 18px;
    accent-color: var(--nour-primary, #176fe8);
  }

  .legal-editor-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 18px 20px;
    border-radius: 18px;
  }

  .legal-editor-footer > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .legal-editor-footer > div:first-child span {
    color: var(--nour-text-secondary, #667085);
    font-size: 13px;
  }

  .legal-editor-footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .legal-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    cursor: pointer;
    text-decoration: none;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
  }

  .legal-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .legal-button-primary {
    border: 1px solid var(--nour-primary, #176fe8);
    background: var(--nour-primary, #176fe8);
    color: #ffffff;
  }

  .legal-button-secondary {
    border: 1px solid var(--nour-border, #dfe4ec);
    background: var(--nour-surface-muted, #f8fafc);
    color: var(--nour-text-primary, #15233b);
  }

  .legal-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 15px;
    border-radius: 13px;
    font-size: 13px;
    font-weight: 700;
  }

  .legal-message-error {
    background: rgba(180, 35, 24, 0.1);
    color: #d92d20;
  }

  .legal-message-success {
    background: rgba(24, 121, 78, 0.12);
    color: #18794e;
  }

  @media (max-width: 800px) {
    .legal-editor-header,
    .legal-editor-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .legal-form-grid {
      grid-template-columns: 1fr;
    }

    .legal-editor-header-actions,
    .legal-editor-footer-actions {
      width: 100%;
    }

    .legal-editor-footer-actions .legal-button {
      flex: 1;
    }
  }
`;
