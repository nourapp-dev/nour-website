"use client";

import { useState, type FormEvent } from "react";
import WebsiteBookingNotice from "../WebsiteBookingNotice";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import type { Language } from "../../data/home";
import usePublicProgramCatalog from "../../../src/features/programs/hooks/usePublicProgramCatalog";
import { getProgramCountries, programSearchHref } from "../../../src/features/programs/utils/program-discovery";

export default function ProgramSearch({ language }: { language: Language }) {
  const isArabic = language === "ar";
  const router = useRouter();
  const [country, setCountry] = useState("all");
  const [duration, setDuration] = useState("all");
  const { data: programs = [], isLoading, isError, refetch } = usePublicProgramCatalog();
  const countries = getProgramCountries(programs, language);
  const selectedCountry = countries.some((item) => item.id === country) ? country : "all";

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(programSearchHref(selectedCountry, duration));
  };

  return (
    <form className="nr-program-search" action="/programs" method="get" onSubmit={search} role="search" aria-label={isArabic ? "البحث عن برامج العمرة" : "Find an Umrah program"} dir={isArabic ? "rtl" : "ltr"}>
      <div className="nr-program-search-fields">
        <label htmlFor="hero-country">
          <span><MapPin size={16} aria-hidden="true" />{isArabic ? "بلد الانطلاق" : "Departure country"}</span>
          <select id="hero-country" name="country" value={selectedCountry} onChange={(event) => setCountry(event.target.value)} disabled={isLoading || isError || !countries.length} aria-describedby="hero-search-hint">
            <option value="all">{isLoading ? (isArabic ? "جارٍ تحميل الدول..." : "Loading countries...") : (isArabic ? "جميع الدول" : "All countries")}</option>
            {countries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="hero-duration">
          <span><CalendarDays size={16} aria-hidden="true" />{isArabic ? "مدة الرحلة" : "Trip duration"}</span>
          <select id="hero-duration" name="duration" value={duration} onChange={(event) => setDuration(event.target.value)}>
            <option value="all">{isArabic ? "كل المدد" : "Any duration"}</option>
            <option value="short">{isArabic ? "حتى 5 أيام" : "Up to 5 days"}</option>
            <option value="medium">{isArabic ? "6 – 9 أيام" : "6–9 days"}</option>
            <option value="long">{isArabic ? "10 أيام فأكثر" : "10+ days"}</option>
          </select>
        </label>
      </div>
      <button className="nr-program-search-submit" type="submit">
        {isArabic ? "استعرض البرامج" : "Explore programs"}
        {isArabic ? <ArrowLeft size={19} aria-hidden="true" /> : <ArrowRight size={19} aria-hidden="true" />}
      </button>
      <p id="hero-search-hint" aria-live="polite">
        {isError ? <>{isArabic ? "تعذر تحميل الدول. يمكنك استعراض جميع البرامج أو " : "Countries could not load. Browse all programs or "}<button type="button" className="nr-program-search-retry" onClick={() => void refetch()}>{isArabic ? "المحاولة مجددًا" : "try again"}</button>.</> : isArabic ? "اختر ما يناسبك، وقارن تفاصيل البرامج والخدمات." : "Find your fit and compare program details and services."}
      </p>
      <WebsiteBookingNotice language={language} compact />
      <style jsx>{`
        .nr-program-search { margin-top: 26px; max-width: 640px; padding: 20px; border: 1px solid rgba(255,255,255,.4); border-radius: 22px; background: #fff; box-shadow: 0 18px 48px rgba(7,35,81,.18); color: #173557; text-align: start; }
        .nr-program-search-fields { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 14px; }
        label { display: block; min-width: 0; }
        label > span { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; color: #355677; font-size: 13px; font-weight: 800; }
        select { width: 100%; min-height: 48px; padding: 8px 10px; border: 1px solid #cbd8e6; border-radius: 11px; background: #f5f8fc; color: #173557; font: inherit; font-size: 15px; cursor: pointer; }
        select:disabled { opacity: .7; cursor: default; }
        select:focus-visible, button:focus-visible { outline: 3px solid #176fe8; outline-offset: 3px; }
        .nr-program-search-submit { display: flex; justify-content: center; align-items: center; gap: 10px; width: 100%; min-height: 50px; margin-top: 14px; border: 0; border-radius: 12px; color: #173557; background: #ffc313; font: inherit; font-weight: 900; font-size: 15px; cursor: pointer; transition: background .2s ease; }
        .nr-program-search-submit:hover { background: #ffcf43; }
        p { margin: 10px 0 0; color: #536983; font-size: 12px; line-height: 1.7; }
        .nr-program-search-retry { border: 0; padding: 0; background: transparent; color: #0a57b8; font: inherit; text-decoration: underline; cursor: pointer; }
        @media(max-width: 768px) { .nr-program-search { max-width: none; padding: 16px; margin-top: 20px; border-radius: 18px; } }
        @media(max-width: 360px) { .nr-program-search-fields { grid-template-columns: minmax(0,1fr); } }
      `}</style>
    </form>
  );
}
