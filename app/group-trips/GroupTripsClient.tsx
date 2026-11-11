"use client";
import { useState, type FormEvent } from "react";
import { Users, MapPin, CalendarDays, MessageCircle } from "lucide-react";
import PublicPageShell from "../components/layout/PublicPageShell";
import { useLanguage } from "../../src/core/i18n";
import usePublicContact from "../../src/features/settings/hooks/usePublicContact";
import styles from "./groups.module.css";
import publicStyles from "../../src/styles/public-content.module.css";

export default function GroupTripsClient() {
  const {language} = useLanguage();
  const ar = language === "ar";
  const t = (a: string, e: string) => ar ? a : e;
  const contact = usePublicContact();
  const [prepared, setPrepared] = useState<{message: string; href: string} | null>(null);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [t("مرحبًا نور آب، أرغب في برنامج عمرة لمجموعتي:", "Hello Nour App, I would like an Umrah program for my group:"),
      `${t("بلد الانطلاق", "Departure country")}: ${data.get("country")}`,
      `${t("مدينة الانطلاق", "Departure city")}: ${data.get("city")}`,
      `${t("الفترة المقترحة", "Preferred period")}: ${data.get("period")}`,
      `${t("عدد البالغين", "Adults")}: ${data.get("adults")}`,
      `${t("عدد الأطفال", "Children")}: ${data.get("children")}`,
      `${t("الإقامة", "Accommodation")}: ${data.get("stay")}`,
      `${t("الخدمات المطلوبة", "Requested services")}: ${data.getAll("services").join("، ") || t("تُناقش لاحقًا", "To discuss")}`,
      `${t("ملاحظات", "Notes")}: ${data.get("notes") || "—"}`].join("\n");
    const url = new URL(contact.whatsappHref); url.searchParams.set("text", message);
    setPrepared({message, href: url.href});
  }
  return <PublicPageShell activeSection="journey"><main className={`${publicStyles.surface} ${styles.page}`} dir={ar ? "rtl" : "ltr"}>
    <header className={styles.hero}><span><Users size={20}/>{t("عمرة للمجموعات", "Umrah for groups")}</span><h1>{t("رحلة تجمعكم… نرتّب تفاصيلها معكم", "Travel together. Plan the details with us.")}</h1><p>{t("للعائلات والشركات والمجموعات؛ حدّدوا نقطة الانطلاق والفترة والخدمات، لنتواصل بشأن برنامج يناسبكم.", "For families, organizations and groups: share your departure point, preferred period and services to discuss a suitable program.")}</p><a href="#group-request">{t("جهّز طلب مجموعتك", "Prepare your group request")} {ar ? "←" : "→"}</a></header>
    <div className={styles.steps}><article><MapPin/><h2>{t("من مدينتكم", "From your city")}</h2><p>{t("خيارات حسب بلد ومدينة الانطلاق.", "Options based on your departure country and city.")}</p></article><article><CalendarDays/><h2>{t("حسب خطتكم", "Around your plans")}</h2><p>{t("فترة مقترحة وإقامة وخدمات تناسب المجموعة.", "A preferred period, accommodation and services for your group.")}</p></article><article><MessageCircle/><h2>{t("بتواصل مباشر", "Direct conversation")}</h2><p>{t("نراجع الاحتياجات قبل تأكيد السعر والتوافر.", "Discuss requirements before confirming price and availability.")}</p></article></div>
    <section id="group-request" className={styles.request}><div><span>{t("ابدأ بالتفاصيل", "Start with the details")}</span><h2>{t("اطلب برنامجًا لمجموعتك", "Request a group program")}</h2><p>{t("جهّز الطلب، راجع ملخصه، ثم افتح واتساب لإرساله إلى فريق نور آب.", "Prepare your request, review the summary, then open WhatsApp to send it to the Nour App team.")}</p><p>{t("هذا طلب استفسار ولا يؤكد حجزًا أو سعرًا أو توافرًا.", "This is an enquiry and does not confirm a booking, price or availability.")}</p></div>
    <form onSubmit={prepare} onChange={()=>setPrepared(null)}><div className={styles.fields}>
      <label>{t("بلد الانطلاق", "Departure country")}<input name="country" required maxLength={80}/></label>
      <label>{t("مدينة الانطلاق", "Departure city")}<input name="city" required maxLength={80}/></label>
      <label>{t("الفترة المقترحة", "Preferred travel period")}<input name="period" required maxLength={100} placeholder={t("مثال: الأسبوع الأول من رمضان", "e.g. first week of Ramadan")}/></label>
      <label>{t("مستوى الإقامة", "Accommodation preference")}<select name="stay"><option>{t("مرن — اقترحوا الأنسب", "Flexible — suggest options")}</option><option>{t("اقتصادي", "Economy")}</option><option>{t("متوسط", "Standard")}</option><option>{t("فاخر", "Premium")}</option></select></label>
      <label>{t("البالغون", "Adults")}<input name="adults" type="number" min="1" max="999" step="1" defaultValue="8" required/></label>
      <label>{t("الأطفال", "Children")}<input name="children" type="number" min="0" max="999" step="1" defaultValue="0" required/></label>
    </div><fieldset><legend>{t("الخدمات المطلوبة", "Requested services")}</legend>{[["السكن","Accommodation"],["النقل","Transport"],["التأشيرة","Visa"],["الطيران","Flights"],["الإرشاد والمزارات","Guidance and visits"]].map(([a,e])=><label key={e}><input type="checkbox" name="services" value={t(a,e)}/>{t(a,e)}</label>)}</fieldset>
    <label>{t("ملاحظات إضافية (اختياري)", "Additional notes (optional)")}<textarea name="notes" rows={3} maxLength={700}/></label><p>{t("لا تُدخل مستندات سفر أو معلومات دفع. تُستخدم التفاصيل فقط لتجهيز رسالتك.", "Do not include travel documents or payment information. Details are used only to prepare your message.")}</p><button type="submit">{t("راجع ملخص الطلب", "Review request summary")}</button>
    {prepared && <div className={styles.summary} role="status"><h3>{t("طلبك جاهز للمراجعة", "Your request is ready to review")}</h3><pre>{prepared.message}</pre><a href={prepared.href} target="_blank" rel="noopener noreferrer">{t("افتح واتساب لإرسال الطلب", "Open WhatsApp to send request")}</a><p>{t("لم يُرسل الطلب بعد. أكمل الإرسال داخل واتساب.", "The request has not been sent. Complete sending in WhatsApp.")}</p></div>}
    </form></section></main></PublicPageShell>;
}
