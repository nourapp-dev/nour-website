"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {countLabel} from "../../../../src/core/i18n/counts";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import type { Language } from "../../../data/home";
import { createClient } from "../../../../src/lib/supabase/client";
import {
  getJourneyCatalog,
  getJourneyMeetingPoints,
} from "../../../../src/features/journeys/journey.service";
import { upcomingDepartures } from "../../../../src/features/programs/display";
import ProgramCard from "../../../../src/features/programs/components/ProgramCard";
import { languageHref } from "../../../../src/core/i18n/public-language";
import { usePresentation } from "../../../../src/features/website/usePresentation";
import { trackMapEvent } from "../../../../src/lib/analytics/map-events";
import { validCoordinates } from "../../../../src/features/journeys/coordinates";
import MapBoundary from "./MapBoundary";
import styles from "./NourWorldMap.module.css";
const GeographicMap = dynamic(
  () => import("../../../../src/components/maps/GeographicMap"),
  { ssr: false, loading: () => <p>تحميل الخريطة / Loading map…</p> },
);
const mobileSnapshot = () =>
  window.matchMedia?.("(max-width:760px)").matches ?? false;
function subscribe(fn: () => void) {
  const m = window.matchMedia?.("(max-width:760px)");
  m?.addEventListener("change", fn);
  return () => m?.removeEventListener("change", fn);
}
const makkah = {
  id: "makkah",
  name: "Makkah",
  latitude: 21.4225,
  longitude: 39.8262,
  destination: true,
};
export default function NourWorldMap({ language }: { language: Language }) {
  const ar = language === "ar",
    tr = (a: string, e: string) => (ar ? a : e),
    content = usePresentation().sections.map;
  const client = useMemo(() => createClient("pilgrim"), []);
  const [mode, setMode] = useState<"saudi" | "world">("saudi"),
    [countryId, setCountryId] = useState<string | null>(null),
    [cityId, setCityId] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState(false),
    [mapReady, setMapReady] = useState(false),
    [departureId, setDepartureId] = useState("");
  const mobile = useSyncExternalStore(subscribe, mobileSnapshot, () => false),
    showMap = !mobile || expanded;
  const mapContainer = useRef<HTMLDivElement>(null),
    toggle = useRef<HTMLButtonElement>(null),
    close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mobile && expanded) close.current?.focus();
  }, [mobile, expanded]);
  useEffect(() => {
    if (!showMap || !mapContainer.current) return;
    if (!window.IntersectionObserver) {
      const timer = setTimeout(() => setMapReady(true), 0);
      return () => clearTimeout(timer);
    }
    const o = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMapReady(true);
          o.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    o.observe(mapContainer.current);
    return () => o.disconnect();
  }, [showMap]);
  const query = useQuery({
    queryKey: ["public", "journey-map"],
    queryFn: () => getJourneyCatalog(client),
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });
  const data = query.data;
  const countries = (data?.countries ?? []).filter(
    (c) =>
      typeof c.iso2 === "string" &&
      /^[A-Z]{2}$/i.test(c.iso2.trim()) &&
      c.showOnMap !== false,
  );
  const incompleteCountries = (data?.countries ?? []).some(
    (c) => typeof c.iso2 !== "string" || !/^([A-Z]{2})$/i.test(c.iso2.trim()),
  );
  const saudi = countries.find((c) => c.iso2.trim().toUpperCase() === "SA");
  const country = countries.find(
    (c) => c.id === (mode === "saudi" ? saudi?.id : countryId),
  );
  const cityMode = mode === "saudi" || Boolean(country);
  const cities = (data?.cities ?? []).filter(
    (c) => c.country_id === country?.id && c.show_on_map !== false,
  );
  const selected = cities.find((c) => c.id === cityId);
  const resources = data?.errors ?? [];
  const factsFailed = Boolean(data?.programs.some((p) => p.displayError));
  const programsFailed = resources.includes("programs") || factsFailed;
  const datesFailed = resources.includes("departures");
  const programsFor = (id: string) =>
    (data?.programs ?? []).filter(
      (p) =>
        p.display?.origins.some((c) => c.id === id) ||
        data?.departures.some(
          (d) => d.origin_city_id === id && d.program_id === p.id,
        ),
    );
  const departuresFor = (id: string) =>
    (data?.departures ?? []).filter((d) => d.origin_city_id === id);
  const programs = selected ? programsFor(selected.id) : [];
  const departures = selected ? departuresFor(selected.id) : [];
  const activeDeparture = departures.find((d) => d.id === departureId);
  const meeting = useQuery({
    queryKey: ["public", "journey-meeting", cityId, departureId],
    enabled: Boolean(selected && activeDeparture),
    queryFn: () =>
      getJourneyMeetingPoints(
        client,
        activeDeparture!.program_id,
        selected!.id,
        activeDeparture!.id,
        activeDeparture!.meeting_point_id,
      ),
  });
  const locations = cityMode
    ? cities.map((c) => ({
        id: c.id,
        name: ar ? c.name_ar : c.name_en,
        latitude: c.latitude,
        longitude: c.longitude,
        count: programsFor(c.id).length,
        dates: departuresFor(c.id).length,
      }))
    : countries
        .filter((c) => c.iso2.trim().toUpperCase() !== "SA")
        .map((c) => ({
          id: c.id,
          name: ar ? c.nameAr : c.nameEn,
          latitude: c.latitude,
          longitude: c.longitude,
          count: (data?.programs ?? []).filter((p) => p.countryId === c.id)
            .length,
          dates: (data?.departures ?? []).filter((d) =>
            data?.programs.some(
              (p) => p.id === d.program_id && p.countryId === c.id,
            ),
          ).length,
        }));
  const visible = locations.filter((l) =>
    l.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const points = [
    ...locations.map((l) => ({
      ...l,
      available: !programsFailed && l.count > 0,
    })),
    { ...makkah, name: tr("مكة المكرمة", "Makkah") },
    ...(activeDeparture
      ? (meeting.data ?? [])
          .filter((p) => validCoordinates(p.latitude, p.longitude))
          .map((p) => ({
            id: "meeting-" + p.id,
            name: ar ? p.name_ar : p.name_en,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          }))
      : []),
  ];
  function select(id: string, source: "map" | "chip" = "map") {
    if (!locations.some((l) => l.id === id)) return;
    setSearch("");
    setDepartureId("");
    if (cityMode) setCityId(id);
    else {
      setCountryId(id);
      setCityId(null);
    }
    trackMapEvent(cityMode ? "map_city_selected" : "map_country_selected", {
      countryId: cityMode ? country?.id : id,
      cityId: cityMode ? id : undefined,
      source,
    });
  }
  function back() {
    setCityId(null);
    setDepartureId("");
    setSearch("");
  }
  const locationFailed =
    resources.includes("countries") ||
    (cityMode && resources.includes("cities"));
  const earliest = departures.find(() => true);
  const fallback = programs
    .flatMap((p) =>
      upcomingDepartures(p.display).filter((d) => d.cityId === selected?.id),
    )
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];
  const firstDate = earliest?.start_at ?? fallback?.startAt;
  const firstZone = earliest?.departure_timezone ?? fallback?.timezone;
  function closeMap() {
    setExpanded(false);
    toggle.current?.focus();
  }
  return (
    <section
      className={styles.panel}
      dir={ar ? "rtl" : "ltr"}
      aria-label={tr("رحلتك إلى مكة", "Your journey to Makkah")}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {tr("إلى مكة… من مدينتك", "From your city to Makkah")}
          </span>
          <h2>{content.title[language]}</h2>
          <p>{content.description[language]}</p>
        </div>
        <div className={styles.tabs}>
          {(["saudi", "world"] as const).map((m) => (
            <button
              type="button"
              key={m}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setCountryId(null);
                back();
              }}
            >
              {m === "saudi"
                ? tr("داخل السعودية", "Within Saudi Arabia")
                : tr("من خارج المملكة", "International")}
            </button>
          ))}
        </div>
      </header>
      <p className={styles.notice}>
        {tr(
          "للاستعراض فقط — حجز الموقع متوقف، والتطبيق قريبًا.",
          "Browse only — website booking is paused; the app is coming soon.",
        )}
      </p>
      {resources.map((r) => (
        <p key={r} role="alert">
          {tr("تعذر تحميل مصدر البيانات: ", "Unable to load data source: ")}
          {
            (
              {
                countries: tr("الدول", "countries"),
                cities: tr("المدن", "cities"),
                programs: tr("البرامج", "programs"),
                departures: tr("المواعيد", "departures"),
              } as Record<string, string>
            )[r]
          }{" "}
          <button type="button" onClick={() => void query.refetch()}>
            {tr("إعادة المحاولة", "Retry")}
          </button>
        </p>
      ))}
      {factsFailed && (
        <p role="alert">
          {tr(
            "تعذر تحميل علاقات بعض البرامج. الأعداد غير متاحة مؤقتًا.",
            "Some program relationships could not be loaded. Counts are temporarily unavailable.",
          )}{" "}
          <button onClick={() => void query.refetch()}>
            {tr("إعادة المحاولة", "Retry")}
          </button>
        </p>
      )}
      {incompleteCountries && (
        <p role="status">
          {tr(
            "بعض الدول غير معروضة لأن رمز البلد غير مكتمل.",
            "Some countries are not shown because their country code is incomplete.",
          )}
        </p>
      )}
      <div className={styles.layout}>
        <div
          id="journey-map"
          className={styles.map}
          ref={mapContainer}
          hidden={!showMap}
        >
          {mobile && expanded && (
            <button ref={close} type="button" onClick={closeMap}>
              {tr(
                "إغلاق الخريطة والعودة للنتائج",
                "Close map and return to results",
              )}
            </button>
          )}
          {showMap && mapReady ? (
            <MapBoundary language={language}>
              <GeographicMap
                points={points}
                selectedId={selected?.id}
                mode={mode}
                onSelect={(id) => select(id)}
                language={language}
                cluster
                route={Boolean(selected)}
                label={tr("خريطة الانطلاق إلى مكة", "Origins and Makkah map")}
              />
            </MapBoundary>
          ) : (
            <p role="status">
              {tr(
                "تُحمّل الخريطة عند الاقتراب منها.",
                "The map loads as you approach this section.",
              )}
            </p>
          )}
        </div>
        <aside id="journey-origin-details" className={styles.details}>
          {query.isPending ? (
            <p role="status">
              {tr("جارٍ تحميل المواقع…", "Loading locations…")}
            </p>
          ) : query.isError || locationFailed ? (
            <div role="alert">
              <p>
                {tr("تعذر تحميل المواقع.", "Locations could not be loaded.")}
              </p>
              <button onClick={() => void query.refetch()}>
                {tr("إعادة المحاولة", "Retry")}
              </button>
            </div>
          ) : (
            <>
              {mode === "world" && country && (
                <nav aria-label={tr("مسار الانطلاق", "Origin trail")}>
                  <button
                    onClick={() => {
                      setCountryId(null);
                      back();
                    }}
                  >
                    {tr("كل الدول", "All countries")}
                  </button>{" "}
                  · <span>{ar ? country.nameAr : country.nameEn}</span>
                </nav>
              )}
              {country?.marketStatus === "coming_soon" ||
              country?.marketStatus === "paused" ? (
                <p role="status">
                  {country.marketStatus === "coming_soon"
                    ? tr("قريبًا", "Coming soon")
                    : tr("متوقف مؤقتًا", "Paused")}{" "}
                  {ar ? country.statusLabelAr : country.statusLabelEn}
                </p>
              ) : null}
              {selected ? (
                <>
                  <button onClick={back}>
                    {tr("العودة إلى جميع المدن", "Back to all cities")}
                  </button>
                  <h3>{ar ? selected.name_ar : selected.name_en}</h3>
                  <p>
                    {programsFailed
                      ? tr(
                          "عدد البرامج غير متاح مؤقتًا",
                          "Program counts unavailable",
                        )
                      : countLabel(programs.length,"program",language,"published")}
                    {!datesFailed &&
                      !programsFailed &&
                      ` · ${countLabel(departures.length,"departure",language,"upcoming")}`}
                  </p>
                  {!validCoordinates(selected.latitude, selected.longitude) && (
                    <p>
                      {tr(
                        "موقع المدينة غير محدد على الخريطة؛ يمكنك استعراض برامجها.",
                        "City coordinates are missing; its programs can still be browsed.",
                      )}
                    </p>
                  )}
                  {!datesFailed && firstDate && (
                    <p>
                      {tr("أقرب موعد: ", "Next departure: ")}
                      {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
                        dateStyle: "medium",
                        timeZone: firstZone || "UTC",
                      }).format(new Date(firstDate))}
                    </p>
                  )}
                  {programsFailed ? (
                    <p role="alert">
                      {tr(
                        "تعذر تحميل البرامج.",
                        "Programs could not be loaded.",
                      )}
                    </p>
                  ) : programs.length ? (
                    <>
                      {!datesFailed && !departures.length && (
                        <p role="status">
                          {tr(
                            "توجد برامج دون مواعيد قادمة.",
                            "Programs are published without upcoming departures.",
                          )}
                        </p>
                      )}
                      {programs.slice(0, 3).map((p) => (
                        <ProgramCard
                          key={p.id}
                          program={p}
                          returnTo={"/programs?city="+encodeURIComponent(selected.id)+"&country="+encodeURIComponent(country!.id)}
                          language={language}
                          compact
                        />
                      ))}
                      <Link
                        href={languageHref(
                          `/programs?city=${encodeURIComponent(selected.id)}&country=${encodeURIComponent(selected.country_id)}`,
                          language,
                        )}
                      >
                        {tr(
                          `استعرض البرامج من ${selected.name_ar}`,
                          `Browse programs from ${selected.name_en}`,
                        )}
                      </Link>
                    </>
                  ) : (
                    <p>
                      {tr(
                        "لا توجد برامج منشورة من هذه المدينة حاليًا.",
                        "No published programs from this city right now.",
                      )}
                    </p>
                  )}
                  {departures.length > 0 && (
                    <div className={styles.pickups}>
                      <label>
                        {tr(
                          "الموعد ونقاط التجمع",
                          "Departure and meeting points",
                        )}
                        <select
                          value={departureId}
                          onChange={(e) => setDepartureId(e.target.value)}
                        >
                          <option value="">
                            {tr("اختر موعد الرحلة", "Choose a departure")}
                          </option>
                          {departures.map((d) => (
                            <option key={d.id} value={d.id}>
                              {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
                                dateStyle: "medium",
                                timeZone: d.departure_timezone || "UTC",
                              }).format(new Date(d.start_at))}
                            </option>
                          ))}
                        </select>
                      </label>
                      {activeDeparture &&
                        (meeting.isPending ? (
                          <p>
                            {tr(
                              "جارٍ تحميل النقاط…",
                              "Loading meeting points…",
                            )}
                          </p>
                        ) : meeting.isError ? (
                          <p role="alert">
                            {tr(
                              "تعذر تحميل نقاط التجمع.",
                              "Meeting points could not be loaded.",
                            )}
                            <button onClick={() => void meeting.refetch()}>
                              {tr("إعادة المحاولة", "Retry")}
                            </button>
                          </p>
                        ) : meeting.data?.length ? (
                          <ul>
                            {meeting.data.map((p) => (
                              <li key={p.id}>
                                <strong>{ar ? p.name_ar : p.name_en}</strong>
                                <p>{ar ? p.address_ar : p.address_en}</p>
                                <p>
                                  {ar
                                    ? p.arrival_instructions_ar
                                    : p.arrival_instructions_en}
                                </p>
                                {p.map_url?.startsWith("https://") && (
                                  <a
                                    href={p.map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {tr("موقع التجمع", "Meeting location")}
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            {tr(
                              "لم تُحدد نقطة تجمع لهذا الموعد بعد.",
                              "No meeting point has been assigned yet.",
                            )}
                          </p>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3>
                    {cityMode
                      ? tr("مدن الانطلاق", "Departure cities")
                      : tr("بلدان الانطلاق", "Departure countries")}
                  </h3>
                  <label>
                    {cityMode
                      ? tr("ابحث عن مدينة", "Search cities")
                      : tr("ابحث عن دولة", "Search countries")}
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <div
                    className={styles.locations}
                    role="group"
                    aria-label={tr("نقاط الانطلاق", "Origins")}
                  >
                    {visible.map((l) => (
                      <button
                        type="button"
                        key={l.id}
                        aria-pressed={cityId === l.id}
                        aria-controls="journey-origin-details"
                        onClick={() => select(l.id, "chip")}
                      >
                        <span>{l.name}</span>
                        <small>
                          {programsFailed
                            ? tr(
                                "أعداد البرامج غير متاحة",
                                "Program counts unavailable",
                              )
                            : l.count
                              ? countLabel(l.count,"program",language,"published")
                              : tr(
                                  "لا توجد برامج منشورة حاليًا",
                                  "No published programs right now",
                                )}
                          {!datesFailed &&
                            l.count > 0 &&
                            ` · ${countLabel(l.dates,"departure",language,"upcoming")}`}
                        </small>
                      </button>
                    ))}
                  </div>
                  {!visible.length && (
                    <p role="status">
                      {search
                        ? tr(
                            "لا توجد نتائج تطابق البحث.",
                            "No matching locations.",
                          )
                        : country
                          ? tr(
                              "لا توجد مدن انطلاق منشورة لهذه الدولة حاليًا.",
                              "No published departure cities for this country yet.",
                            )
                          : tr(
                              "لا توجد مواقع انطلاق منشورة حاليًا.",
                              "No published origins yet.",
                            )}
                    </p>
                  )}
                  {mode === "world" && country && (
                    <Link
                      href={languageHref(
                        "/programs?country=" + encodeURIComponent(country.id),
                        language,
                      )}
                    >
                      {tr("برامج الدولة", "Country programs")}
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </aside>
      </div>
      {mobile && (
        <button
          ref={toggle}
          type="button"
          className={styles.mapToggle}
          aria-expanded={expanded}
          aria-controls="journey-map"
          onClick={() => {
            if (expanded) closeMap();
            else {
              setExpanded(true);
              setMapReady(true);
            }
          }}
        >
          {expanded
            ? tr("إخفاء الخريطة", "Hide map")
            : tr("عرض الخريطة", "Show map")}
        </button>
      )}
      {showMap && (
        <div className={styles.legend}>
          <span>
            {tr(
              "أزرق: نقطة انطلاق · ذهبي: مكة أو الموقع المحدد",
              "Blue: origin · Gold: Makkah or selected location",
            )}
          </span>
          <span>
            {tr(
              "الرقم على العلامة يجمع مواقع متقاربة، وليس عدد البرامج.",
              "Numbered markers group nearby locations, not programs.",
            )}
          </span>
        </div>
      )}
      <footer className={styles.footer}>
        <span>
          {tr(
            "المسار توضيحي إلى مكة، وليس قيادة أو تتبعًا مباشرًا.",
            "Illustrative connection to Makkah, not driving directions or live tracking.",
          )}
        </span>
      </footer>
    </section>
  );
}
