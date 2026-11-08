"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import { useLanguage } from "../../../core/i18n";
export const readinessLabels: Record<string, [string, string]> = {
 visa_status_unspecified:["حالة التأشيرة غير محددة؛ راجع انطباقها","Visa applicability is unspecified; review it"],
 visa_details_required:["أضف خدمة تأشيرة فعالة عند تحديد انطباقها","Link an active visa service when applicable"],
 visa_not_applicable_has_services:["أزل روابط التأشيرة أو صحح حالة الانطباق","Remove visa links or correct applicability"],
 visa_inclusion_mismatch:["حالة الشمول لا تطابق خدمات التأشيرة المرتبطة","Visa inclusion conflicts with linked services"],
  bilingual_copy: [
    "أكمل الاسم والملخص باللغتين",
    "Complete bilingual name and summary",
  ],
  cover_required: ["أضف غلاف البرنامج", "Add a program cover"],
  country_not_browsable: [
    "اختر دولة منشورة بسوق قابل للاستعراض",
    "Choose a published browsable market",
  ],
  origin_city_required: [
    "اختر مدينة انطلاق منشورة تتبع الدولة",
    "Choose a published origin city in this country",
  ],
  invalid_duration: [
    "راجع الأيام وليالي السكن",
    "Review days and accommodation nights",
  ],
  travel_mode_required: ["حدد طريقة الوصول", "Set the arrival mode"],
  invalid_price_currency: [
    "راجع السعر والعملة المسجلين",
    "Review stored price and currency",
  ],
  price_basis_required: ["حدد أساس السعر", "Set the price basis"],
  tax_status_required: ["حدد حالة الضريبة", "Set the tax status"],
  stay_nights_mismatch: [
    "مجموع ليالي الإقامة لا يطابق ليالي البرنامج",
    "Accommodation nights do not match program nights",
  ],
  invalid_stay_room: [
    "أكمل الفندق والغرفة والشاغلين وتواريخ الإقامة",
    "Complete hotel, room, occupancy and stay dates",
  ],
  bus_has_flight_records: [
    "برنامج الحافلة يحتوي سجلات في قسم الطيران؛ راجع العلاقات",
    "Bus program has flight records; review relationships",
  ],
  bus_transport_required: [
    "اربط خدمة نقل بحافلة",
    "Link a bus transport service",
  ],
  actual_flight_required: [
    "أكمل بيانات الطيران الفعلية",
    "Complete actual flight data",
  ],
  invalid_dates_or_origins: [
    "راجع ترتيب التواريخ وعلاقات الانطلاق",
    "Review date order and origin relationships",
  ],
  no_upcoming_departures: [
    "توجد بيانات البرنامج دون مواعيد قادمة منشورة",
    "Program has no upcoming published departures",
  ],
  review_inclusions: [
    "راجع المشمول وغير المشمول",
    "Review inclusions and exclusions",
  ],
  review_free_text_after_structured_changes: [
    "عند تغيير المدة أو الغرف أو الخدمات، راجع الوصف الحر يدويًا.",
    "After changing duration, rooms or services, review free text manually.",
  ],
};
export default function ProgramReadiness({ programId }: { programId: string }) {
  const { language } = useLanguage(),
    ar = language === "ar",
    client = useMemo(() => createClient("admin"), []);
  const q = useQuery({
    queryKey: ["admin", "program-readiness", programId],
    queryFn: async () => {
      const r = await client.rpc("program_publication_readiness", {
        program_id: programId,
      });
      if (r.error) throw r.error;
      return r.data as {
        errors: string[];
        warnings: string[];
        info: string[];
        ready: boolean;
      };
    },
  });
  return (
    <section className="aw-card">
      <h2>{ar ? "جاهزية النشر" : "Publication readiness"}</h2>
      {q.isPending ? (
        <p role="status">{ar ? "جارٍ الفحص…" : "Checking…"}</p>
      ) : q.isError ? (
        <p role="alert">
          {ar ? "تعذر فحص الجاهزية" : "Readiness check unavailable"}{" "}
          <button type="button" onClick={() => void q.refetch()}>
            {ar ? "إعادة المحاولة" : "Retry"}
          </button>
        </p>
      ) : (
        <>
          {(["errors", "warnings", "info"] as const).map((group) =>
            q.data?.[group].length ? (
              <div key={group}>
                <h3>
                  {
                    {
                      errors: ar ? "أخطاء تمنع النشر" : "Publication blockers",
                      warnings: ar ? "تحذيرات" : "Warnings",
                      info: ar ? "مراجعة اختيارية" : "Review notes",
                    }[group]
                  }
                </h3>
                <ul>
                  {q.data[group].map((code) => (
                    <li key={code}>
                      {readinessLabels[code]?.[ar ? 0 : 1] ?? code}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
          <p>
            {q.data?.ready
              ? ar
                ? "البيانات المنظمة جاهزة للنشر؛ راجع النصوص والمعاينة."
                : "Structured data is ready. Review text and preview before publishing."
              : ar
                ? "يمكن حفظ مسودة ناقصة؛ يجب معالجة الأخطاء قبل النشر."
                : "Incomplete drafts can be saved; resolve blockers before publication."}
          </p>
        </>
      )}
    </section>
  );
}
