"use client";

import pageStyles from "./ProgramDetails.styles";

import ProgramSectionState from "../ProgramSectionState";
import ProgramPriceNote from "../ProgramPriceNote";
import { languageHref } from "../../../src/core/i18n/public-language";
import Image from "next/image";
import Link from "next/link";
import WebsiteBookingNotice from "../../components/WebsiteBookingNotice";
import AppBookingLink from "../../components/AppBookingLink";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  BriefcaseBusiness,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Moon,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stamp,
  Star,
  Utensils,
} from "lucide-react";

import { useLanguage } from "../../../src/core/i18n";
import { createClient } from "../../../src/lib/supabase/client";
import { getPublicProgramBySlug } from "../../../src/features/programs/services/public-program-details.service";
import { getTransportsForProgram } from "../../../src/features/transports/services";
import { getVisasForProgram } from "../../../src/features/visas/services";

function formatNumber(
  value: number,
  language: "ar" | "en",
) {
  return new Intl.NumberFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatDateTime(
  value: string | null,
  language: "ar" | "en",
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatDate(
  value: string | null,
  language: "ar" | "en",
) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-SA" : "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatTransitDuration(
  minutes: number,
  isArabic: boolean,
) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return isArabic
      ? `${hours} س ${remainingMinutes} د`
      : `${hours}h ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return isArabic
      ? `${hours} ساعة`
      : `${hours}h`;
  }

  return isArabic
    ? `${remainingMinutes} دقيقة`
    : `${remainingMinutes}m`;
}

export default function PublicProgramDetailsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const params = useParams<{
    slug: string;
  }>();

  const slug =
    typeof params.slug === "string"
      ? decodeURIComponent(params.slug)
      : "";

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const {
    data: program,
    isLoading: isProgramLoading,
    isError: isProgramError,
    refetch: refetchProgram,
  } = useQuery({
    queryKey: [
      "public",
      "program-details",
      slug,
    ],
    queryFn: () =>
      getPublicProgramBySlug(
        supabase,
        slug,
      ),
    enabled: Boolean(slug),
  });

  const {
    data: transports = [],
    isLoading: isTransportsLoading,
    isError: isTransportsError,
    refetch: refetchTransports,
  } = useQuery({
    queryKey: [
      "public",
      "program-details",
      program?.id ?? "",
      "transports",
    ],
    queryFn: () =>
      getTransportsForProgram(
        supabase,
        program!.id,
      ),
    enabled: Boolean(program?.id),
  });

  const {
    data: visas = [],
    isLoading: isVisasLoading,
    isError: isVisasError,
    refetch: refetchVisas,
  } = useQuery({
    queryKey: [
      "public",
      "program-details",
      program?.id ?? "",
      "visas",
    ],
    queryFn: () =>
      getVisasForProgram(
        supabase,
        program!.id,
      ),
    enabled: Boolean(program?.id),
  });

  const isLoading = isProgramLoading;
  const isError = isProgramError;

  if (isLoading) {
    return (
      <main className="nr-program-details-state" aria-busy="true" role="status">
        <div className="nr-program-details-loader" />
        <strong>
          {isArabic
            ? "جارٍ تحميل البرنامج..."
            : "Loading program..."}
        </strong>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="nr-program-details-state">
        <strong>
          {isArabic
            ? "تعذر تحميل البرنامج"
            : "Unable to load program"}
        </strong>

        <p>{isArabic ? "تحقق من اتصالك ثم أعد المحاولة." : "Check your connection and try again."}</p>
        <button className="program-action" type="button" onClick={() => void refetchProgram()}>{isArabic ? "إعادة المحاولة" : "Try again"}</button>

        <Link href={languageHref("/", language)}>
          {isArabic
            ? "العودة للرئيسية"
            : "Back Home"}
        </Link>
      </main>
    );
  }

  if (!program) {
    return (
      <main className="nr-program-details-state">
        <strong>404</strong>

        <p>
          {isArabic
            ? "البرنامج غير موجود أو غير منشور."
            : "This program does not exist or is not published."}
        </p>

        <Link href={languageHref("/programs", language)}>
          {isArabic
            ? "عرض البرامج"
            : "View Programs"}
        </Link>
      </main>
    );
  }

  const title =
    isArabic
      ? program.titleAr
      : program.titleEn;

  const summary =
    isArabic
      ? program.summaryAr
      : program.summaryEn;

  const description =
    isArabic
      ? program.descriptionAr
      : program.descriptionEn;

  const country =
    isArabic
      ? program.countryNameAr
      : program.countryNameEn;

  const flightPolicyLabel =
    program.flightInclusion === "included"
      ? isArabic
        ? "الطيران مشمول في سعر البرنامج"
        : "Flights are included in the program price"
      : program.flightInclusion === "excluded"
        ? isArabic
          ? "الطيران غير مشمول في سعر البرنامج"
          : "Flights are not included in the program price"
        : isArabic
          ? "سعر الطيران يتحدد حسب السعر والتوفر وقت الحجز"
          : "Flight price depends on live price and availability at booking time";

  const flightPolicyNote =
    isArabic
      ? program.flightNotesAr
      : program.flightNotesEn;



  return (
    <main
      className="nr-program-details"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <section className="nr-program-details-hero">
        {program.coverUrl ? (
          <Image
            src={program.coverUrl}
            alt={title}
            fill
            unoptimized
            priority
            className="nr-program-details-cover"
          />
        ) : null}

        <div
          className="nr-program-details-overlay"
          aria-hidden="true"
        />

        <div className="nr-program-details-container nr-program-details-hero-content">
          <Link
            href={languageHref("/programs", language)}
            className="nr-program-details-back"
          >
            <ArrowLeft size={17} />

            {isArabic
              ? "العودة للبرامج"
              : "Back to Programs"}
          </Link>

          <div className="nr-program-details-copy">
            <div className="nr-program-details-top-tags">
              {program.isFeatured ? (
                <span className="nr-program-details-badge">
                  <Sparkles size={14} />
                  {isArabic
                    ? "برنامج مختار"
                    : "Selected Program"}
                </span>
              ) : null}

              {country ? (
                <span className="nr-program-details-country">
                  <MapPin size={16} />
                  {country}
                </span>
              ) : null}
            </div>

            <h1>{title}</h1>

            {summary ? (
              <p>{summary}</p>
            ) : null}

            <div className="nr-program-details-facts">
              <span>
                <CalendarDays />
                <strong>
                  {program.durationDays}
                </strong>
                {isArabic
                  ? " أيام"
                  : " days"}
              </span>

              <span>
                <Moon />
                <strong>
                  {program.durationNights}
                </strong>
                {isArabic
                  ? " ليالٍ"
                  : " nights"}
              </span>

              <span className="is-price">
                <small>
                  {isArabic ? "من" : "From"}
                </small>
                <strong>
                  {formatNumber(
                    program.basePrice,
                    language,
                  )}
                </strong>
                {` ${program.currencyCode}`}
              </span>
            </div>
            <WebsiteBookingNotice language={language} compact />
          </div>
        </div>
      </section>

      <nav
        className="nr-program-details-subnav"
        aria-label={
          isArabic
            ? "أقسام تفاصيل البرنامج"
            : "Program detail sections"
        }
      >
        <div className="nr-program-details-container nr-program-details-subnav-inner">
          <a href="#overview">
            {isArabic ? "نظرة عامة" : "Overview"}
          </a>
          <a href="#hotels">
            {isArabic ? "الإقامة" : "Hotels"}
          </a>
          <a href="#flights">
            {isArabic ? "الطيران" : "Flights"}
          </a>
          <a href="#transport">
            {isArabic ? "النقل" : "Transport"}
          </a>
          <a href="#visas">
            {isArabic ? "التأشيرة" : "Visa"}
          </a>
          <a href="#departures">{isArabic ? "المواعيد" : "Departures"}</a>
          <a href="#additional-information">{isArabic ? "الخطة والشمول والأسعار" : "Itinerary, inclusions & prices"}</a>
        </div>
      </nav>

      <div className="nr-program-details-container nr-program-details-layout">
        <div className="nr-program-details-main">
          <section id="overview" className="nr-program-details-section nr-program-details-overview">
            <span className="nr-program-details-kicker">
              {isArabic
                ? "عن البرنامج"
                : "About the Program"}
            </span>

            <h2>
              {isArabic
                ? "تفاصيل البرنامج"
                : "Program Details"}
            </h2>

            {description ? (
              <p className="nr-program-details-description">
                {description}
              </p>
            ) : (
              <div className="nr-program-details-empty">
                {isArabic
                  ? "لم تُنشر تفاصيل إضافية لهذا البرنامج بعد."
                  : "No additional description has been published for this program yet."}
              </div>
            )}

            <div className="nr-program-details-trust">
              <div>
                <ShieldCheck />
                <span>
                  {isArabic
                    ? "استعرض خدمات البرنامج"
                    : "Explore program services"}
                </span>
              </div>

              <div>
                <CheckCircle2 />
                <span>
                  {isArabic
                    ? "تفاصيل البرنامج المنشورة"
                    : "Published program details"}
                </span>
              </div>

              <div>
                <Smartphone />
                <span>
                  {isArabic
                    ? "معلومات الرحلة في مكان واحد"
                    : "Journey information in one place"}
                </span>
              </div>
            </div>
          </section>

          <section id="hotels" className="nr-program-details-section">
            <span className="nr-program-details-kicker">
              {isArabic
                ? "الإقامة"
                : "Accommodation"}
            </span>

            <h2>
              {isArabic
                ? "الفنادق والإقامة"
                : "Hotels & Accommodation"}
            </h2>

            {program.hotels.length === 0 ? (
              <div className="nr-program-details-empty">
                {isArabic
                  ? "لم تتم إضافة تفاصيل الفندق لهذا البرنامج بعد."
                  : "Hotel details have not been added to this program yet."}
              </div>
            ) : (
              <div className="nr-program-details-hotels">
                {program.hotels.map(
                  (hotel) => {
                    const hotelName =
                      isArabic
                        ? hotel.nameAr
                        : hotel.nameEn;

                    const city =
                      isArabic
                        ? hotel.cityAr
                        : hotel.cityEn;

                    const hotelDescription =
                      isArabic
                        ? hotel.descriptionAr
                        : hotel.descriptionEn;

                    const roomType =
                      isArabic
                        ? hotel.roomTypeAr
                        : hotel.roomTypeEn;

                    const mealPlan =
                      isArabic
                        ? hotel.mealPlanAr
                        : hotel.mealPlanEn;

                    const notes =
                      isArabic
                        ? hotel.notesAr
                        : hotel.notesEn;

                    return (
                      <article
                        key={hotel.relationId}
                        className="nr-program-details-hotel"
                      >
                        <div className="nr-program-details-hotel-cover">
                          {hotel.coverUrl ? (
                            <Image
                              src={hotel.coverUrl}
                              alt={hotelName}
                              fill
                              unoptimized
                              className="nr-program-details-hotel-image"
                            />
                          ) : (
                            <div className="nr-program-details-hotel-placeholder">
                              <BedDouble />
                            </div>
                          )}

                          {hotel.stars > 0 ? (
                            <div className="nr-program-details-stars-floating">
                              <Star
                                size={14}
                                fill="currentColor"
                              />
                              <strong>
                                {hotel.stars}
                              </strong>
                            </div>
                          ) : null}
                        </div>

                        <div className="nr-program-details-hotel-body">
                          <div className="nr-program-details-hotel-heading">
                            <div>
                              {city ? (
                                <span>
                                  <MapPin size={15} />
                                  {city}
                                </span>
                              ) : null}

                              <h3>
                                {hotelName}
                              </h3>
                            </div>
                          </div>

                          {hotelDescription ? (
                            <p>
                              {hotelDescription}
                            </p>
                          ) : null}

                          <div className="nr-program-details-hotel-meta">
                            <span>
                              <Moon />
                              {hotel.nights}{" "}
                              {isArabic
                                ? "ليالٍ"
                                : "nights"}
                            </span>

                            {roomType ? (
                              <span>
                                <BedDouble />
                                {roomType}
                              </span>
                            ) : null}

                            {mealPlan ? (
                              <span>
                                <Utensils />
                                {mealPlan}
                              </span>
                            ) : null}
                          </div>

                          {(hotel.checkInDate ||
                            hotel.checkOutDate) ? (
                            <div className="nr-program-details-dates">
                              {hotel.checkInDate ? (
                                <span>
                                  {isArabic
                                    ? "الدخول:"
                                    : "Check-in:"}{" "}
                                  <strong>
                                    {formatDate(
                                      hotel.checkInDate,
                                      language,
                                    )}
                                  </strong>
                                </span>
                              ) : null}

                              {hotel.checkOutDate ? (
                                <span>
                                  {isArabic
                                    ? "الخروج:"
                                    : "Check-out:"}{" "}
                                  <strong>
                                    {formatDate(
                                      hotel.checkOutDate,
                                      language,
                                    )}
                                  </strong>
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {notes ? (
                            <p className="nr-program-details-notes">
                              {notes}
                            </p>
                          ) : null}
                        </div>

                        {hotel.galleryUrls.length > 0 ? (
                          <div className="nr-program-details-gallery">
                            {hotel.galleryUrls
                              .slice(0, 6)
                              .map(
                                (url, index) => (
                                  <div
                                    key={`${url}-${index}`}
                                    className="nr-program-details-gallery-item"
                                  >
                                    <Image
                                      src={url}
                                      alt={`${hotelName} ${index + 1}`}
                                      fill
                                      unoptimized
                                    />

                                    {index === 5 &&
                                    hotel.galleryUrls.length > 6 ? (
                                      <span className="nr-program-details-gallery-more">
                                        +{hotel.galleryUrls.length - 6}
                                      </span>
                                    ) : null}
                                  </div>
                                ),
                              )}
                          </div>
                        ) : null}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section id="transport" className="nr-program-details-section">
            <span className="nr-program-details-kicker">
              {isArabic
                ? "النقل"
                : "Transport"}
            </span>

            <h2>
              {isArabic
                ? "النقل والمواصلات"
                : "Transport & Transfers"}
            </h2>

            {isTransportsLoading ? <ProgramSectionState language={language} title={isArabic ? "النقل" : "Transport"} state="loading" /> : isTransportsError ? <ProgramSectionState language={language} title={isArabic ? "النقل" : "Transport"} state="error" onRetry={() => void refetchTransports()} /> : transports.length === 0 ? (
              <div className="nr-program-details-empty">
                {isArabic
                  ? "لم تتم إضافة تفاصيل النقل لهذا البرنامج بعد."
                  : "Transport details have not been added to this program yet."}
              </div>
            ) : (
              <div className="nr-program-transports-public">
                {transports.map((transport) => {
                  const service =
                    transport.transport;

                  const serviceName =
                    service
                      ? isArabic
                        ? service.nameAr
                        : service.nameEn
                      : isArabic
                        ? "خدمة نقل"
                        : "Transport Service";

                  const vehicleName =
                    service
                      ? isArabic
                        ? service.vehicleNameAr ||
                          service.vehicleType
                        : service.vehicleNameEn ||
                          service.vehicleType
                      : "";

                  const pickupName =
                    isArabic
                      ? transport.pickupNameAr
                      : transport.pickupNameEn;

                  const dropoffName =
                    isArabic
                      ? transport.dropoffNameAr
                      : transport.dropoffNameEn;

                  const notes =
                    isArabic
                      ? transport.notesAr
                      : transport.notesEn;

                  return (
                    <article
                      key={transport.id}
                      className="nr-program-transport-public-card"
                    >
                      <div className="nr-program-transport-public-header">
                        <div>
                          <span className="nr-program-transport-day">
                            {transport.dayNumber
                              ? isArabic
                                ? `اليوم ${transport.dayNumber}`
                                : `Day ${transport.dayNumber}`
                              : isArabic
                                ? "خدمة نقل"
                                : "Transport"}
                          </span>

                          <h3>
                            <BusFront size={20} />
                            {serviceName}
                          </h3>
                        </div>

                        <span
                          className={`nr-program-transport-inclusion ${
                            transport.isIncluded
                              ? "is-included"
                              : "is-excluded"
                          }`}
                        >
                          {transport.isIncluded
                            ? isArabic
                              ? "مشمول"
                              : "Included"
                            : isArabic
                              ? "غير مشمول"
                              : "Not Included"}
                        </span>
                      </div>

                      <div className="nr-program-transport-route">
                        <div>
                          <MapPin />
                          <span>
                            {isArabic
                              ? "الاستلام"
                              : "Pickup"}
                          </span>
                          <strong>
                            {pickupName || "—"}
                          </strong>
                        </div>

                        <div className="nr-program-transport-route-line">
                          <span />
                          <BusFront size={18} />
                          <span />
                        </div>

                        <div>
                          <MapPin />
                          <span>
                            {isArabic
                              ? "الوصول"
                              : "Drop-off"}
                          </span>
                          <strong>
                            {dropoffName || "—"}
                          </strong>
                        </div>
                      </div>

                      <div className="nr-program-transport-meta">
                        {service ? (
                          <>
                            <span>
                              <BusFront />
                              {service.mode === "private"
                                ? isArabic
                                  ? "نقل خاص"
                                  : "Private"
                                : isArabic
                                  ? "نقل مشترك"
                                  : "Shared"}
                            </span>

                            {vehicleName ? (
                              <span>
                                <BusFront />
                                {vehicleName}
                              </span>
                            ) : null}

                            <span>
                              <BriefcaseBusiness />
                              {isArabic
                                ? `${service.capacity} راكب`
                                : `${service.capacity} passengers`}
                            </span>
                          </>
                        ) : null}

                        {transport.pickupDatetime ? (
                          <span>
                            <CalendarDays />
                            {formatDateTime(
                              transport.pickupDatetime,
                              language,
                            )}
                          </span>
                        ) : null}

                        {transport.estimatedDurationMinutes !==
                        null ? (
                          <span>
                            <Clock3 />
                            {formatTransitDuration(
                              transport.estimatedDurationMinutes,
                              isArabic,
                            )}
                          </span>
                        ) : null}
                      </div>

                      {notes ? (
                        <p className="nr-program-transport-notes">
                          {notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="visas" className="nr-program-details-section">
            <span className="nr-program-details-kicker">
              {isArabic
                ? "التأشيرة"
                : "Visa"}
            </span>

            <h2>
              {isArabic
                ? "التأشيرات والمتطلبات"
                : "Visas & Requirements"}
            </h2>

            {isVisasLoading ? <ProgramSectionState language={language} title={isArabic ? "التأشيرات" : "Visas"} state="loading" /> : isVisasError ? <ProgramSectionState language={language} title={isArabic ? "التأشيرات" : "Visas"} state="error" onRetry={() => void refetchVisas()} /> : visas.length === 0 ? (
              <div className="nr-program-details-empty">
                {isArabic
                  ? "لم تتم إضافة تفاصيل التأشيرة لهذا البرنامج بعد."
                  : "Visa details have not been added to this program yet."}
              </div>
            ) : (
              <div className="nr-program-visas-public">
                {visas.map((programVisa) => {
                  const visa = programVisa.visa;

                  const visaName =
                    visa
                      ? isArabic
                        ? visa.nameAr
                        : visa.nameEn
                      : isArabic
                        ? "تأشيرة"
                        : "Visa";

                  const visaDescription =
                    visa
                      ? isArabic
                        ? visa.descriptionAr
                        : visa.descriptionEn
                      : "";

                  const requirements =
                    visa
                      ? isArabic
                        ? visa.requirementsAr
                        : visa.requirementsEn
                      : [];

                  const notes =
                    isArabic
                      ? programVisa.notesAr
                      : programVisa.notesEn;

                  const visaTypeLabel =
                    visa?.visaType === "umrah"
                      ? isArabic
                        ? "تأشيرة عمرة"
                        : "Umrah Visa"
                      : visa?.visaType === "tourist"
                        ? isArabic
                          ? "تأشيرة سياحية"
                          : "Tourist Visa"
                        : visa?.visaType === "visit"
                          ? isArabic
                            ? "تأشيرة زيارة"
                            : "Visit Visa"
                          : visa?.visaType === "transit"
                            ? isArabic
                              ? "تأشيرة ترانزيت"
                              : "Transit Visa"
                            : isArabic
                              ? "تأشيرة أخرى"
                              : "Other Visa";

                  const processingLabel =
                    visa?.processingType === "express"
                      ? isArabic
                        ? "معالجة سريعة"
                        : "Express Processing"
                      : visa?.processingType === "manual"
                        ? isArabic
                          ? "معالجة يدوية"
                          : "Manual Processing"
                        : isArabic
                          ? "معالجة عادية"
                          : "Standard Processing";

                  return (
                    <article
                      key={programVisa.id}
                      className="nr-program-visa-public-card"
                    >
                      <div className="nr-program-visa-public-header">
                        <div>
                          <span className="nr-program-visa-type">
                            {visaTypeLabel}
                          </span>

                          <h3>
                            <Stamp size={20} />
                            {visaName}
                          </h3>
                        </div>

                        <span
                          className={`nr-program-visa-inclusion ${
                            programVisa.isIncluded
                              ? "is-included"
                              : "is-excluded"
                          }`}
                        >
                          {programVisa.isIncluded
                            ? isArabic
                              ? "مشمولة في البرنامج"
                              : "Included"
                            : isArabic
                              ? "غير مشمولة"
                              : "Not Included"}
                        </span>
                      </div>

                      {visaDescription ? (
                        <p className="nr-program-visa-description">
                          {visaDescription}
                        </p>
                      ) : null}

                      <div className="nr-program-visa-meta">
                        <span>
                          <Clock3 />
                          {processingLabel}
                        </span>

                        {visa?.processingTimeDays !== null &&
                        visa?.processingTimeDays !== undefined ? (
                          <span>
                            <CalendarDays />
                            {isArabic
                              ? `المعالجة خلال ${visa.processingTimeDays} يوم`
                              : `${visa.processingTimeDays} processing days`}
                          </span>
                        ) : null}

                        {visa?.validityDays !== null &&
                        visa?.validityDays !== undefined ? (
                          <span>
                            <ShieldCheck />
                            {isArabic
                              ? `الصلاحية ${visa.validityDays} يوم`
                              : `${visa.validityDays} days validity`}
                          </span>
                        ) : null}

                        {visa?.maxStayDays !== null &&
                        visa?.maxStayDays !== undefined ? (
                          <span>
                            <Moon />
                            {isArabic
                              ? `أقصى إقامة ${visa.maxStayDays} يوم`
                              : `Max stay ${visa.maxStayDays} days`}
                          </span>
                        ) : null}
                      </div>

                      {requirements.length > 0 ? (
                        <div className="nr-program-visa-requirements">
                          <div className="nr-program-visa-requirements-heading">
                            <CheckCircle2 />
                            <strong>
                              {isArabic
                                ? "المتطلبات"
                                : "Requirements"}
                            </strong>
                          </div>

                          <ul>
                            {requirements.map(
                              (requirement: string, index: number) => (
                                <li
                                  key={`${requirement}-${index}`}
                                >
                                  <CheckCircle2 />
                                  <span>
                                    {requirement}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ) : null}

                      {notes ? (
                        <p className="nr-program-visa-notes">
                          {notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section id="flights" className="nr-program-details-section">
            <span className="nr-program-details-kicker">
              {isArabic
                ? "الطيران"
                : "Flights"}
            </span>

            <h2>
              {isArabic
                ? "تفاصيل الرحلات"
                : "Flight Details"}
            </h2>

            <div
              className={`nr-program-flight-policy nr-program-flight-policy-${program.flightInclusion}`}
            >
              <Plane size={19} />

              <div>
                <strong>
                  {flightPolicyLabel}
                </strong>

                {flightPolicyNote ? (
                  <span>
                    {flightPolicyNote}
                  </span>
                ) : null}
              </div>
            </div>

            {program.flights.length === 0 ? (
              <div className="nr-program-details-empty">
                {isArabic
                  ? "لم تتم إضافة تفاصيل الرحلات لهذا البرنامج بعد."
                  : "Flight details have not been added to this program yet."}
              </div>
            ) : (
              <div className="nr-program-flights-public">
                {program.flights.map((flight) => {
                  const airlineName =
                    isArabic
                      ? flight.airlineNameAr
                      : flight.airlineNameEn;

                  const departureAirport =
                    isArabic
                      ? flight.departureAirportAr
                      : flight.departureAirportEn;

                  const arrivalAirport =
                    isArabic
                      ? flight.arrivalAirportAr
                      : flight.arrivalAirportEn;

                  const cabinClass =
                    isArabic
                      ? flight.cabinClassAr
                      : flight.cabinClassEn;

                  const transitAirport =
                    isArabic
                      ? flight.transitAirportAr
                      : flight.transitAirportEn;

                  const notes =
                    isArabic
                      ? flight.notesAr
                      : flight.notesEn;

                  return (
                    <article
                      key={flight.id}
                      className="nr-program-flight-public-card"
                    >
                      <div className="nr-program-flight-public-header">
                        <div>
                          <span
                            className={`nr-program-flight-public-direction ${
                              flight.direction === "outbound"
                                ? "is-outbound"
                                : "is-return"
                            }`}
                          >
                            {flight.direction === "outbound"
                              ? isArabic
                                ? "رحلة الذهاب"
                                : "Outbound"
                              : isArabic
                                ? "رحلة العودة"
                                : "Return"}
                          </span>

                          <h3>
                            {airlineName ||
                              (isArabic
                                ? "تفاصيل الرحلة"
                                : "Flight")}
                          </h3>
                        </div>

                        {flight.flightNumber ? (
                          <strong className="nr-program-flight-number">
                            {flight.flightNumber}
                          </strong>
                        ) : null}
                      </div>

                      <div className="nr-program-flight-route">
                        <div>
                          <PlaneTakeoff />
                          <span>
                            {isArabic
                              ? "المغادرة"
                              : "Departure"}
                          </span>
                          <strong>
                            {departureAirport}
                          </strong>
                          {flight.departureAt ? (
                            <small>
                              {formatDateTime(
                                flight.departureAt,
                                language,
                              )}
                            </small>
                          ) : null}
                        </div>

                        <div className="nr-program-flight-route-line">
                          <span />
                          <Plane size={19} />
                          <span />
                        </div>

                        <div>
                          <PlaneLanding />
                          <span>
                            {isArabic
                              ? "الوصول"
                              : "Arrival"}
                          </span>
                          <strong>
                            {arrivalAirport}
                          </strong>
                          {flight.arrivalAt ? (
                            <small>
                              {formatDateTime(
                                flight.arrivalAt,
                                language,
                              )}
                            </small>
                          ) : null}
                        </div>
                      </div>

                      <div className="nr-program-flight-meta">
                        <span>
                          <Plane />
                          {flight.flightType === "direct"
                            ? isArabic
                              ? "مباشر"
                              : "Direct"
                            : isArabic
                              ? "ترانزيت"
                              : "Transit"}
                        </span>

                        {cabinClass ? (
                          <span>
                            <BriefcaseBusiness />
                            {cabinClass}
                          </span>
                        ) : null}

                        {flight.baggageAllowanceKg > 0 ? (
                          <span>
                            <BriefcaseBusiness />
                            {flight.baggageAllowanceKg}{" "}
                            {isArabic
                              ? "كجم أمتعة"
                              : "kg baggage"}
                          </span>
                        ) : null}
                      </div>

                      {flight.flightType === "transit" ? (
                        <div className="nr-program-flight-transit-public">
                          <Clock3 />

                          <div>
                            <strong>
                              {isArabic
                                ? "تفاصيل الترانزيت"
                                : "Transit Details"}
                            </strong>

                            <span>
                              {transitAirport ||
                                (isArabic
                                  ? "مطار الترانزيت غير محدد"
                                  : "Transit airport not specified")}

                              {flight.transitDurationMinutes > 0
                                ? ` • ${formatTransitDuration(
                                    flight.transitDurationMinutes,
                                    isArabic,
                                  )}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {notes ? (
                        <p className="nr-program-flight-public-notes">
                          {notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="nr-program-details-booking">
          <div className="nr-program-details-booking-label">
            <Sparkles size={15} />
            {isArabic
              ? "ابدأ رحلتك مع نور آب"
              : "Start your journey with NourApp"}
          </div>

          <span>
            {isArabic
              ? "السعر يبدأ من"
              : "Starting from"}
          </span>

          <strong>
            {formatNumber(
              program.basePrice,
              language,
            )}

            <small>
              {program.currencyCode}
            </small>
          </strong>

          <div className="nr-program-details-booking-facts">
            <span>
              <CalendarDays />
              {program.durationDays}{" "}
              {isArabic ? "أيام" : "days"}
            </span>

            <span>
              <Moon />
              {program.durationNights}{" "}
              {isArabic ? "ليالٍ" : "nights"}
            </span>
          </div>

          <p>
            {isArabic
              ? "استعرض تفاصيل الإقامة والنقل والخدمات، وتواصل معنا إذا احتجت إلى معلومات إضافية."
              : "Explore accommodation, transport, and services, and contact us if you need more information."}
          </p>
          <ProgramPriceNote language={language} />
          <WebsiteBookingNotice language={language} />

          <div className="nr-program-details-booking-trust">
            <span>
              <ShieldCheck size={15} />
              {isArabic ? "دعم واستفسارات" : "Help & enquiries"}
            </span>
            <span>
              <CheckCircle2 size={15} />
              {isArabic ? "تفاصيل واضحة" : "Clear details"}
            </span>
          </div>

          <AppBookingLink language={language} className="nr-program-details-book" />
          <small className="nr-program-details-booking-hint">
            {isArabic ? "تطبيق نور آب غير منشور حاليًا. الحجز عبر الموقع متوقف." : "The Nour app is not released yet. Website booking is paused."}
          </small>
        </aside>
      </div>

      <style jsx global>{pageStyles}</style>
    </main>
  );
}
