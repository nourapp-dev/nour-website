"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, Users, WalletCards } from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import { WEBSITE_BOOKING_ENABLED } from "../../src/core/config/website-booking";
import { createClient } from "../../src/lib/supabase/client";
import { getPublicProgramDepartures, type ProgramDepartureStatus } from "../../src/features/programs/services/program-departures.service";
import { getPublicDeparturePriceTiers } from "../../src/features/programs/services/program-departure-pricing.service";

const statusCopy: Record<ProgramDepartureStatus, { ar: string; en: string }> = {
  scheduled: { ar: "قريبًا", en: "Scheduled" },
  open: { ar: WEBSITE_BOOKING_ENABLED ? "متاح للحجز" : "موعد معلن", en: WEBSITE_BOOKING_ENABLED ? "Open" : "Published departure" },
  full: { ar: "مكتمل", en: "Full" },
  closed: { ar: "مغلق", en: "Closed" },
  cancelled: { ar: "ملغى", en: "Cancelled" },
};

export default function ProgramDepartures() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const params = useParams<{ slug?: string }>();
  const slug = typeof params?.slug === "string" ? decodeURIComponent(params.slug) : "";
  const supabase = useMemo(() => createClient(), []);

  const programQuery = useQuery({
    queryKey: ["public", "program-departures-id", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("id")
        .eq("slug", slug)
        .eq("status", "published")
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const departuresQuery = useQuery({
    queryKey: ["public", "program-departures", programQuery.data],
    enabled: Boolean(programQuery.data),
    queryFn: () => getPublicProgramDepartures(supabase, programQuery.data!),
  });

  const pricingQuery = useQuery({
    queryKey: ["public", "program-departure-pricing", programQuery.data],
    enabled: Boolean(programQuery.data),
    queryFn: () => getPublicDeparturePriceTiers(supabase, programQuery.data!),
  });

  if (!slug || !programQuery.data || departuresQuery.isLoading || departuresQuery.isError || !departuresQuery.data?.length) return null;

  const priceTiers = pricingQuery.data ?? [];

  return (
    <section className="pdep-public" dir={isArabic ? "rtl" : "ltr"} aria-label={isArabic ? "مواعيد الانطلاق" : "Program departures"}>
      <div className="pdep-public-container">
        <div className="pdep-public-head">
          <span>{isArabic ? "اختر موعد رحلتك" : "Choose your departure"}</span>
          <h2>{isArabic ? "مواعيد الانطلاق والتوفر" : "Departures & availability"}</h2>
          <p>{isArabic ? "اطّلع على مواعيد الرحلات وتفاصيل الأسعار المعلنة." : "Explore departure dates and published pricing."}</p>
        </div>

        <div className="pdep-public-grid">
          {departuresQuery.data.map((departure) => {
            const start = new Date(departure.startAt);
            const end = departure.endAt ? new Date(departure.endAt) : null;
            const bookingDeadline = departure.bookingDeadline ? new Date(departure.bookingDeadline) : null;
            const status = statusCopy[departure.status];
            const lowSeats = WEBSITE_BOOKING_ENABLED && departure.status === "open" && departure.seatsAvailable > 0 && departure.seatsAvailable <= 5;
            const departurePrices = priceTiers.filter((tier) => tier.departureId === departure.id);

            return (
              <article key={departure.id} className={`pdep-public-card status-${departure.status}`}>
                <div className="pdep-public-top">
                  <span className="pdep-public-status">{isArabic ? status.ar : status.en}</span>
                  {lowSeats ? <span className="pdep-public-low">{isArabic ? "مقاعد محدودة" : "Limited seats"}</span> : null}
                </div>

                <div className="pdep-public-date">
                  <CalendarDays />
                  <div>
                    <strong>{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "long" }).format(start)}</strong>
                    <small>{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { timeStyle: "short" }).format(start)}{end ? ` · ${isArabic ? "حتى" : "to"} ${new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(end)}` : ""}</small>
                  </div>
                </div>

                <div className="pdep-public-meta">
                  <span><Users />{WEBSITE_BOOKING_ENABLED
                    ? (isArabic ? `${departure.seatsAvailable} مقعد متاح من ${departure.capacityTotal}` : `${departure.seatsAvailable} of ${departure.capacityTotal} seats available`)
                    : (isArabic ? `سعة الرحلة: ${departure.capacityTotal} مسافرًا` : `Departure capacity: ${departure.capacityTotal} travelers`)}</span>
                  {WEBSITE_BOOKING_ENABLED && bookingDeadline ? <span><Clock3 />{isArabic ? "آخر موعد للحجز: " : "Book by: "}{new Intl.DateTimeFormat(isArabic ? "ar-SA" : "en-US", { dateStyle: "medium" }).format(bookingDeadline)}</span> : null}
                </div>

                {departurePrices.length ? (
                  <div className="pdep-public-prices">
                    <div className="pdep-public-prices-title"><WalletCards />{isArabic ? "الأسعار لهذا الموعد" : "Pricing for this departure"}</div>
                    {departurePrices.map((tier) => (
                      <div key={tier.id} className="pdep-public-price-row">
                        <div>
                          <strong>{isArabic ? tier.nameAr : tier.nameEn}</strong>
                          {(isArabic ? tier.descriptionAr : tier.descriptionEn) ? <small>{isArabic ? tier.descriptionAr : tier.descriptionEn}</small> : null}
                          {tier.minTravelers || tier.maxTravelers ? <em>{isArabic ? "عدد المسافرين: " : "Travelers: "}{tier.minTravelers ?? 1}{tier.maxTravelers ? ` – ${tier.maxTravelers}` : "+"}</em> : null}
                        </div>
                        <b>{new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(tier.price)} {tier.currencyCode}</b>
                      </div>
                    ))}
                  </div>
                ) : null}

                {(isArabic ? departure.notesAr : departure.notesEn) ? <p>{isArabic ? departure.notesAr : departure.notesEn}</p> : null}
              </article>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .pdep-public{padding:8px 0 30px;background:#f5f8fd;color:#14253d}.pdep-public-container{width:min(1360px,calc(100% - 56px));margin:auto}.pdep-public-head{margin-bottom:18px}.pdep-public-head>span{color:#176fe8;font-size:11px;font-weight:900}.pdep-public-head h2{margin:7px 0 8px;font-size:clamp(28px,4vw,40px)}.pdep-public-head p{margin:0;color:#718198}.pdep-public-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.pdep-public-card{display:grid;gap:16px;padding:20px;border:1px solid #dce5f0;border-radius:20px;background:#fff;box-shadow:0 16px 50px rgba(20,59,102,.06)}.pdep-public-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.pdep-public-status,.pdep-public-low{display:inline-flex;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900}.pdep-public-status{background:#eef5ff;color:#176fe8}.status-open .pdep-public-status{background:#eaf8ef;color:#17743b}.status-full .pdep-public-status,.status-closed .pdep-public-status,.status-cancelled .pdep-public-status{background:#fff1f0;color:#b42318}.pdep-public-low{background:#fff7df;color:#8a6500}.pdep-public-date{display:flex;gap:12px;align-items:flex-start}.pdep-public-date>svg{width:40px;height:40px;padding:9px;border-radius:12px;background:#eef5ff;color:#176fe8}.pdep-public-date>div{display:grid;gap:4px}.pdep-public-date strong{font-size:17px}.pdep-public-date small{color:#718198}.pdep-public-meta{display:grid;gap:8px}.pdep-public-meta span{display:flex;align-items:center;gap:7px;color:#536a84;font-size:12px}.pdep-public-meta svg{width:15px}.pdep-public-prices{display:grid;gap:8px;padding:12px;border:1px solid #e5edf7;border-radius:14px;background:#f9fbfe}.pdep-public-prices-title{display:flex;align-items:center;gap:7px;color:#526981;font-size:12px;font-weight:900}.pdep-public-prices-title svg{width:16px}.pdep-public-price-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-top:9px;border-top:1px solid #e7edf4}.pdep-public-price-row>div{display:grid;gap:3px}.pdep-public-price-row small,.pdep-public-price-row em{color:#7a899b;font-size:10px;font-style:normal}.pdep-public-price-row b{white-space:nowrap;color:#176fe8}.pdep-public-card>p{margin:0;padding-top:12px;border-top:1px solid #edf1f5;color:#6d7b91;line-height:1.75}@media(max-width:980px){.pdep-public-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.pdep-public-container{width:min(100% - 24px,1360px)}.pdep-public-grid{grid-template-columns:1fr}.pdep-public-card{padding:17px;border-radius:17px}.pdep-public-price-row{flex-direction:column}}
      `}</style>
    </section>
  );
}
