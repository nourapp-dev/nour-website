"use client";

import pageStyles from "./ProgramCatalog.styles";

import cardStyles from "../components/home/MediaCards.module.css";

import ProgramPriceNote from "./ProgramPriceNote";
import { languageHref } from "../../src/core/i18n/public-language";
import Image from "next/image";
import WebsiteBookingNotice from "../components/WebsiteBookingNotice";
import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  MapPin,
  Moon,
  Plane,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { useLanguage } from "../../src/core/i18n";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../src/lib/supabase/client";
import { getJourneyCatalog } from "../../src/features/journeys/journey.service";
import usePublicProgramCatalog from "../../src/features/programs/hooks/usePublicProgramCatalog";
import {
  getProgramCountries,
  matchesProgramDuration,
  parseProgramDuration,
} from "../../src/features/programs/utils/program-discovery";

function formatPrice(value: number, language: "ar" | "en") {
  return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PublicProgramsPage() {
  const { language } = useLanguage();
  return (
    <Suspense
      fallback={
        <main
          className={"nr-all-programs " + cardStyles.scope}
          dir={language === "ar" ? "rtl" : "ltr"}
          aria-busy="true"
        >
          <p>
            {language === "ar"
              ? "جارٍ تحميل البرامج..."
              : "Loading programs..."}
          </p>
        </main>
      }
    >
      <PublicProgramsContent />
    </Suspense>
  );
}

function PublicProgramsContent() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const params = useSearchParams();
  const router = useRouter();
  const countryFilter = params.get("country") || "all";
  const cityFilter = params.get("city");
  const client = useMemo(() => createClient("pilgrim"), []);
  const journey = useQuery({
    queryKey: ["public", "journey-map"],
    queryFn: () => getJourneyCatalog(client),
    enabled: Boolean(cityFilter),
    staleTime: 60_000,
  });
  const cityProgramIds = useMemo(
    () =>
      new Set(
        journey.data?.departures
          .filter((d) => d.origin_city_id === cityFilter)
          .map((d) => d.program_id) ?? [],
      ),
    [journey.data, cityFilter],
  );
  const durationFilter = parseProgramDuration(params.get("duration"));
  const updateDiscoveryFilter = (
    key: "country" | "duration",
    value: string,
  ) => {
    const next = new URLSearchParams(params.toString());
    if (key === "country") next.delete("city");
    if (value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`/programs${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  const [flightFilter, setFlightFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const {
    data: programs = [],
    isLoading,
    isError,
    refetch,
  } = usePublicProgramCatalog();
  const countries = getProgramCountries(programs, language);

  const visiblePrograms = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    const filtered = programs.filter((program) => {
      const title = isArabic ? program.titleAr : program.titleEn;

      const summary = isArabic ? program.summaryAr : program.summaryEn;

      const country = isArabic ? program.countryNameAr : program.countryNameEn;

      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search) ||
        summary.toLowerCase().includes(search) ||
        country.toLowerCase().includes(search);

      const matchesCountry =
        countryFilter === "all" || program.countryId === countryFilter;

      const matchesDuration = matchesProgramDuration(
        program.durationDays,
        durationFilter,
      );

      const matchesFlight =
        flightFilter === "all" || program.flightInclusion === flightFilter;

      return (
        (!cityFilter || cityProgramIds.has(program.id)) &&
        matchesSearch &&
        matchesCountry &&
        matchesDuration &&
        matchesFlight
      );
    });

    const mixedCurrencies = new Set(filtered.map(program => program.currencyCode)).size > 1;
    return [...filtered].sort((a, b) => {
      if (mixedCurrencies && sortBy.startsWith("price-")) return 0;
      if (sortBy === "price-low") {
        return a.basePrice - b.basePrice;
      }

      if (sortBy === "price-high") {
        return b.basePrice - a.basePrice;
      }

      if (sortBy === "duration-short") {
        return a.durationDays - b.durationDays;
      }

      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      return 0;
    });
  }, [
    programs,
    cityFilter,
    cityProgramIds,
    searchValue,
    countryFilter,
    durationFilter,
    flightFilter,
    sortBy,
    isArabic,
  ]);

  const clearCityFilter = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("city");
    router.replace(languageHref(`/programs${next.size ? `?${next}` : ""}`, language), { scroll: false });
  };
  const clearFilters = () => {
    setSearchValue("");
    router.replace(languageHref("/programs", language), { scroll: false });
    setFlightFilter("all");
    setSortBy("featured");
  };
  const loading = isLoading || Boolean(cityFilter && journey.isPending);
  const failed = isError || Boolean(cityFilter && journey.isError);
  const retry = () => { if (isError) void refetch(); if (cityFilter && journey.isError) void journey.refetch(); };
  const mixedCurrencies = new Set(visiblePrograms.map(program => program.currencyCode)).size > 1;
  const activeFilters = [
    ...(searchValue ? [{ id: "search", label: searchValue, remove: () => setSearchValue("") }] : []),
    ...(countryFilter !== "all" ? [{ id: "country", label: countries.find(country => country.id === countryFilter)?.name ?? (isArabic ? "الدولة المحددة" : "Selected country"), remove: () => updateDiscoveryFilter("country", "all") }] : []),
    ...(durationFilter !== "all" ? [{ id: "duration", label: durationFilter === "short" ? (isArabic ? "حتى 5 أيام" : "Up to 5 days") : durationFilter === "medium" ? (isArabic ? "6–9 أيام" : "6–9 days") : (isArabic ? "10 أيام فأكثر" : "10+ days"), remove: () => updateDiscoveryFilter("duration", "all") }] : []),
    ...(flightFilter !== "all" ? [{ id: "flight", label: flightFilter === "included" ? (isArabic ? "الطيران مشمول" : "Flights included") : flightFilter === "excluded" ? (isArabic ? "الطيران غير مشمول" : "Flights excluded") : (isArabic ? "سعر الطيران متغير" : "Variable flight price"), remove: () => setFlightFilter("all") }] : []),
    ...(cityFilter ? [{ id: "city", label: isArabic ? "مدينة الانطلاق" : "Departure city", remove: clearCityFilter }] : []),
  ];
  return (
    <main className={"nr-all-programs " + cardStyles.scope} dir={isArabic ? "rtl" : "ltr"}>
      {cityFilter ? (
        <p role="status">
          {journey.isPending
            ? isArabic
              ? "جارٍ تحميل رحلات المدينة…"
              : "Loading city journeys…"
            : journey.isError
              ? isArabic
                ? "تعذر تحميل رحلات المدينة."
                : "Could not load city journeys."
              : (isArabic ? "مدينة الانطلاق: " : "Departure city: ") +
                (journey.data?.cities.find((c) => c.id === cityFilter)?.[
                  isArabic ? "name_ar" : "name_en"
                ] ?? "—")}{" "}
          <button className="program-action" type="button" onClick={clearCityFilter}>
            {isArabic ? "إلغاء فلتر المدينة" : "Clear city filter"}
          </button>
        </p>
      ) : null}
      <section className="nr-all-programs-hero">
        <div className="nr-all-programs-container">
          <Link href={languageHref("/", language)} className="nr-all-programs-back">
            <ArrowLeft size={17} />
            {isArabic ? "العودة للرئيسية" : "Back Home"}
          </Link>

          <span className="nr-all-programs-kicker">
            <Sparkles size={15} />
            {isArabic ? "برامج نور آب" : "NourApp Programs"}
          </span>

          <h1>
            {isArabic
              ? "اعثر على برنامج العمرة المناسب لك"
              : "Find the Umrah program that fits you"}
          </h1>

          <p>
            {isArabic
              ? "قارن البرامج حسب الدولة والمدة والطيران والسعر، ثم افتح التفاصيل الكاملة واختر رحلتك بثقة."
              : "Compare programs by country, duration, flights, and price, then review the full details and choose with confidence."}
          </p>
          <WebsiteBookingNotice language={language} />
        </div>
      </section>

      <section className="nr-all-programs-content">
        <div className="nr-all-programs-container">
          <div className="nr-all-programs-marketbar">
            <div className="nr-all-programs-search-wrap">
              <label className="nr-all-programs-search">
                <span className="programs-sr-only">{isArabic ? "ابحث عن برنامج أو دولة" : "Search for a program or country"}</span>
                <Search size={18} />

                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={
                    isArabic
                      ? "ابحث عن برنامج أو دولة..."
                      : "Search program or country..."
                  }
                />
              </label>

              <button
                type="button"
                className="nr-all-programs-filter-chip is-mobile-filter"
                ref={filterToggleRef}
                aria-expanded={filtersOpen} aria-controls="program-filter-panel"
                onClick={() => setFiltersOpen(open => !open)}
              >
                <SlidersHorizontal size={16} />
                {isArabic ? "الفلاتر" : "Filters"} ({activeFilters.length})
              </button>
            </div>

            <div id="program-filter-panel" className="nr-all-programs-filters" hidden={!filtersOpen}
              onKeyDown={event => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setFiltersOpen(false);
                  filterToggleRef.current?.focus();
                }
              }}>
              <label className="nr-all-programs-select">
                <span>
                  <MapPin size={14} />
                  {isArabic ? "الدولة" : "Country"}
                </span>

                <select
                  value={countryFilter}
                  onChange={(event) =>
                    updateDiscoveryFilter("country", event.target.value)
                  }
                >
                  <option value="all">
                    {isArabic ? "جميع الدول" : "All Countries"}
                  </option>

                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select">
                <span>
                  <CalendarDays size={14} />
                  {isArabic ? "المدة" : "Duration"}
                </span>

                <select
                  value={durationFilter}
                  onChange={(event) =>
                    updateDiscoveryFilter("duration", event.target.value)
                  }
                >
                  <option value="all">
                    {isArabic ? "كل المدد" : "Any duration"}
                  </option>
                  <option value="short">
                    {isArabic ? "حتى 5 أيام" : "Up to 5 days"}
                  </option>
                  <option value="medium">
                    {isArabic ? "6 - 9 أيام" : "6 - 9 days"}
                  </option>
                  <option value="long">
                    {isArabic ? "10 أيام فأكثر" : "10+ days"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select">
                <span>
                  <Plane size={14} />
                  {isArabic ? "الطيران" : "Flights"}
                </span>

                <select
                  value={flightFilter}
                  onChange={(event) => setFlightFilter(event.target.value)}
                >
                  <option value="all">
                    {isArabic ? "كل الخيارات" : "Any option"}
                  </option>
                  <option value="included">
                    {isArabic ? "مشمول" : "Included"}
                  </option>
                  <option value="excluded">
                    {isArabic ? "غير مشمول" : "Excluded"}
                  </option>
                  <option value="dynamic">
                    {isArabic ? "سعر متغير" : "Variable price"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select is-sort">
                <span>
                  <SlidersHorizontal size={14} />
                  {isArabic ? "الترتيب" : "Sort"}
                </span>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="featured">
                    {isArabic ? "المميز أولًا" : "Featured first"}
                  </option>
                  <option value="price-low" disabled={mixedCurrencies}>
                    {isArabic ? "السعر: الأقل أولًا" : "Price: low to high"}
                  </option>
                  <option value="price-high" disabled={mixedCurrencies}>
                    {isArabic ? "السعر: الأعلى أولًا" : "Price: high to low"}
                  </option>
                  <option value="duration-short">
                    {isArabic ? "الأقصر مدة" : "Shortest duration"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>
            </div>
          </div>

          {activeFilters.length > 0 && <div className="program-active-filters" aria-label={isArabic ? "الفلاتر النشطة" : "Active filters"}>
            {activeFilters.map(filter => <button type="button" key={filter.id} onClick={filter.remove} aria-label={`${isArabic ? "إزالة" : "Remove"}: ${filter.label}`}>{filter.label} <span aria-hidden="true">×</span></button>)}
          </div>}
          {mixedCurrencies && <p className="program-price-note">{isArabic ? "الأسعار بعملات مختلفة؛ الترتيب بالسعر متاح عند عرض عملة واحدة." : "Prices use different currencies; price sorting is available when one currency is displayed."}</p>}
          <div className="nr-all-programs-result-row" role="status" aria-live="polite">
            <div>
              <strong>
                {loading ? (isArabic ? "جارٍ تحميل البرامج…" : "Loading programs…") : failed ? (isArabic ? "النتائج غير متاحة مؤقتًا" : "Results temporarily unavailable") : isArabic
                  ? `${visiblePrograms.length} برنامج`
                  : `${visiblePrograms.length} ${visiblePrograms.length === 1 ? "program" : "programs"}`}
              </strong>

              <span>
                {loading || failed ? "" : isArabic
                  ? "نتائج متاحة حسب اختياراتك"
                  : "results available for your filters"}
              </span>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="nr-all-programs-clear"
            >
              {isArabic ? "إعادة الضبط" : "Reset"}
            </button>
          </div>

          {!loading && !failed && visiblePrograms.length > 0 && <ProgramPriceNote language={language} />}
          {loading ? (
            <div className="nr-all-programs-state" role="status" aria-busy="true">
              <div className="nr-all-programs-loader" />
              <strong>
                {isArabic ? "جارٍ تحميل البرامج..." : "Loading programs..."}
              </strong>
            </div>
          ) : failed ? (
            <div className="nr-all-programs-state is-error" role="alert">
              <strong>
                {isArabic ? "تعذر تحميل البرامج" : "Unable to load programs"}
              </strong>

              <p>{isArabic ? "تحقق من اتصالك ثم حاول مجددًا. لا تعني هذه الرسالة عدم وجود برامج." : "Check your connection and try again. This does not mean there are no programs."}</p>
              <button className="program-action" type="button" onClick={retry}>{isArabic ? "إعادة المحاولة" : "Try again"}</button>
            </div>
          ) : visiblePrograms.length === 0 ? (
            <div className="nr-all-programs-state" role="status">
              <strong>
                {programs.length === 0
                  ? isArabic
                    ? "لا توجد برامج متاحة حاليًا"
                    : "No programs are available right now"
                  : isArabic
                    ? "لا توجد برامج مطابقة"
                    : "No matching programs"}
              </strong>

              <p>
                {programs.length === 0
                  ? isArabic
                    ? "يسعد فريق نور آب بالإجابة عن استفساراتك حول البرامج والخدمات."
                    : "The NourApp team is here to answer your questions about programs and services."
                  : isArabic
                    ? "جرّب تغيير كلمات البحث أو اختيار دولة أخرى."
                    : "Try another search or country."}
              </p>
              {programs.length === 0 ? (
                <Link href={languageHref("/#contact", language)} className="nr-all-programs-details">
                  {isArabic ? "تواصل معنا" : "Contact us"}
                </Link>
              ) : <button className="program-action" type="button" onClick={clearFilters}>
                {isArabic ? "مسح الفلاتر وعرض جميع البرامج" : "Clear filters and show all programs"}
              </button>}
            </div>
          ) : (
            <div className="nr-all-programs-grid">
              {visiblePrograms.map((program) => {
                const title = isArabic ? program.titleAr : program.titleEn;

                const summary = isArabic
                  ? program.summaryAr
                  : program.summaryEn;

                const country = isArabic
                  ? program.countryNameAr
                  : program.countryNameEn;

                const flightLabel =
                  program.flightInclusion === "included"
                    ? isArabic
                      ? "الطيران مشمول"
                      : "Flights included"
                    : program.flightInclusion === "excluded"
                      ? isArabic
                        ? "الطيران غير مشمول"
                        : "Flights excluded"
                      : isArabic
                        ? "سعر الطيران متغير"
                        : "Variable flight price";

                return (
                  <article key={program.id} className={"nr-all-programs-card " + cardStyles.card}>
                    <Link
                      href={languageHref(`/programs/${encodeURIComponent(program.slug)}`, language)}
                      className="nr-all-programs-image"
                    >
                      {program.coverUrl ? (
                        <Image
                          src={program.coverUrl}
                          alt={title}
                          fill
                          sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw"
                          unoptimized
                        />
                      ) : (
                        <div className="nr-all-programs-placeholder">
                          <Sparkles />
                        </div>
                      )}

                      <span
                        className="nr-all-programs-image-overlay"
                        aria-hidden="true"
                      />

                      <div className="nr-all-programs-image-meta">
                        <span>
                          <MapPin size={13} />
                          {country ||
                            (isArabic ? "برنامج عمرة" : "Umrah program")}
                        </span>

                        <span>
                          <CalendarDays size={13} />
                          {program.durationDays} {isArabic ? "أيام" : "days"}
                        </span>
                      </div>

                      {program.isFeatured ? (
                        <span className="nr-all-programs-featured">
                          <Sparkles size={13} />
                          {isArabic ? "مختار" : "Selected"}
                        </span>
                      ) : null}
                    </Link>

                    <div className="nr-all-programs-card-body">
                      {country ? (
                        <span className="nr-all-programs-country">
                          <MapPin size={14} />
                          {country}
                        </span>
                      ) : null}

                      <h2>
                        <Link href={languageHref(`/programs/${encodeURIComponent(program.slug)}`, language)}>{title}</Link>
                      </h2>

                      {summary ? <p>{summary}</p> : null}

                      <div className="nr-all-programs-meta">
                        <span>
                          <CalendarDays />
                          {program.durationDays} {isArabic ? "أيام" : "days"}
                        </span>

                        <span>
                          <Moon />
                          {program.durationNights}{" "}
                          {isArabic ? "ليالٍ" : "nights"}
                        </span>

                        <span>
                          <Plane />
                          {flightLabel}
                        </span>
                      </div>

                      <div className="nr-all-programs-card-footer">
                        <div>
                          <small>
                            {isArabic ? "يبدأ من" : "Starting from"}
                          </small>

                          <strong>
                            {formatPrice(program.basePrice, language)}{" "}
                            <span>{program.currencyCode}</span>
                          </strong>
                        </div>

                        <Link
                          href={languageHref(`/programs/${encodeURIComponent(program.slug)}`, language)}
                          className="nr-all-programs-details"
                        >
                          {isArabic ? "تفاصيل البرنامج" : "Program details"}
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <style jsx global>{pageStyles}</style>
    </main>
  );
}
