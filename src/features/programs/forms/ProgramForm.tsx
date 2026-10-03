"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import { getCities } from "../../journeys/journey.service";
import DepartureFields from "./DepartureFields";
import { validateDepartureDrafts, type DepartureDraft } from "../departure-drafts";

import Button from "../../../components/ui/Button";
import MediaUploader from "../../../components/ui/media/MediaUploader";
import { useLanguage } from "../../../core/i18n";

import type {
  ProgramFlightFormValue,
  ProgramFormValues,
  ProgramHotelFormValue,
  ProgramStatus,
} from "../types";

import type {
  ProgramTransportFormValue,
  TransportMode,
  TransportServiceType,
  TransportVehicleType,
} from "../../transports/types/transport";

import type {
  ProgramVisaFormValue,
  VisaProcessingType,
  VisaType,
} from "../../visas/types/visa";


type CountryOption = {
  id: string;
  nameAr: string;
  nameEn: string;
};

type HotelOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr?: string;
  cityEn?: string;
  stars?: number;
};

type TransportOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  providerNameAr?: string | null;
  providerNameEn?: string | null;
  serviceType: TransportServiceType;
  mode: TransportMode;
  vehicleType: TransportVehicleType;
  vehicleNameAr?: string | null;
  vehicleNameEn?: string | null;
  capacity: number;
};

type VisaOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  visaType: VisaType;
  processingType: VisaProcessingType;
  processingTimeDays: number | null;
  validityDays: number | null;
  maxStayDays: number | null;
  basePrice: number | null;
  currencyCode: string | null;
};

type ProgramFormSubmitValues = ProgramFormValues & {
  transports: ProgramTransportFormValue[];
  visas: ProgramVisaFormValue[];
  departures: DepartureDraft[];
};

type ProgramFormProps = {
  initialValues?: Partial<ProgramFormSubmitValues>;
  isCreating?: boolean;
  countries?: CountryOption[];
  hotels?: HotelOption[];
  transports?: TransportOption[];
  visas?: VisaOption[];
  onSubmit: (values: ProgramFormSubmitValues) => Promise<void>;
  isSubmitting?: boolean;
};

const defaultValues: ProgramFormSubmitValues = {
  departures: [],
  titleAr: "",
  titleEn: "",
  slug: "",
  summaryAr: "",
  summaryEn: "",
  descriptionAr: "",
  descriptionEn: "",
  countryId: "",
  durationDays: 1,
  durationNights: 0,
  basePrice: 0,
  currencyCode: "SAR",
  status: "draft",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  coverFile: null,
  hotels: [],
  flightInclusion: "dynamic",
  flightNotesAr: "",
  flightNotesEn: "",
  flights: [],
  transports: [],
  visas: [],
};

const emptyHotel: ProgramHotelFormValue = {
  hotelId: "",
  nights: 1,
  roomTypeAr: "",
  roomTypeEn: "",
  mealPlanAr: "",
  mealPlanEn: "",
  checkInDate: "",
  checkOutDate: "",
  notesAr: "",
  notesEn: "",
  sortOrder: 0,
};

const emptyFlight: ProgramFlightFormValue = {
  direction: "outbound",

  airlineNameAr: "",
  airlineNameEn: "",

  flightNumber: "",

  departureAirportAr: "",
  departureAirportEn: "",

  arrivalAirportAr: "",
  arrivalAirportEn: "",

  departureAt: "",
  arrivalAt: "",

  flightType: "direct",

  transitAirportAr: "",
  transitAirportEn: "",
  transitDurationMinutes: 0,

  cabinClassAr: "",
  cabinClassEn: "",

  baggageAllowanceKg: 0,

  notesAr: "",
  notesEn: "",

  sortOrder: 0,
};


const emptyTransport: ProgramTransportFormValue = {
  transportId: "",
  dayNumber: null,

  pickupNameAr: "",
  pickupNameEn: "",

  dropoffNameAr: "",
  dropoffNameEn: "",

  pickupDatetime: "",
  estimatedDurationMinutes: null,

  notesAr: "",
  notesEn: "",

  isIncluded: true,
  sortOrder: 0,
};

const emptyVisa: ProgramVisaFormValue = {
  visaId: "",
  isIncluded: true,
  notesAr: "",
  notesEn: "",
  sortOrder: 0,
};

export default function ProgramForm({
  initialValues,
  countries = [],
  hotels = [],
  transports = [],
  visas = [],
  onSubmit,
  isCreating = false,
  isSubmitting = false,
}: ProgramFormProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const [values, setValues] =
  useState<ProgramFormSubmitValues>({
    ...defaultValues,
    ...initialValues,

    coverFile: null,

    hotels:
      initialValues?.hotels ?? [],

    flights:
      initialValues?.flights ?? [],

    transports:
      initialValues?.transports ?? [],

    visas:
      initialValues?.visas ?? [],
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "cities", "active"],
    queryFn: () => getCities(createClient("admin")),
    enabled: isCreating,
  });

  function updateValue<K extends keyof ProgramFormSubmitValues>(
    key: K,
    value: ProgramFormSubmitValues[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  function addHotel() {
    setValues((currentValues) => ({
      ...currentValues,
      hotels: [
        ...currentValues.hotels,
        {
          ...emptyHotel,
          sortOrder: currentValues.hotels.length,
        },
      ],
    }));
  }

  function removeHotel(index: number) {
    setValues((currentValues) => ({
      ...currentValues,
      hotels: currentValues.hotels
        .filter((_, currentIndex) => currentIndex !== index)
        .map((hotel, currentIndex) => ({
          ...hotel,
          sortOrder: currentIndex,
        })),
    }));
  }

  function updateHotel<
    K extends keyof ProgramHotelFormValue,
  >(
    index: number,
    key: K,
    value: ProgramHotelFormValue[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      hotels: currentValues.hotels.map(
        (hotel, currentIndex) =>
          currentIndex === index
            ? {
                ...hotel,
                [key]: value,
              }
            : hotel,
      ),
    }));
  }

  function addFlight() {
  setValues((currentValues) => ({
    ...currentValues,

    flights: [
      ...currentValues.flights,

      {
        ...emptyFlight,
        sortOrder:
          currentValues.flights.length,
      },
    ],
  }));
}

function removeFlight(index: number) {
  setValues((currentValues) => ({
    ...currentValues,

    flights:
      currentValues.flights
        .filter(
          (_, currentIndex) =>
            currentIndex !== index,
        )
        .map(
          (flight, currentIndex) => ({
            ...flight,
            sortOrder: currentIndex,
          }),
        ),
  }));
}

function updateFlight<
  K extends keyof ProgramFlightFormValue,
