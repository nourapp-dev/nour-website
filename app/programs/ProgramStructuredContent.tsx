"use client";

import ProgramSectionState from "./ProgramSectionState";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, CircleX, Clock3, MapPin, RefreshCcw, Tags, WalletCards } from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import { createClient } from "../../src/lib/supabase/client";
import { getProgramDetailContent } from "../../src/features/programs/services/program-detail-content.service";

function formatMeeting(value: string | null, language: "ar" | "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function ProgramStructuredContent() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const params = useParams<{ slug?: string }>();
  const slug = typeof params?.slug === "string" ? decodeURIComponent(params.slug) : "";
  const supabase = useMemo(() => createClient(), []);

  const programQuery = useQuery({
    queryKey: ["public", "program-structured-content-id", slug],
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

  const contentQuery = useQuery({
    queryKey: ["public", "program-structured-content", programQuery.data],
    enabled: Boolean(programQuery.data),
    queryFn: () => getProgramDetailContent(supabase, programQuery.data!),
  });

  if (!slug) return null;
  if (programQuery.isError) return <ProgramSectionState language={language} title={isArabic ? "معلومات البرنامج الإضافية" : "Additional program information"} state="error" onRetry={() => void programQuery.refetch()} />;
  if (!programQuery.data) return null;
  if (contentQuery.isLoading) return <ProgramSectionState language={language} title={isArabic ? "معلومات البرنامج الإضافية" : "Additional program information"} state="loading" />;
  if (contentQuery.isError) return <ProgramSectionState language={language} title={isArabic ? "معلومات البرنامج الإضافية" : "Additional program information"} state="error" onRetry={() => void contentQuery.refetch()} />;
  if (!contentQuery.data) return null;

  const content = contentQuery.data;
  const hasContent = content.itinerary.length || content.inclusions.length || content.cancellation.length || content.meetingPoints.length || content.priceTiers.length || content.faqs.length;
  if (!hasContent) return <ProgramSectionState language={language} title={isArabic ? "معلومات البرنامج الإضافية" : "Additional program information"} state="empty" />;

  return (
    <section className="psc-wrap" dir={isArabic ? "rtl" : "ltr"} aria-label={isArabic ? "تفاصيل إضافية للبرنامج" : "Additional program details"}>
      <div className="psc-container">
        <header className="psc-intro">
          <span>{isArabic ? "تفاصيل الرحلة" : "Journey details"}</span>
          <h2>{isArabic ? "معلومات تساعدك على تقييم البرنامج" : "Information to help you assess this program"}</h2>
          <p>{isArabic ? "معلومات منظمة ومباشرة من بيانات البرنامج المنشورة في نور آب." : "Structured information published directly from the program data in NourApp."}</p>
        </header>

        {content.itinerary.length ? (
          <article className="psc-card" id="itinerary">
            <div className="psc-title"><CalendarDays/><div><small>{isArabic ? "الجدول اليومي" : "Daily itinerary"}</small><h3>{isArabic ? "خطة الرحلة يومًا بيوم" : "Your day-by-day journey"}</h3></div></div>
            <div className="psc-timeline">
              {content.itinerary.map((day) => (
                <div key={day.id} className="psc-day">
                  <span>{isArabic ? `اليوم ${day.dayNumber}` : `Day ${day.dayNumber}`}</span>
                  <div>
                    <h4>{isArabic ? day.titleAr : day.titleEn}</h4>
                    {(isArabic ? day.descriptionAr : day.descriptionEn) ? <p>{isArabic ? day.descriptionAr : day.descriptionEn}</p> : null}
                    <div className="psc-meta">
                      {(isArabic ? day.locationAr : day.locationEn) ? <em><MapPin/>{isArabic ? day.locationAr : day.locationEn}</em> : null}
                      {day.startTime ? <em><Clock3/>{day.startTime.slice(0,5)}{day.endTime ? ` – ${day.endTime.slice(0,5)}` : ""}</em> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {content.inclusions.length ? (
          <article className="psc-card" id="inclusions">
            <div className="psc-title"><Tags/><div><small>{isArabic ? "المحتويات" : "Inclusions"}</small><h3>{isArabic ? "ما يشمله البرنامج وما لا يشمله" : "What's included and excluded"}</h3></div></div>
            <div className="psc-two">
              <div className="psc-included"><h4><CheckCircle2/>{isArabic ? "يشمل" : "Included"}</h4>{!content.inclusions.some(item => item.inclusionType === "included") && <p>{isArabic ? "لم تُنشر بنود المشمول بعد؛ لا تفترض شمول خدمة دون توضيح." : "Included services have not been listed yet; do not assume a service is included."}</p>}{content.inclusions.filter((x) => x.inclusionType === "included").map((item) => <div key={item.id}><strong>{isArabic ? item.titleAr : item.titleEn}</strong>{(isArabic ? item.descriptionAr : item.descriptionEn) ? <p>{isArabic ? item.descriptionAr : item.descriptionEn}</p> : null}</div>)}</div>
              <div className="psc-excluded"><h4><CircleX/>{isArabic ? "لا يشمل" : "Not included"}</h4>{!content.inclusions.some(item => item.inclusionType === "excluded") && <p>{isArabic ? "لم تُنشر بنود غير المشمول بعد؛ هذا لا يعني أن جميع الخدمات مشمولة." : "Excluded services have not been listed yet; this does not mean all services are included."}</p>}{content.inclusions.filter((x) => x.inclusionType === "excluded").map((item) => <div key={item.id}><strong>{isArabic ? item.titleAr : item.titleEn}</strong>{(isArabic ? item.descriptionAr : item.descriptionEn) ? <p>{isArabic ? item.descriptionAr : item.descriptionEn}</p> : null}</div>)}</div>
            </div>
          </article>
        ) : null}

        {content.meetingPoints.length ? (
          <article className="psc-card" id="meeting-points">
            <div className="psc-title"><MapPin/><div><small>{isArabic ? "نقطة البداية" : "Meeting point"}</small><h3>{isArabic ? "أماكن ومواعيد الالتقاء" : "Meeting locations and times"}</h3></div></div>
            <div className="psc-grid">
              {content.meetingPoints.map((point) => <div key={point.id} className="psc-mini"><strong>{isArabic ? point.nameAr : point.nameEn}</strong>{(isArabic ? point.addressAr : point.addressEn) ? <p>{isArabic ? point.addressAr : point.addressEn}</p> : null}{point.meetingAt ? <span><Clock3/>{formatMeeting(point.meetingAt, language)}</span> : null}{(isArabic ? point.notesAr : point.notesEn) ? <small>{isArabic ? point.notesAr : point.notesEn}</small> : null}</div>)}
            </div>
          </article>
        ) : null}

        {content.priceTiers.length ? (
          <article className="psc-card" id="price-tiers">
            <div className="psc-title"><WalletCards/><div><small>{isArabic ? "الأسعار" : "Pricing"}</small><h3>{isArabic ? "فئات الأسعار المتاحة" : "Available price tiers"}</h3></div></div>
            <div className="psc-grid psc-prices">
              {content.priceTiers.map((tier) => <div key={tier.id} className="psc-mini"><strong>{isArabic ? tier.nameAr : tier.nameEn}</strong><b>{new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }).format(tier.price)} {tier.currencyCode}</b>{(isArabic ? tier.descriptionAr : tier.descriptionEn) ? <p>{isArabic ? tier.descriptionAr : tier.descriptionEn}</p> : null}{tier.minTravelers || tier.maxTravelers ? <small>{isArabic ? "عدد المسافرين: " : "Travelers: "}{tier.minTravelers ?? 1}{tier.maxTravelers ? ` – ${tier.maxTravelers}` : "+"}</small> : null}</div>)}
            </div>
          </article>
        ) : null}

        {content.cancellation.length ? (
          <article className="psc-card" id="cancellation">
            <div className="psc-title"><RefreshCcw/><div><small>{isArabic ? "الحماية والمرونة" : "Flexibility"}</small><h3>{isArabic ? "سياسة الإلغاء والاسترداد" : "Cancellation and refund policy"}</h3></div></div>
            <div className="psc-rules">
              {content.cancellation.map((rule) => <div key={rule.id}><strong>{isArabic ? rule.titleAr : rule.titleEn}</strong><p>{isArabic ? rule.descriptionAr : rule.descriptionEn}</p>{rule.refundPercent !== null ? <span>{isArabic ? `استرداد ${rule.refundPercent}%` : `${rule.refundPercent}% refund`}{rule.daysBeforeStart !== null ? isArabic ? ` قبل ${rule.daysBeforeStart} يوم من البداية` : ` ${rule.daysBeforeStart} days before start` : ""}</span> : null}</div>)}
            </div>
          </article>
        ) : null}

        {content.faqs.length ? (
          <article className="psc-card" id="program-faqs">
            <div className="psc-title"><CheckCircle2/><div><small>{isArabic ? "الأسئلة الشائعة" : "FAQ"}</small><h3>{isArabic ? "أسئلة قبل الحجز" : "Questions before booking"}</h3></div></div>
            <div className="psc-faqs">
              {content.faqs.map((faq) => <details key={faq.id}><summary>{isArabic ? faq.questionAr : faq.questionEn}</summary><p>{isArabic ? faq.answerAr : faq.answerEn}</p></details>)}
            </div>
          </article>
        ) : null}
      </div>

      <style jsx global>{`
        .psc-wrap{padding:0 0 96px;background:#f5f8fd;color:#14253d}.psc-container{width:min(1360px,calc(100% - 56px));margin:auto;display:grid;gap:20px}.psc-intro{padding-top:8px}.psc-intro>span,.psc-title small{color:#176fe8;font-size:11px;font-weight:900}.psc-intro h2{margin:7px 0 8px;font-size:clamp(28px,4vw,40px)}.psc-intro p{margin:0;color:#718198}.psc-card{padding:24px;border:1px solid #dce5f0;border-radius:24px;background:#fff;box-shadow:0 20px 60px rgba(20,59,102,.07)}.psc-title{display:flex;align-items:center;gap:12px;margin-bottom:20px}.psc-title>svg{width:38px;height:38px;padding:9px;border-radius:12px;color:#176fe8;background:#eef5ff}.psc-title h3{margin:3px 0 0;font-size:24px}.psc-timeline{display:grid;gap:14px}.psc-day{display:grid;grid-template-columns:88px 1fr;gap:18px;padding:16px;border-radius:16px;background:#f8fafd}.psc-day>span{align-self:start;padding:7px 9px;border-radius:999px;color:#176fe8;background:#eaf3ff;text-align:center;font-size:11px;font-weight:900}.psc-day h4{margin:0 0 7px;font-size:17px}.psc-day p,.psc-mini p,.psc-rules p{margin:0;color:#687b92;line-height:1.8}.psc-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}.psc-meta em,.psc-mini span{display:inline-flex;align-items:center;gap:5px;color:#61758c;font-size:11px;font-style:normal}.psc-meta svg,.psc-mini span svg{width:14px}.psc-two,.psc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.psc-two>div{padding:18px;border-radius:16px;background:#f8fafd}.psc-two h4{display:flex;align-items:center;gap:7px;margin:0 0 14px}.psc-two h4 svg{width:18px}.psc-included h4{color:#17813c}.psc-excluded h4{color:#b42318}.psc-two>div>div{padding:10px 0;border-top:1px solid #e7edf4}.psc-two p{margin:4px 0 0;color:#74869a;font-size:12px}.psc-mini{display:grid;gap:8px;padding:17px;border:1px solid #e3eaf2;border-radius:16px;background:#fbfcfe}.psc-mini b{color:#176fe8;font-size:21px}.psc-mini small{color:#7b8ba0}.psc-rules{display:grid;gap:12px}.psc-rules>div{padding:16px;border-inline-start:4px solid #ffc313;border-radius:12px;background:#fffaf0}.psc-rules span{display:inline-block;margin-top:8px;color:#8a6500;font-size:11px;font-weight:900}.psc-faqs{display:grid;gap:9px}.psc-faqs details{border:1px solid #e1e8f0;border-radius:14px;padding:13px 15px}.psc-faqs summary{cursor:pointer;font-weight:900}.psc-faqs p{margin:10px 0 0;color:#687b92;line-height:1.8}@media(max-width:760px){.psc-wrap{padding-bottom:110px}.psc-container{width:min(100% - 24px,1360px)}.psc-card{padding:18px;border-radius:18px}.psc-title h3{font-size:20px}.psc-day{grid-template-columns:1fr}.psc-day>span{justify-self:start}.psc-two,.psc-grid{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
