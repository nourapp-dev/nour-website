"use client";

import {countLabel} from "../../src/core/i18n/counts";
import pageStyles from "./ProgramCatalog.styles";

import cardStyles from "../components/home/MediaCards.module.css";

import ProgramCard from "../../src/features/programs/components/ProgramCard";
import { travelMode, travelLabel } from "../../src/features/programs/display";
import { languageHref } from "../../src/core/i18n/public-language";
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

  const params = useSearchParams();
  const router = useRouter();
  const searchValue = params.get("q") || "";
  const flightFilter = params.get("travel") || "all";
  const sortBy = params.get("sort") || "featured";
  const setSearchValue = (value: string) => updateFilter("q", value);
  const setFlightFilter = (value: string) => updateFilter("travel", value);
  const setSortBy = (value: string) => updateFilter("sort", value);
  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || (key === "sort" && value === "featured"))
      next.delete(key);
    else next.set(key, value);
    next.delete("page");
    if (key === "country") next.delete("city");
    router.replace(
      languageHref("/programs" + (next.size ? "?" + next : ""), language),
      { scroll: false },
    );
  };
  const countryFilter = params.get("country") || "all";
  const cityFilter = params.get("city");
  const client = useMemo(() => createClient("pilgrim"), []);
  const journey = useQuery({
    queryKey: ["public", "journey-map"],
    queryFn: async () => {
      const result = await getJourneyCatalog(client);
      if (
        result.errors.some((e) =>
          ["cities", "programs", "departures"].includes(e),
        )
      )
        throw new Error("City filter source unavailable");
      return result;
    },
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
  const updateDiscoveryFilter = (key: "country" | "duration", value: string) =>
    updateFilter(key, value);
  const {
    data: programs = [],
    isLoading,
    isError,
    refetch,
  } = usePublicProgramCatalog();
  const countries = getProgramCountries(programs, language);

  const currencyFilter = params.get("currency") || "";
  const allCurrencies = [...new Set(programs.map((p) => p.currencyCode))];
  const priceCurrency =
    currencyFilter || (allCurrencies.length === 1 ? allCurrencies[0] : "");
  const minPrice = params.get("min"),
    maxPrice = params.get("max");
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
        flightFilter === "all" || travelMode(program.display) === flightFilter;

      return (
        (!cityFilter ||
          program.display?.origins.some((c) => c.id === cityFilter) ||
          cityProgramIds.has(program.id)) &&
        matchesSearch &&
        matchesCountry &&
        matchesDuration &&
        matchesFlight &&
        (!currencyFilter || program.currencyCode === currencyFilter) &&
        (!priceCurrency ||
          minPrice === null ||
          !Number.isFinite(Number(minPrice)) ||
          program.basePrice >= Number(minPrice)) &&
        (!priceCurrency ||
          maxPrice === null ||
          !Number.isFinite(Number(maxPrice)) ||
          program.basePrice <= Number(maxPrice))
      );
    });

    const mixedCurrencies =
      new Set(filtered.map((program) => program.currencyCode)).size > 1;
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
    currencyFilter,
    priceCurrency,
    minPrice,
    maxPrice,
  ]);

  const totalPages = Math.max(1, Math.ceil(visiblePrograms.length / 9));
  const page = Math.min(
    totalPages,
    Math.max(1, Math.trunc(Number(params.get("page")) || 1)),
  );
  const pagedPrograms = visiblePrograms.slice((page - 1) * 9, page * 9);
  const cityOptions = Array.from(
    new Map(
      programs
        .flatMap((p) => p.display?.origins ?? [])
        .filter((c) => countryFilter === "all" || c.countryId === countryFilter)
        .map((c) => [c.id, c]),
    ).values(),
  );
  const clearCityFilter = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("city");
    router.replace(
      languageHref(`/programs${next.size ? `?${next}` : ""}`, language),
      { scroll: false },
    );
  };
  const clearFilters = () =>
    router.replace(languageHref("/programs", language), { scroll: false });
  const loading = isLoading || Boolean(cityFilter && journey.isPending);
  const failed = isError || Boolean(cityFilter && journey.isError);
  const retry = () => {
    if (isError) void refetch();
    if (cityFilter && journey.isError) void journey.refetch();
  };
  const mixedCurrencies =
    new Set(visiblePrograms.map((program) => program.currencyCode)).size > 1;
  const activeFilters = [
    ...(["currency", "min", "max"] as const).flatMap((key) =>
      params.get(key)
        ? [
            {
              id: key,
              label: `${{ currency: isArabic ? "العملة" : "Currency", min: isArabic ? "من سعر" : "Minimum", max: isArabic ? "إلى سعر" : "Maximum" }[key]}: ${params.get(key)}`,
              remove: () => updateFilter(key, ""),
            },
          ]
        : [],
    ),
    ...(searchValue
      ? [{ id: "search", label: searchValue, remove: () => setSearchValue("") }]
      : []),
    ...(countryFilter !== "all"
      ? [
          {
            id: "country",
            label:
              countries.find((country) => country.id === countryFilter)?.name ??
              (isArabic ? "الدولة المحددة" : "Selected country"),
            remove: () => updateDiscoveryFilter("country", "all"),
          },
        ]
      : []),
    ...(durationFilter !== "all"
      ? [
          {
            id: "duration",
            label:
              durationFilter === "short"
                ? isArabic
                  ? "حتى 5 أيام"
                  : "Up to 5 days"
                : durationFilter === "medium"
                  ? isArabic
                    ? "6–9 أيام"
                    : "6–9 days"
                  : isArabic
                    ? "10 أيام فأكثر"
                    : "10+ days",
            remove: () => updateDiscoveryFilter("duration", "all"),
          },
        ]
      : []),
    ...(flightFilter !== "all"
      ? [
          {
            id: "flight",
            label: travelLabel(flightFilter, isArabic),
            remove: () => setFlightFilter("all"),
          },
        ]
      : []),
    ...(cityFilter
      ? [
          {
            id: "city",
            label: isArabic ? "مدينة الانطلاق" : "Departure city",
            remove: clearCityFilter,
          },
        ]
      : []),
  ];
  return (
    <main
      className={"nr-all-programs " + cardStyles.scope}
      dir={isArabic ? "rtl" : "ltr"}
    >
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
          <button
            className="program-action"
            type="button"
            onClick={clearCityFilter}
          >
            {isArabic ? "إلغاء فلتر المدينة" : "Clear city filter"}
          </button>
        </p>
      ) : null}
      <section className="nr-all-programs-hero">
        <div className="nr-all-programs-container">
          <Link
            href={languageHref("/", language)}
            className="nr-all-programs-back"
          >
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
                <span className="programs-sr-only">
                  {isArabic
                    ? "ابحث عن برنامج أو دولة"
                    : "Search for a program or country"}
                </span>
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
                aria-expanded={filtersOpen}
                aria-controls="program-filter-panel"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal size={16} />
                {isArabic ? "الفلاتر" : "Filters"} ({activeFilters.length})
              </button>
            </div>

            <div
              id="program-filter-panel"
              className="nr-all-programs-filters"
              hidden={!filtersOpen}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setFiltersOpen(false);
                  filterToggleRef.current?.focus();
                }
              }}
            >
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
                  {isArabic ? "طريقة الوصول" : "Arrival mode"}
                </span>

                <select
                  value={flightFilter}
                  onChange={(event) => setFlightFilter(event.target.value)}
                >
                  <option value="all">
                    {isArabic ? "كل الخيارات" : "Any option"}
                  </option>
                  <option value="bus">{isArabic ? "حافلة" : "Bus"}</option>
                  <option value="air">{isArabic ? "طيران" : "Air"}</option>
                  <option value="own">
                    {isArabic ? "وصول ذاتي" : "Own arrival"}
                  </option>
                  <option value="mixed">
                    {isArabic ? "متعدد الوسائل" : "Mixed travel"}
                  </option>
                </select>

                <ChevronDown size={14} />
              </label>

              <label className="nr-all-programs-select">
                <span>{isArabic ? "مدينة الانطلاق" : "Departure city"}</span>
                <select
                  value={cityFilter || "all"}
                  onChange={(e) => updateFilter("city", e.target.value)}
                >
                  <option value="all">
                    {isArabic ? "كل المدن" : "All cities"}
                  </option>
                  {cityOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isArabic ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="nr-all-programs-select">
                <span>{isArabic ? "عملة السعر" : "Price currency"}</span>
                <select
                  value={currencyFilter}
                  onChange={(e) => updateFilter("currency", e.target.value)}
                >
                  <option value="">
                    {isArabic ? "كل العملات" : "All currencies"}
                  </option>
                  {allCurrencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="nr-all-programs-select">
                <span>{isArabic ? "الحد الأدنى للسعر" : "Minimum price"}</span>
                <input
                  type="number"
                  min="0"
                  disabled={!priceCurrency}
                  value={minPrice ?? ""}
                  onChange={(e) => updateFilter("min", e.target.value)}
                />
              </label>
              <label className="nr-all-programs-select">
                <span>{isArabic ? "الحد الأعلى للسعر" : "Maximum price"}</span>
                <input
                  type="number"
                  min="0"
                  disabled={!priceCurrency}
                  value={maxPrice ?? ""}
                  onChange={(e) => updateFilter("max", e.target.value)}
                />
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

          {activeFilters.length > 0 && (
            <div
              className="program-active-filters"
              aria-label={isArabic ? "الفلاتر النشطة" : "Active filters"}
            >
              {activeFilters.map((filter) => (
                <button
                  type="button"
                  key={filter.id}
                  onClick={filter.remove}
                  aria-label={`${isArabic ? "إزالة" : "Remove"}: ${filter.label}`}
                >
                  {filter.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
          {mixedCurrencies && (
            <p className="program-price-note">
              {isArabic
                ? "الأسعار بعملات مختلفة؛ الترتيب بالسعر متاح عند عرض عملة واحدة."
                : "Prices use different currencies; price sorting is available when one currency is displayed."}
            </p>
          )}
          <div
            className="nr-all-programs-result-row"
            role="status"
            aria-live="polite"
          >
            <div>
              <strong>
                {loading
                  ? isArabic
                    ? "جارٍ تحميل البرامج…"
                    : "Loading programs…"
                  : failed
                    ? isArabic
                      ? "النتائج غير متاحة مؤقتًا"
                      : "Results temporarily unavailable"
                    : countLabel(visiblePrograms.length,"program",language)}
              </strong>

              <span>
                {loading || failed
                  ? ""
                  : isArabic
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

          {loading ? (
            <div
              className="nr-all-programs-state"
              role="status"
              aria-busy="true"
            >
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

              <p>
                {isArabic
                  ? "تحقق من اتصالك ثم حاول مجددًا. لا تعني هذه الرسالة عدم وجود برامج."
                  : "Check your connection and try again. This does not mean there are no programs."}
              </p>
              <button className="program-action" type="button" onClick={retry}>
                {isArabic ? "إعادة المحاولة" : "Try again"}
              </button>
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
                <Link
                  href={languageHref("/#contact", language)}
                  className="nr-all-programs-details"
                >
                  {isArabic ? "تواصل معنا" : "Contact us"}
                </Link>
              ) : (
                <button
                  className="program-action"
                  type="button"
                  onClick={clearFilters}
                >
                  {isArabic
                    ? "مسح الفلاتر وعرض جميع البرامج"
                    : "Clear filters and show all programs"}
                </button>
              )}
            </div>
          ) : (
            <div
              className="nr-all-programs-grid"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,300px),1fr))",
              }}
            >
              {pagedPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  language={language}
                  returnTo={"/programs?" + params.toString()}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {!loading && !failed && totalPages > 1 && (
        <nav aria-label={isArabic ? "صفحات النتائج" : "Results pages"}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              aria-current={page === i + 1 ? "page" : undefined}
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.set("page", String(i + 1));
                router.replace(languageHref("/programs?" + next, language), {
                  scroll: false,
                });
              }}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
      <style jsx global>
        {pageStyles}
      </style>
    </main>
  );
}
