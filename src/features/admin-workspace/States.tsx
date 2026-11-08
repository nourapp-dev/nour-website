"use client";
import { useLanguage } from "../../core/i18n";
import { errorText } from "./data";
export function Loading() {
  const { language } = useLanguage();
  return (
    <p className="aw-state" role="status">
      {language === "ar" ? "جارٍ تحميل البيانات…" : "Loading data…"}
    </p>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { language } = useLanguage();
  return (
    <div className="aw-error" role="alert">
      <p>{errorText(error, language === "ar")}</p>
      {retry && (
        <button onClick={retry}>
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      )}
    </div>
  );
}
export function Empty({ filtered = false }: { filtered?: boolean }) {
  const { language } = useLanguage();
  return (
    <p className="aw-state">
      {language === "ar"
        ? filtered
          ? "لا توجد نتائج مطابقة للفلاتر."
          : "لا توجد سجلات حتى الآن."
        : filtered
          ? "No records match these filters."
          : "No records yet."}
    </p>
  );
}
