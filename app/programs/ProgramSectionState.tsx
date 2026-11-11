"use client";

import type { PublicLanguage } from "../../src/core/i18n/public-language";

export default function ProgramSectionState({ language, title, state, onRetry, emptyMessage }: {
  language: PublicLanguage;
  title: string;
  state: "loading" | "error" | "empty";
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  const ar = language === "ar";
  return <div className="program-section-state" role={state === "error" ? "alert" : "status"} aria-busy={state === "loading"}>
    <strong>{title}</strong>
    <p>{state === "loading" ? (ar ? "جارٍ التحميل…" : "Loading…") : state === "error"
      ? (ar ? "تعذر تحميل هذا القسم. يمكنك متابعة الاطلاع على بقية تفاصيل البرنامج." : "This section could not load. You can still explore the rest of the program.")
      : emptyMessage || (ar ? "لم تُنشر معلومات لهذا القسم بعد." : "No information has been published for this section yet.")}</p>
    {state === "error" && onRetry ? <button className="program-action" type="button" onClick={onRetry}>{ar ? "إعادة المحاولة" : "Try again"}</button> : null}
  </div>;
}