>(
  index: number,
  key: K,
  value: ProgramFlightFormValue[K],
) {
  setValues((currentValues) => ({
    ...currentValues,

    flights:
      currentValues.flights.map(
        (flight, currentIndex) =>
          currentIndex === index
            ? {
                ...flight,
                [key]: value,
              }
            : flight,
      ),
  }));
}


  function addTransport() {
    setValues((currentValues) => ({
      ...currentValues,

      transports: [
        ...currentValues.transports,
        {
          ...emptyTransport,
          sortOrder:
            currentValues.transports.length,
        },
      ],
    }));
  }

  function removeTransport(index: number) {
    setValues((currentValues) => ({
      ...currentValues,

      transports:
        currentValues.transports
          .filter(
            (_, currentIndex) =>
              currentIndex !== index,
          )
          .map(
            (transport, currentIndex) => ({
              ...transport,
              sortOrder: currentIndex,
            }),
          ),
    }));
  }

  function updateTransport<
    K extends keyof ProgramTransportFormValue,
  >(
    index: number,
    key: K,
    value: ProgramTransportFormValue[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,

      transports:
        currentValues.transports.map(
          (transport, currentIndex) =>
            currentIndex === index
              ? {
                  ...transport,
                  [key]: value,
                }
              : transport,
        ),
    }));
  }

  function addVisa() {
    setValues((currentValues) => ({
      ...currentValues,
      visas: [
        ...currentValues.visas,
        {
          ...emptyVisa,
          sortOrder:
            currentValues.visas.length,
        },
      ],
    }));
  }

  function removeVisa(index: number) {
    setValues((currentValues) => ({
      ...currentValues,
      visas: currentValues.visas
        .filter(
          (_, currentIndex) =>
            currentIndex !== index,
        )
        .map((visa, currentIndex) => ({
          ...visa,
          sortOrder: currentIndex,
        })),
    }));
  }

  function updateVisa<
    K extends keyof ProgramVisaFormValue,
  >(
    index: number,
    key: K,
    value: ProgramVisaFormValue[K],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      visas: currentValues.visas.map(
        (visa, currentIndex) =>
          currentIndex === index
            ? {
                ...visa,
                [key]: value,
              }
            : visa,
      ),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const selectedHotelIds = values.hotels
      .map((hotel) => hotel.hotelId)
      .filter(Boolean);

    if (
      new Set(selectedHotelIds).size !==
      selectedHotelIds.length
    ) {
      window.alert(
        isArabic
          ? "لا يمكن إضافة الفندق نفسه أكثر من مرة داخل البرنامج."
          : "The same hotel cannot be added more than once.",
      );
      return;
    }

    const invalidHotel = values.hotels.find(
      (hotel: ProgramHotelFormValue) =>
        !hotel.hotelId ||
        hotel.nights < 0 ||
        (hotel.checkInDate &&
          hotel.checkOutDate &&
          hotel.checkOutDate < hotel.checkInDate),
    );

    if (invalidHotel) {
      window.alert(
        isArabic
          ? "راجع بيانات الفنادق وتأكد من اختيار الفندق وعدد الليالي وتواريخ الدخول والخروج."
          : "Please review the hotel, nights, and check-in/check-out dates.",
      );
      return;
    }

    const invalidFlight = values.flights.find(
      (flight: ProgramFlightFormValue) =>
        !flight.airlineNameAr.trim() ||
        !flight.airlineNameEn.trim() ||
        !flight.departureAirportAr.trim() ||
        !flight.departureAirportEn.trim() ||
        !flight.arrivalAirportAr.trim() ||
        !flight.arrivalAirportEn.trim() ||
        (flight.departureAt &&
          flight.arrivalAt &&
          flight.arrivalAt < flight.departureAt),
    );

    if (invalidFlight) {
      window.alert(
        isArabic
          ? "راجع بيانات الرحلات وتأكد من شركة الطيران والمطارات ومواعيد الإقلاع والوصول."
          : "Please review airline, airport, departure and arrival information.",
      );
      return;
    }

    const invalidTransport =
      values.transports.find(
        (transport: ProgramTransportFormValue) =>
          !transport.transportId ||
          (transport.dayNumber !== null &&
            transport.dayNumber < 1) ||
          (transport.estimatedDurationMinutes !== null &&
            transport.estimatedDurationMinutes < 0),
      );

    if (invalidTransport) {
      window.alert(
        isArabic
          ? "راجع بيانات النقل وتأكد من اختيار خدمة النقل وصحة اليوم والمدة التقديرية."
          : "Please review transport selection, day number, and estimated duration.",
      );
      return;
    }

    const selectedVisaIds = values.visas
      .map((visa) => visa.visaId)
      .filter(Boolean);

    if (
      new Set(selectedVisaIds).size !==
      selectedVisaIds.length
    ) {
      window.alert(
        isArabic
          ? "لا يمكن إضافة التأشيرة نفسها أكثر من مرة داخل البرنامج."
          : "The same visa cannot be added more than once.",
      );
      return;
    }

    const invalidVisa = values.visas.find(
      (visa: ProgramVisaFormValue) => !visa.visaId,
    );

    if (invalidVisa) {
      window.alert(
        isArabic
          ? "راجع بيانات التأشيرات وتأكد من اختيار خدمة التأشيرة."
          : "Please review visa selection.",
      );
      return;
    }

    if (isCreating) {
      const error = validateDepartureDrafts(values.departures, values.countryId, citiesQuery.data ?? [], isArabic);
      if (error) { window.alert(error); return; }
    }

    await onSubmit({
      ...values,
      titleAr: values.titleAr.trim(),
      titleEn: values.titleEn.trim(),
      slug: values.slug.trim(),
      summaryAr: values.summaryAr.trim(),
      summaryEn: values.summaryEn.trim(),
      descriptionAr: values.descriptionAr.trim(),
      descriptionEn: values.descriptionEn.trim(),
      currencyCode: values.currencyCode.trim().toUpperCase(),
      flightNotesAr: values.flightNotesAr.trim(),
      flightNotesEn: values.flightNotesEn.trim(),
      hotels: values.hotels.map((hotel, index) => ({
        ...hotel,
        roomTypeAr: hotel.roomTypeAr.trim(),
        roomTypeEn: hotel.roomTypeEn.trim(),
        mealPlanAr: hotel.mealPlanAr.trim(),
        mealPlanEn: hotel.mealPlanEn.trim(),
        notesAr: hotel.notesAr.trim(),
        notesEn: hotel.notesEn.trim(),
        sortOrder: index,
      })),
      flights: values.flights.map((flight: ProgramFlightFormValue, index: number) => ({
        ...flight,
        airlineNameAr: flight.airlineNameAr.trim(),
        airlineNameEn: flight.airlineNameEn.trim(),
        flightNumber: flight.flightNumber.trim(),
        departureAirportAr: flight.departureAirportAr.trim(),
        departureAirportEn: flight.departureAirportEn.trim(),
        arrivalAirportAr: flight.arrivalAirportAr.trim(),
        arrivalAirportEn: flight.arrivalAirportEn.trim(),
        transitAirportAr: flight.transitAirportAr.trim(),
        transitAirportEn: flight.transitAirportEn.trim(),
        cabinClassAr: flight.cabinClassAr.trim(),
        cabinClassEn: flight.cabinClassEn.trim(),
        notesAr: flight.notesAr.trim(),
        notesEn: flight.notesEn.trim(),
        sortOrder: index,
      })),
      transports: values.transports.map((transport, index) => ({
        ...transport,
        pickupNameAr: transport.pickupNameAr.trim(),
        pickupNameEn: transport.pickupNameEn.trim(),
        dropoffNameAr: transport.dropoffNameAr.trim(),
        dropoffNameEn: transport.dropoffNameEn.trim(),
        notesAr: transport.notesAr.trim(),
        notesEn: transport.notesEn.trim(),
        sortOrder: index,
      })),
      visas: values.visas.map((visa, index) => ({
        ...visa,
        notesAr: visa.notesAr.trim(),
        notesEn: visa.notesEn.trim(),
        sortOrder: index,
      })),
    });
  }

  return (
    <form
      className="nr-country-form"
      onSubmit={handleSubmit}
    >
      <MediaUploader
        label={
          isArabic
            ? "صورة غلاف البرنامج"
            : "Program Cover Image"
        }
        onFileSelect={(file) => {
          updateValue("coverFile", file);
        }}
      />

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>01</span>

          <div>
            <h3>
              {isArabic
                ? "المعلومات الأساسية"
                : "Basic Information"}
            </h3>

            <p>
              {isArabic
                ? "أدخل عنوان البرنامج والرابط المختصر."
                : "Enter the program title and slug."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>
              {isArabic
                ? "العنوان بالعربية"
                : "Arabic Title"}
            </span>

            <input
              className="nr-input"
              value={values.titleAr}
              onChange={(event) =>
                updateValue(
                  "titleAr",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "العنوان بالإنجليزية"
                : "English Title"}
            </span>

            <input
              className="nr-input"
              value={values.titleEn}
              onChange={(event) =>
                updateValue(
                  "titleEn",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "الرابط المختصر"
                : "Slug"}
            </span>

            <input
              className="nr-input"
              value={values.slug}
              onChange={(event) =>
                updateValue(
                  "slug",
                  event.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, ""),
                )
              }
              placeholder="ramadan-umrah"
              required
            />
          </label>
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>02</span>

          <div>
            <h3>
              {isArabic
                ? "المحتوى والوصف"
                : "Content and Description"}
            </h3>

            <p>
              {isArabic
                ? "أضف ملخصًا قصيرًا ووصفًا تفصيليًا للبرنامج."
                : "Add a short summary and a detailed program description."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>
              {isArabic
                ? "الملخص بالعربية"
                : "Arabic Summary"}
            </span>

            <textarea
              className="nr-input"
              rows={4}
              value={values.summaryAr}
              onChange={(event) =>
                updateValue(
                  "summaryAr",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "الملخص بالإنجليزية"
                : "English Summary"}
            </span>

            <textarea
              className="nr-input"
              rows={4}
              value={values.summaryEn}
              onChange={(event) =>
                updateValue(
                  "summaryEn",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "الوصف بالعربية"
                : "Arabic Description"}
            </span>

            <textarea
              className="nr-input"
              rows={7}
              value={values.descriptionAr}
              onChange={(event) =>
                updateValue(
                  "descriptionAr",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "الوصف بالإنجليزية"
                : "English Description"}
            </span>

            <textarea
              className="nr-input"
              rows={7}
              value={values.descriptionEn}
              onChange={(event) =>
                updateValue(
                  "descriptionEn",
                  event.target.value,
                )
              }
              required
            />
          </label>
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>03</span>

          <div>
            <h3>
              {isArabic
                ? "تفاصيل البرنامج"
                : "Program Details"}
            </h3>

            <p>
              {isArabic
                ? "حدد الدولة والمدة والسعر الأساسي."
                : "Select the country, duration and base price."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>
              {isArabic ? "الدولة" : "Country"}
            </span>

            <select
              className="nr-input"
              value={values.countryId}
              onChange={(event) =>
                setValues((current) => ({ ...current, countryId: event.target.value,
                  departures: current.departures.map((row) => ({ ...row, originCityId: "" })) }))
              }
              required
            >
              <option value="">
                {isArabic
                  ? "اختر الدولة"
                  : "Select a country"}
              </option>

              {countries.map((country) => (
                <option
                  key={country.id}
                  value={country.id}
                >
                  {isArabic
                    ? country.nameAr
                    : country.nameEn}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>
              {isArabic
                ? "عدد الأيام"
                : "Duration in Days"}
            </span>

            <input
              className="nr-input"
              type="number"
              min={1}
              value={values.durationDays}
              onChange={(event) =>
                updateValue(
                  "durationDays",
                  Number(event.target.value),
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "عدد الليالي"
                : "Duration in Nights"}
            </span>

            <input
              className="nr-input"
              type="number"
              min={0}
              value={values.durationNights}
              onChange={(event) =>
                updateValue(
                  "durationNights",
                  Number(event.target.value),
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "السعر الأساسي"
                : "Base Price"}
            </span>

            <input
              className="nr-input"
              type="number"
              min={0}
              step="0.01"
              value={values.basePrice}
              onChange={(event) =>
                updateValue(
                  "basePrice",
                  Number(event.target.value),
                )
              }
              required
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "رمز العملة"
                : "Currency Code"}
            </span>

            <input
              className="nr-input"
              maxLength={3}
              value={values.currencyCode}
              onChange={(event) =>
                updateValue(
                  "currencyCode",
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 3),
                )
              }
              placeholder="SAR"
              required
            />
          </label>
        </div>
      </section>

      {isCreating && <DepartureFields
        countryId={values.countryId}
        cities={citiesQuery.data ?? []}
        loading={citiesQuery.isLoading}
        failed={citiesQuery.isError}
        onRetry={() => void citiesQuery.refetch()}
        rows={values.departures}
        onChange={(rows) => updateValue("departures", rows)}
        disabled={isSubmitting}
        isArabic={isArabic}
      />}

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading nr-program-hotel-heading">
          <span>04</span>

          <div>
            <h3>
              {isArabic
                ? "الإقامة والفنادق"
                : "Hotels & Accommodation"}
            </h3>

            <p>
              {isArabic
                ? "أضف فندقًا أو أكثر وحدد تفاصيل الإقامة."
                : "Add one or more hotels and accommodation details."}
            </p>
          </div>

          <button
            type="button"
            className="nr-program-add-hotel"
            onClick={addHotel}
          >
            {isArabic
              ? "+ إضافة فندق"
              : "+ Add Hotel"}
          </button>
        </div>

        {values.hotels.length === 0 ? (
          <div className="nr-program-hotels-empty">
            {isArabic
              ? "لا توجد فنادق مرتبطة بالبرنامج."
              : "No hotels linked to this program."}
          </div>
        ) : (
          <div className="nr-program-hotels-list">
            {values.hotels.map(
              (hotel: ProgramHotelFormValue, index: number) => (
                <article
                  key={`${hotel.hotelId || "new"}-${index}`}
                  className="nr-program-hotel-card"
                >
                  <div className="nr-program-hotel-card-header">
                    <strong>
                      {isArabic
                        ? `الإقامة ${index + 1}`
                        : `Accommodation ${index + 1}`}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeHotel(index)
                      }
                    >
                      {isArabic
                        ? "إزالة"
                        : "Remove"}
                    </button>
                  </div>

                  <div className="nr-country-form-grid">
                    <label>
                      <span>
                        {isArabic
                          ? "الفندق"
                          : "Hotel"}
                      </span>

                      <select
                        className="nr-input"
                        value={hotel.hotelId}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "hotelId",
                            event.target.value,
                          )
                        }
                        required
                      >
                        <option value="">
                          {isArabic
                            ? "اختر الفندق"
                            : "Select Hotel"}
                        </option>

                        {hotels.map((option) => {
                          const usedElsewhere =
                            values.hotels.some(
                              (entry: ProgramHotelFormValue, entryIndex: number) =>
                                entryIndex !== index &&
                                entry.hotelId === option.id,
                            );

                          const displayName =
                            isArabic
                              ? `${option.nameAr}${
                                  option.cityAr
                                    ? ` — ${option.cityAr}`
                                    : ""
                                }`
                              : `${option.nameEn}${
                                  option.cityEn
                                    ? ` — ${option.cityEn}`
                                    : ""
                                }`;

                          return (
                            <option
                              key={option.id}
                              value={option.id}
                              disabled={usedElsewhere}
                            >
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "عدد الليالي"
                          : "Nights"}
                      </span>

                      <input
                        className="nr-input"
                        type="number"
                        min={0}
                        value={hotel.nights}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "nights",
                            Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نوع الغرفة بالعربية"
                          : "Room Type Arabic"}
                      </span>

                      <input
                        className="nr-input"
                        value={hotel.roomTypeAr}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "roomTypeAr",
                            event.target.value,
                          )
                        }
                        placeholder="غرفة مزدوجة"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نوع الغرفة بالإنجليزية"
                          : "Room Type English"}
                      </span>

                      <input
                        className="nr-input"
                        value={hotel.roomTypeEn}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "roomTypeEn",
                            event.target.value,
                          )
                        }
                        placeholder="Double Room"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "الوجبات بالعربية"
                          : "Meal Plan Arabic"}
                      </span>

                      <input
                        className="nr-input"
                        value={hotel.mealPlanAr}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "mealPlanAr",
                            event.target.value,
                          )
                        }
                        placeholder="إفطار شامل"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "الوجبات بالإنجليزية"
                          : "Meal Plan English"}
                      </span>

                      <input
                        className="nr-input"
                        value={hotel.mealPlanEn}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "mealPlanEn",
                            event.target.value,
                          )
                        }
                        placeholder="Breakfast Included"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "تاريخ الدخول"
                          : "Check-in"}
                      </span>

                      <input
                        className="nr-input"
                        type="date"
                        value={hotel.checkInDate}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "checkInDate",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "تاريخ الخروج"
                          : "Check-out"}
                      </span>

                      <input
                        className="nr-input"
                        type="date"
                        min={hotel.checkInDate || undefined}
                        value={hotel.checkOutDate}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "checkOutDate",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات بالعربية"
                          : "Arabic Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={hotel.notesAr}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "notesAr",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات بالإنجليزية"
                          : "English Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={hotel.notesEn}
                        onChange={(event) =>
                          updateHotel(
                            index,
                            "notesEn",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                </article>
              ),
            )}
          </div>
        )}

        {hotels.length === 0 ? (
          <p className="nr-program-hotels-warning">
            {isArabic
              ? "لا توجد فنادق متاحة في القائمة. تأكد من إضافة فندق مفعّل في وحدة الفنادق وربط القائمة من صفحة البرامج."
              : "No hotels are available. Add an active hotel and pass the hotels list from the programs page."}
          </p>
        ) : null}
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>05</span>

          <div>
            <h3>
              {isArabic
                ? "إعدادات الطيران"
                : "Flight Settings"}
            </h3>

            <p>
              {isArabic
                ? "حدد ما إذا كان الطيران مشمولًا أو غير مشمول أو يتم تسعيره حسب السعر المتاح وقت الحجز."
                : "Choose whether flights are included, excluded, or dynamically priced at booking time."}
            </p>
          </div>
        </div>

        <div className="nr-flight-inclusion-grid">
          {[
            {
              value: "included" as const,
              titleAr: "الطيران مشمول",
              titleEn: "Flight Included",
              textAr: "تكلفة الطيران داخلة ضمن سعر البرنامج الأساسي.",
              textEn: "Flight cost is included in the program base price.",
            },
            {
              value: "excluded" as const,
              titleAr: "الطيران غير مشمول",
              titleEn: "Flight Not Included",
              textAr: "سعر البرنامج لا يتضمن تذاكر الطيران.",
              textEn: "The program price does not include flight tickets.",
            },
            {
              value: "dynamic" as const,
              titleAr: "السعر حسب وقت الحجز",
              titleEn: "Dynamic at Booking",
              textAr: "يتم تحديد سعر الطيران حسب السعر والتوفر وقت الحجز.",
              textEn: "Flight price is determined by price and availability at booking time.",
            },
          ].map((option) => (
            <label
              key={option.value}
              className={`nr-flight-inclusion-option ${
                values.flightInclusion === option.value
                  ? "is-selected"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="flightInclusion"
                value={option.value}
                checked={values.flightInclusion === option.value}
                onChange={() =>
                  updateValue(
                    "flightInclusion",
                    option.value,
                  )
                }
              />

              <strong>
                {isArabic
                  ? option.titleAr
                  : option.titleEn}
              </strong>

              <span>
                {isArabic
                  ? option.textAr
                  : option.textEn}
              </span>
            </label>
          ))}
        </div>

        {values.flightInclusion === "dynamic" ? (
          <div className="nr-flight-dynamic-note">
            <strong>
              {isArabic
                ? "التسعير الديناميكي"
                : "Dynamic Pricing"}
            </strong>

            <span>
              {isArabic
                ? "لا يتم حفظ سعر ثابت للطيران، ويحدد السعر النهائي وقت الحجز."
                : "No fixed flight price is stored; the final price is determined at booking time."}
            </span>
          </div>
        ) : null}

        <div className="nr-country-form-grid">
          <label>
            <span>
              {isArabic
                ? "ملاحظة الطيران بالعربية"
                : "Arabic Flight Note"}
            </span>

            <textarea
              className="nr-input"
              rows={4}
              value={values.flightNotesAr}
              onChange={(event) =>
                updateValue(
                  "flightNotesAr",
                  event.target.value,
                )
              }
              placeholder="سعر الطيران يحدد حسب السعر المتاح وقت الحجز."
            />
          </label>

          <label>
            <span>
              {isArabic
                ? "ملاحظة الطيران بالإنجليزية"
                : "English Flight Note"}
            </span>

            <textarea
              className="nr-input"
              rows={4}
              value={values.flightNotesEn}
              onChange={(event) =>
                updateValue(
                  "flightNotesEn",
                  event.target.value,
                )
              }
              placeholder="Flight price is determined by availability at booking time."
            />
          </label>
        </div>
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading nr-program-flight-heading">
          <span>06</span>

          <div>
            <h3>
              {isArabic ? "تفاصيل الرحلات" : "Flight Details"}
            </h3>

            <p>
              {isArabic
                ? "أضف رحلة ذهاب أو عودة وحدد شركة الطيران والمطارات والمواعيد والترانزيت والأمتعة."
                : "Add outbound or return flights with airline, airports, timing, transit and baggage details."}
            </p>
          </div>

          <button
            type="button"
            className="nr-program-add-flight"
            onClick={addFlight}
          >
            {isArabic ? "+ إضافة رحلة" : "+ Add Flight"}
          </button>
        </div>

        {values.flights.length === 0 ? (
          <div className="nr-program-flights-empty">
            {isArabic
              ? "لا توجد رحلات مرتبطة بالبرنامج."
              : "No flights linked to this program."}
          </div>
        ) : (
          <div className="nr-program-flights-list">
            {values.flights.map((flight: ProgramFlightFormValue, index: number) => (
              <article
                key={`${flight.direction}-${flight.flightNumber || "new"}-${index}`}
                className="nr-program-flight-card"
              >
                <div className="nr-program-flight-card-header">
                  <div>
                    <strong>
                      {isArabic ? `الرحلة ${index + 1}` : `Flight ${index + 1}`}
                    </strong>

                    <span
                      className={`nr-program-flight-direction ${
                        flight.direction === "outbound"
                          ? "is-outbound"
                          : "is-return"
                      }`}
                    >
                      {flight.direction === "outbound"
                        ? isArabic ? "ذهاب" : "Outbound"
                        : isArabic ? "عودة" : "Return"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFlight(index)}
                  >
                    {isArabic ? "إزالة" : "Remove"}
                  </button>
                </div>

                <div className="nr-country-form-grid">
                  <label>
                    <span>{isArabic ? "اتجاه الرحلة" : "Flight Direction"}</span>
                    <select
                      className="nr-input"
                      value={flight.direction}
                      onChange={(event) =>
                        updateFlight(
                          index,
                          "direction",
                          event.target.value as ProgramFlightFormValue["direction"],
                        )
                      }
                    >
                      <option value="outbound">{isArabic ? "ذهاب" : "Outbound"}</option>
                      <option value="return">{isArabic ? "عودة" : "Return"}</option>
                    </select>
                  </label>

                  <label>
                    <span>{isArabic ? "نوع الرحلة" : "Flight Type"}</span>
                    <select
                      className="nr-input"
                      value={flight.flightType}
                      onChange={(event) =>
                        updateFlight(
                          index,
                          "flightType",
                          event.target.value as ProgramFlightFormValue["flightType"],
                        )
                      }
                    >
                      <option value="direct">{isArabic ? "مباشر" : "Direct"}</option>
                      <option value="transit">{isArabic ? "ترانزيت" : "Transit"}</option>
                    </select>
                  </label>

                  <label>
                    <span>{isArabic ? "شركة الطيران بالعربية" : "Airline Arabic"}</span>
                    <input
                      className="nr-input"
                      value={flight.airlineNameAr}
                      onChange={(event) =>
                        updateFlight(index, "airlineNameAr", event.target.value)
                      }
                      placeholder="الخطوط السعودية"
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "شركة الطيران بالإنجليزية" : "Airline English"}</span>
                    <input
                      className="nr-input"
                      value={flight.airlineNameEn}
                      onChange={(event) =>
                        updateFlight(index, "airlineNameEn", event.target.value)
                      }
                      placeholder="Saudia"
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "رقم الرحلة" : "Flight Number"}</span>
                    <input
                      className="nr-input"
                      value={flight.flightNumber}
                      onChange={(event) =>
                        updateFlight(
                          index,
                          "flightNumber",
                          event.target.value.toUpperCase(),
                        )
                      }
                      placeholder="SV123"
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "مطار المغادرة بالعربية" : "Departure Airport Arabic"}</span>
                    <input
                      className="nr-input"
                      value={flight.departureAirportAr}
                      onChange={(event) =>
                        updateFlight(index, "departureAirportAr", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "مطار المغادرة بالإنجليزية" : "Departure Airport English"}</span>
                    <input
                      className="nr-input"
                      value={flight.departureAirportEn}
                      onChange={(event) =>
                        updateFlight(index, "departureAirportEn", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "مطار الوصول بالعربية" : "Arrival Airport Arabic"}</span>
                    <input
                      className="nr-input"
                      value={flight.arrivalAirportAr}
                      onChange={(event) =>
                        updateFlight(index, "arrivalAirportAr", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "مطار الوصول بالإنجليزية" : "Arrival Airport English"}</span>
                    <input
                      className="nr-input"
                      value={flight.arrivalAirportEn}
                      onChange={(event) =>
                        updateFlight(index, "arrivalAirportEn", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "موعد الإقلاع" : "Departure Date & Time"}</span>
                    <input
                      className="nr-input"
                      type="datetime-local"
                      value={flight.departureAt}
                      onChange={(event) =>
                        updateFlight(index, "departureAt", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "موعد الوصول" : "Arrival Date & Time"}</span>
                    <input
                      className="nr-input"
                      type="datetime-local"
                      min={flight.departureAt || undefined}
                      value={flight.arrivalAt}
                      onChange={(event) =>
                        updateFlight(index, "arrivalAt", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "الدرجة بالعربية" : "Cabin Class Arabic"}</span>
                    <input
                      className="nr-input"
                      value={flight.cabinClassAr}
                      onChange={(event) =>
                        updateFlight(index, "cabinClassAr", event.target.value)
                      }
                      placeholder="اقتصادية"
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "الدرجة بالإنجليزية" : "Cabin Class English"}</span>
                    <input
                      className="nr-input"
                      value={flight.cabinClassEn}
                      onChange={(event) =>
                        updateFlight(index, "cabinClassEn", event.target.value)
                      }
                      placeholder="Economy"
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "وزن الأمتعة (كجم)" : "Baggage Allowance (kg)"}</span>
                    <input
                      className="nr-input"
                      type="number"
                      min={0}
                      value={flight.baggageAllowanceKg}
                      onChange={(event) =>
                        updateFlight(
                          index,
                          "baggageAllowanceKg",
                          Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                    />
                  </label>
                </div>

                {flight.flightType === "transit" ? (
                  <div className="nr-program-transit-box">
                    <strong>{isArabic ? "تفاصيل الترانزيت" : "Transit Details"}</strong>

                    <div className="nr-country-form-grid">
                      <label>
                        <span>{isArabic ? "مطار الترانزيت بالعربية" : "Transit Airport Arabic"}</span>
                        <input
                          className="nr-input"
                          value={flight.transitAirportAr}
                          onChange={(event) =>
                            updateFlight(index, "transitAirportAr", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        <span>{isArabic ? "مطار الترانزيت بالإنجليزية" : "Transit Airport English"}</span>
                        <input
                          className="nr-input"
                          value={flight.transitAirportEn}
                          onChange={(event) =>
                            updateFlight(index, "transitAirportEn", event.target.value)
                          }
                        />
                      </label>

                      <label>
                        <span>{isArabic ? "مدة الترانزيت بالدقائق" : "Transit Duration (minutes)"}</span>
                        <input
                          className="nr-input"
                          type="number"
                          min={0}
                          value={flight.transitDurationMinutes}
                          onChange={(event) =>
                            updateFlight(
                              index,
                              "transitDurationMinutes",
                              Math.max(0, Number(event.target.value) || 0),
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="nr-country-form-grid nr-program-flight-notes">
                  <label>
                    <span>{isArabic ? "ملاحظات الرحلة بالعربية" : "Arabic Flight Notes"}</span>
                    <textarea
                      className="nr-input"
                      rows={3}
                      value={flight.notesAr}
                      onChange={(event) =>
                        updateFlight(index, "notesAr", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    <span>{isArabic ? "ملاحظات الرحلة بالإنجليزية" : "English Flight Notes"}</span>
                    <textarea
                      className="nr-input"
                      rows={3}
                      value={flight.notesEn}
                      onChange={(event) =>
                        updateFlight(index, "notesEn", event.target.value)
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading nr-program-transport-heading">
          <span>07</span>

          <div>
            <h3>
              {isArabic
                ? "النقل والمواصلات"
                : "Transport & Transfers"}
            </h3>

            <p>
              {isArabic
                ? "اربط البرنامج بخدمات النقل وحدد اليوم ونقطة الاستلام والوصول والوقت والمدة."
                : "Link transport services to the program and define day, pickup, drop-off, time, and duration."}
            </p>
          </div>

          <button
            type="button"
            className="nr-program-add-transport"
            onClick={addTransport}
          >
            {isArabic
              ? "+ إضافة نقل"
              : "+ Add Transport"}
          </button>
        </div>

        {values.transports.length === 0 ? (
          <div className="nr-program-transports-empty">
            {isArabic
              ? "لا توجد خدمات نقل مرتبطة بالبرنامج."
              : "No transport services linked to this program."}
          </div>
        ) : (
          <div className="nr-program-transports-list">
            {values.transports.map((transport: ProgramTransportFormValue, index: number) => {
              const selectedTransport =
                transports.find(
                  (option) =>
                    option.id === transport.transportId,
                );

              return (
                <article
                  key={`${transport.transportId || "new"}-${index}`}
                  className="nr-program-transport-card"
                >
                  <div className="nr-program-transport-card-header">
                    <div>
                      <strong>
                        {isArabic
                          ? `النقل ${index + 1}`
                          : `Transport ${index + 1}`}
                      </strong>

                      {selectedTransport ? (
                        <span className="nr-program-transport-badge">
                          {isArabic
                            ? selectedTransport.nameAr
                            : selectedTransport.nameEn}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeTransport(index)
                      }
                    >
                      {isArabic
                        ? "إزالة"
                        : "Remove"}
                    </button>
                  </div>

                  <div className="nr-country-form-grid">
                    <label>
                      <span>
                        {isArabic
                          ? "خدمة النقل"
                          : "Transport Service"}
                      </span>

                      <select
                        className="nr-input"
                        value={transport.transportId}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "transportId",
                            event.target.value,
                          )
                        }
                        required
                      >
                        <option value="">
                          {isArabic
                            ? "اختر خدمة النقل"
                            : "Select transport"}
                        </option>

                        {transports.map((option) => (
                          <option
                            key={option.id}
                            value={option.id}
                          >
                            {isArabic
                              ? `${option.nameAr} — ${option.capacity} راكب`
                              : `${option.nameEn} — ${option.capacity} passengers`}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "اليوم داخل البرنامج"
                          : "Program Day"}
                      </span>

                      <input
                        className="nr-input"
                        type="number"
                        min={1}
                        value={transport.dayNumber ?? ""}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "dayNumber",
                            event.target.value
                              ? Math.max(
                                  1,
                                  Number(event.target.value) || 1,
                                )
                              : null,
                          )
                        }
                        placeholder="1"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نقطة الاستلام بالعربية"
                          : "Pickup Arabic"}
                      </span>

                      <input
                        className="nr-input"
                        value={transport.pickupNameAr}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "pickupNameAr",
                            event.target.value,
                          )
                        }
                        placeholder="مطار الملك عبدالعزيز"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نقطة الاستلام بالإنجليزية"
                          : "Pickup English"}
                      </span>

                      <input
                        className="nr-input"
                        value={transport.pickupNameEn}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "pickupNameEn",
                            event.target.value,
                          )
                        }
                        placeholder="King Abdulaziz Airport"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نقطة الوصول بالعربية"
                          : "Drop-off Arabic"}
                      </span>

                      <input
                        className="nr-input"
                        value={transport.dropoffNameAr}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "dropoffNameAr",
                            event.target.value,
                          )
                        }
                        placeholder="فندق مكة"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "نقطة الوصول بالإنجليزية"
                          : "Drop-off English"}
                      </span>

                      <input
                        className="nr-input"
                        value={transport.dropoffNameEn}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "dropoffNameEn",
                            event.target.value,
                          )
                        }
                        placeholder="Makkah Hotel"
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "موعد الاستلام"
                          : "Pickup Date & Time"}
                      </span>

                      <input
                        className="nr-input"
                        type="datetime-local"
                        value={transport.pickupDatetime}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "pickupDatetime",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "المدة التقديرية بالدقائق"
                          : "Estimated Duration (minutes)"}
                      </span>

                      <input
                        className="nr-input"
                        type="number"
                        min={0}
                        value={
                          transport.estimatedDurationMinutes ??
                          ""
                        }
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "estimatedDurationMinutes",
                            event.target.value
                              ? Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                )
                              : null,
                          )
                        }
                        placeholder="90"
                      />
                    </label>
                  </div>

                  {selectedTransport ? (
                    <div className="nr-program-transport-summary">
                      <span>
                        {isArabic
                          ? "النوع"
                          : "Type"}
                        <strong>
                          {selectedTransport.serviceType}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "النمط"
                          : "Mode"}
                        <strong>
                          {selectedTransport.mode === "private"
                            ? isArabic
                              ? "خاص"
                              : "Private"
                            : isArabic
                              ? "مشترك"
                              : "Shared"}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "المركبة"
                          : "Vehicle"}
                        <strong>
                          {isArabic
                            ? selectedTransport.vehicleNameAr ||
                              selectedTransport.vehicleType
                            : selectedTransport.vehicleNameEn ||
                              selectedTransport.vehicleType}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "السعة"
                          : "Capacity"}
                        <strong>
                          {selectedTransport.capacity}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  <div className="nr-country-form-grid nr-program-transport-notes">
                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات النقل بالعربية"
                          : "Arabic Transport Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={transport.notesAr}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "notesAr",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات النقل بالإنجليزية"
                          : "English Transport Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={transport.notesEn}
                        onChange={(event) =>
                          updateTransport(
                            index,
                            "notesEn",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="nr-country-form-checkbox nr-program-transport-included">
                    <input
                      type="checkbox"
                      checked={transport.isIncluded}
                      onChange={(event) =>
                        updateTransport(
                          index,
                          "isIncluded",
                          event.target.checked,
                        )
                      }
                    />

                    <span>
                      {isArabic
                        ? "خدمة النقل مشمولة ضمن البرنامج"
                        : "Transport is included in the program"}
                    </span>
                  </label>
                </article>
              );
            })}
          </div>
        )}

        {transports.length === 0 ? (
          <p className="nr-program-transports-warning">
            {isArabic
              ? "لا توجد خدمات نقل متاحة. أضف خدمة نقل مفعّلة من وحدة النقل أولًا."
              : "No transport services are available. Add an active transport service first."}
          </p>
        ) : null}
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading nr-program-visa-heading">
          <span>08</span>

          <div>
            <h3>
              {isArabic
                ? "التأشيرات"
                : "Visas"}
            </h3>

            <p>
              {isArabic
                ? "اربط البرنامج بخدمات التأشيرات وحدد ما إذا كانت مشمولة وأضف الملاحظات."
                : "Link visa services to the program, choose inclusion, and add notes."}
            </p>
          </div>

          <button
            type="button"
            className="nr-program-add-visa"
            onClick={addVisa}
          >
            {isArabic
              ? "+ إضافة تأشيرة"
              : "+ Add Visa"}
          </button>
        </div>

        {values.visas.length === 0 ? (
          <div className="nr-program-visas-empty">
            {isArabic
              ? "لا توجد تأشيرات مرتبطة بالبرنامج."
              : "No visas linked to this program."}
          </div>
        ) : (
          <div className="nr-program-visas-list">
            {values.visas.map((visa: ProgramVisaFormValue, index: number) => {
              const selectedVisa =
                visas.find(
                  (option) =>
                    option.id === visa.visaId,
                );

              return (
                <article
                  key={`${visa.visaId || "new"}-${index}`}
                  className="nr-program-visa-card"
                >
                  <div className="nr-program-visa-card-header">
                    <div>
                      <strong>
                        {isArabic
                          ? `التأشيرة ${index + 1}`
                          : `Visa ${index + 1}`}
                      </strong>

                      {selectedVisa ? (
                        <span className="nr-program-visa-badge">
                          {isArabic
                            ? selectedVisa.nameAr
                            : selectedVisa.nameEn}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeVisa(index)
                      }
                    >
                      {isArabic
                        ? "إزالة"
                        : "Remove"}
                    </button>
                  </div>

                  <div className="nr-country-form-grid">
                    <label>
                      <span>
                        {isArabic
                          ? "خدمة التأشيرة"
                          : "Visa Service"}
                      </span>

                      <select
                        className="nr-input"
                        value={visa.visaId}
                        onChange={(event) =>
                          updateVisa(
                            index,
                            "visaId",
                            event.target.value,
                          )
                        }
                        required
                      >
                        <option value="">
                          {isArabic
                            ? "اختر التأشيرة"
                            : "Select visa"}
                        </option>

                        {visas.map((option) => {
                          const usedElsewhere =
                            values.visas.some(
                              (entry: ProgramVisaFormValue, entryIndex: number) =>
                                entryIndex !== index &&
                                entry.visaId === option.id,
                            );

                          return (
                            <option
                              key={option.id}
                              value={option.id}
                              disabled={usedElsewhere}
                            >
                              {isArabic
                                ? option.nameAr
                                : option.nameEn}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>

                  {selectedVisa ? (
                    <div className="nr-program-visa-summary">
                      <span>
                        {isArabic
                          ? "النوع"
                          : "Type"}
                        <strong>
                          {selectedVisa.visaType}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "المعالجة"
                          : "Processing"}
                        <strong>
                          {selectedVisa.processingType}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "مدة المعالجة"
                          : "Processing Time"}
                        <strong>
                          {selectedVisa.processingTimeDays !== null
                            ? isArabic
                              ? `${selectedVisa.processingTimeDays} يوم`
                              : `${selectedVisa.processingTimeDays} days`
                            : "—"}
                        </strong>
                      </span>

                      <span>
                        {isArabic
                          ? "الصلاحية"
                          : "Validity"}
                        <strong>
                          {selectedVisa.validityDays !== null
                            ? isArabic
                              ? `${selectedVisa.validityDays} يوم`
                              : `${selectedVisa.validityDays} days`
                            : "—"}
                        </strong>
                      </span>
                    </div>
                  ) : null}

                  <div className="nr-country-form-grid nr-program-visa-notes">
                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات التأشيرة بالعربية"
                          : "Arabic Visa Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={visa.notesAr}
                        onChange={(event) =>
                          updateVisa(
                            index,
                            "notesAr",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>
                        {isArabic
                          ? "ملاحظات التأشيرة بالإنجليزية"
                          : "English Visa Notes"}
                      </span>

                      <textarea
                        className="nr-input"
                        rows={3}
                        value={visa.notesEn}
                        onChange={(event) =>
                          updateVisa(
                            index,
                            "notesEn",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="nr-country-form-checkbox nr-program-visa-included">
                    <input
                      type="checkbox"
                      checked={visa.isIncluded}
                      onChange={(event) =>
                        updateVisa(
                          index,
                          "isIncluded",
                          event.target.checked,
                        )
                      }
                    />

                    <span>
                      {isArabic
                        ? "التأشيرة مشمولة ضمن البرنامج"
                        : "Visa is included in the program"}
                    </span>
                  </label>
                </article>
              );
            })}
          </div>
        )}

        {visas.length === 0 ? (
          <p className="nr-program-visas-warning">
            {isArabic
              ? "لا توجد تأشيرات متاحة. أضف تأشيرة مفعّلة من وحدة التأشيرات أولًا."
              : "No visa services are available. Add an active visa service first."}
          </p>
        ) : null}
      </section>

      <section className="nr-country-form-section">
        <div className="nr-country-form-section-heading">
          <span>09</span>

          <div>
            <h3>
              {isArabic
                ? "إعدادات النشر"
                : "Publishing Settings"}
            </h3>

            <p>
              {isArabic
                ? "حدد حالة البرنامج وظهوره داخل المنصة."
                : "Control the program status and visibility."}
            </p>
          </div>
        </div>

        <div className="nr-country-form-grid">
          <label>
            <span>
              {isArabic
                ? "حالة البرنامج"
                : "Program Status"}
            </span>

            <select
              className="nr-input"
              value={values.status}
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target.value as ProgramStatus,
                )
              }
              required
            >
              <option value="draft">
                {isArabic ? "مسودة" : "Draft"}
              </option>

              <option value="published">
                {isArabic
                  ? "منشور"
                  : "Published"}
              </option>

              <option value="inactive">
                {isArabic
                  ? "غير نشط"
                  : "Inactive"}
              </option>
            </select>
          </label>

          <label>
            <span>
              {isArabic
                ? "ترتيب الظهور"
                : "Display Order"}
            </span>

            <input
              className="nr-input"
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(event) =>
                updateValue(
                  "sortOrder",
                  Math.max(
                    0,
                    Number(event.target.value) || 0,
                  ),
                )
              }
              required
            />
          </label>
        </div>

        <div className="nr-program-form-options">
          <label className="nr-country-form-checkbox">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) =>
                updateValue(
                  "isActive",
                  event.target.checked,
                )
              }
            />

            <span>
              {isArabic
                ? "البرنامج نشط ومتاح للعرض"
                : "Program is active and visible"}
            </span>
          </label>

          <label className="nr-country-form-checkbox">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(event) =>
                updateValue(
                  "isFeatured",
                  event.target.checked,
                )
              }
            />

            <span>
              {isArabic
                ? "برنامج مميز"
                : "Featured Program"}
            </span>
          </label>
        </div>
      </section>

      <div className="nr-country-form-actions">
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : isArabic
              ? "حفظ البرنامج"
              : "Save Program"}
        </Button>
      </div>

      <style jsx>{`
        .nr-program-hotel-heading {
          align-items: flex-start;
        }

        .nr-program-hotel-heading > div {
          flex: 1;
        }

        .nr-program-add-hotel {
          flex: 0 0 auto;
          min-height: 40px;
          padding-inline: 15px;
          border: 0;
          border-radius: 11px;
          color: #fff;
          background: var(--nour-primary);
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .nr-program-hotels-list {
          display: grid;
          gap: 15px;
        }

        .nr-program-hotels-empty {
          padding: 22px;
          border: 1px dashed var(--nour-border);
          border-radius: 14px;
          color: #7c899c;
          text-align: center;
        }

        .nr-program-hotel-card {
          padding: 17px;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-background);
        }

        .nr-program-hotel-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .nr-program-hotel-card-header strong {
          color: var(--nour-text-primary);
        }

        .nr-program-hotel-card-header button {
          min-height: 32px;
          padding-inline: 10px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-program-hotels-warning {
          margin: 12px 0 0;
          color: #d97706;
          font-size: 11px;
          line-height: 1.7;
        }

        .nr-flight-inclusion-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .nr-flight-inclusion-option {
          display: flex;
          min-height: 128px;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border: 1px solid var(--nour-border);
          border-radius: 14px;
          background: var(--nour-background);
          cursor: pointer;
        }

        .nr-flight-inclusion-option.is-selected {
          border-color: var(--nour-primary);
          box-shadow: 0 0 0 3px rgba(23, 111, 232, 0.08);
        }

        .nr-flight-inclusion-option input {
          width: 17px;
          height: 17px;
          accent-color: var(--nour-primary);
        }

        .nr-flight-inclusion-option strong {
          color: var(--nour-text-primary);
          font-size: 13px;
        }

        .nr-flight-inclusion-option span {
          color: #7c899c;
          font-size: 11px;
          line-height: 1.7;
        }

        .nr-flight-dynamic-note {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 18px;
          padding: 13px 15px;
          border: 1px solid rgba(23, 111, 232, 0.16);
          border-radius: 12px;
          background: rgba(23, 111, 232, 0.05);
        }

        .nr-flight-dynamic-note strong {
          color: var(--nour-primary);
          font-size: 11px;
        }

        .nr-flight-dynamic-note span {
          color: #6f7e92;
          font-size: 11px;
          line-height: 1.7;
        }

        .nr-program-flight-heading {
          align-items: flex-start;
        }

        .nr-program-flight-heading > div {
          flex: 1;
        }

        .nr-program-add-flight {
          flex: 0 0 auto;
          min-height: 40px;
          padding-inline: 15px;
          border: 0;
          border-radius: 11px;
          color: #fff;
          background: var(--nour-primary);
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .nr-program-flights-empty {
          padding: 22px;
          border: 1px dashed var(--nour-border);
          border-radius: 14px;
          color: #7c899c;
          text-align: center;
        }

        .nr-program-flights-list {
          display: grid;
          gap: 15px;
        }

        .nr-program-flight-card {
          padding: 17px;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-background);
        }

        .nr-program-flight-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .nr-program-flight-card-header > div {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nr-program-flight-card-header button {
          min-height: 32px;
          padding-inline: 10px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-program-flight-direction {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-flight-direction.is-outbound {
          color: #176fe8;
          background: rgba(23, 111, 232, 0.08);
        }

        .nr-program-flight-direction.is-return {
          color: #7c3aed;
          background: rgba(124, 58, 237, 0.08);
        }

        .nr-program-transit-box {
          margin-top: 16px;
          padding: 15px;
          border: 1px dashed rgba(217, 119, 6, 0.28);
          border-radius: 13px;
          background: rgba(245, 158, 11, 0.05);
        }

        .nr-program-transit-box > strong {
          display: block;
          margin-bottom: 12px;
          color: #b45309;
          font-size: 11px;
        }

        .nr-program-flight-notes {
          margin-top: 16px;
        }


        .nr-program-transport-heading {
          align-items: flex-start;
        }

        .nr-program-transport-heading > div {
          flex: 1;
        }

        .nr-program-add-transport {
          flex: 0 0 auto;
          min-height: 40px;
          padding-inline: 15px;
          border: 0;
          border-radius: 11px;
          color: #fff;
          background: var(--nour-primary);
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .nr-program-transports-empty {
          padding: 22px;
          border: 1px dashed var(--nour-border);
          border-radius: 14px;
          color: #7c899c;
          text-align: center;
        }

        .nr-program-transports-list {
          display: grid;
          gap: 15px;
        }

        .nr-program-transport-card {
          padding: 17px;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-background);
        }

        .nr-program-transport-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .nr-program-transport-card-header > div {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .nr-program-transport-card-header button {
          min-height: 32px;
          padding-inline: 10px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-program-transport-badge {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          color: var(--nour-primary);
          background: rgba(23, 111, 232, 0.08);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-transport-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 15px;
          padding: 13px;
          border: 1px solid rgba(23, 111, 232, 0.12);
          border-radius: 12px;
          background: rgba(23, 111, 232, 0.04);
        }

        .nr-program-transport-summary span {
          display: flex;
          flex-direction: column;
          gap: 3px;
          color: #7c899c;
          font-size: 9px;
        }

        .nr-program-transport-summary strong {
          color: var(--nour-text-primary);
          font-size: 11px;
        }

        .nr-program-transport-notes {
          margin-top: 15px;
        }

        .nr-program-transport-included {
          margin-top: 14px;
        }

        .nr-program-transports-warning {
          margin: 12px 0 0;
          color: #d97706;
          font-size: 11px;
          line-height: 1.7;
        }


        .nr-program-visa-heading {
          align-items: flex-start;
        }

        .nr-program-visa-heading > div {
          flex: 1;
        }

        .nr-program-add-visa {
          flex: 0 0 auto;
          min-height: 40px;
          padding-inline: 15px;
          border: 0;
          border-radius: 11px;
          color: #fff;
          background: var(--nour-primary);
          font: inherit;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .nr-program-visas-empty {
          padding: 22px;
          border: 1px dashed var(--nour-border);
          border-radius: 14px;
          color: #7c899c;
          text-align: center;
        }

        .nr-program-visas-list {
          display: grid;
          gap: 15px;
        }

        .nr-program-visa-card {
          padding: 17px;
          border: 1px solid var(--nour-border);
          border-radius: 16px;
          background: var(--nour-background);
        }

        .nr-program-visa-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .nr-program-visa-card-header > div {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .nr-program-visa-card-header button {
          min-height: 32px;
          padding-inline: 10px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 8px;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-program-visa-badge {
          display: inline-flex;
          min-height: 26px;
          align-items: center;
          padding-inline: 9px;
          border-radius: 999px;
          color: var(--nour-primary);
          background: rgba(23, 111, 232, 0.08);
          font-size: 10px;
          font-weight: 900;
        }

        .nr-program-visa-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 15px;
          padding: 13px;
          border: 1px solid rgba(23, 111, 232, 0.12);
          border-radius: 12px;
          background: rgba(23, 111, 232, 0.04);
        }

        .nr-program-visa-summary span {
          display: flex;
          flex-direction: column;
          gap: 3px;
          color: #7c899c;
          font-size: 9px;
        }

        .nr-program-visa-summary strong {
          color: var(--nour-text-primary);
          font-size: 11px;
        }

        .nr-program-visa-notes {
          margin-top: 15px;
        }

        .nr-program-visa-included {
          margin-top: 14px;
        }

        .nr-program-visas-warning {
          margin: 12px 0 0;
          color: #d97706;
          font-size: 11px;
          line-height: 1.7;
        }

        @media (max-width: 760px) {
          .nr-program-hotel-heading {
            flex-direction: column;
            align-items: stretch;
          }

          .nr-program-add-hotel,
          .nr-program-add-flight,
          .nr-program-add-transport,
          .nr-program-add-visa {
            width: 100%;
          }

          .nr-program-flight-heading,
          .nr-program-transport-heading,
          .nr-program-visa-heading {
            flex-direction: column;
            align-items: stretch;
          }

          .nr-program-transport-summary,
          .nr-program-visa-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .nr-flight-inclusion-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </form>
  );
}