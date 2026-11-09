import {locationLabel,loadDisplayFacts,type ProgramDisplayFacts} from "../display";
import type { SupabaseClient } from "@supabase/supabase-js";

type MediaRow = {
  id: string;
  bucket: string;
  path: string;
};

type ProgramRow = {
  is_demo: boolean;
  visa_status:import("../labels").VisaStatus;
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  summary_ar: string;
  summary_en: string;
  description_ar: string;
  description_en: string;
  country_id: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: number | string;
  currency_code: string;
  cover_media_id: string | null;
  is_featured: boolean;

  flight_inclusion:
    | "included"
    | "excluded"
    | "dynamic";

  flight_notes_ar: string | null;
  flight_notes_en: string | null;
};

type CountryRow = {
  id: string;
  name_ar: string;
  name_en: string;
};

type ProgramHotelRow = {
  id: string;
  program_id: string;
  hotel_id: string;
  nights: number;
  occupancy?:number|null;
  room_type_ar: string | null;
  room_type_en: string | null;
  meal_plan_ar: string | null;
  meal_plan_en: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  notes_ar: string | null;
  notes_en: string | null;
  sort_order: number;
};

type HotelRow = {
  id: string;
  name_ar: string;
  name_en: string;
  city_ar: string | null;
  city_en: string | null;
  stars: number;
  description_ar: string | null;
  description_en: string | null;
  address_ar: string | null;
  address_en: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  cover_media_id: string | null;
};

type HotelMediaRow = {
  id: string;
  hotel_id: string;
  media_id: string;
  is_cover: boolean;
  sort_order: number;
};

type ProgramFlightRow = {
  id: string;
  program_id: string;
  direction: "outbound" | "return";

  airline_name_ar: string | null;
  airline_name_en: string | null;

  flight_number: string | null;

  departure_airport_ar: string | null;
  departure_airport_en: string | null;

  arrival_airport_ar: string | null;
  arrival_airport_en: string | null;

  departure_at: string | null;
  arrival_at: string | null;

  flight_type: "direct" | "transit";

  transit_airport_ar: string | null;
  transit_airport_en: string | null;

  transit_duration_minutes: number | null;

  cabin_class_ar: string | null;
  cabin_class_en: string | null;

  baggage_allowance_kg: number | null;

  notes_ar: string | null;
  notes_en: string | null;

  sort_order: number;
};

export type PublicProgramFlight = {
  id: string;
  direction: "outbound" | "return";

  airlineNameAr: string;
  airlineNameEn: string;

  flightNumber: string;

  departureAirportAr: string;
  departureAirportEn: string;

  arrivalAirportAr: string;
  arrivalAirportEn: string;

  departureAt: string | null;
  arrivalAt: string | null;

  flightType: "direct" | "transit";

  transitAirportAr: string;
  transitAirportEn: string;

  transitDurationMinutes: number;

  cabinClassAr: string;
  cabinClassEn: string;

  baggageAllowanceKg: number;

  notesAr: string;
  notesEn: string;

  sortOrder: number;
};


export type PublicProgramHotel = {
  occupancy?:number|null;
  relationId: string;
  hotelId: string;

  nameAr: string;
  nameEn: string;

  cityAr: string;
  cityEn: string;

  stars: number;

  descriptionAr: string;
  descriptionEn: string;

  addressAr: string;
  addressEn: string;

  latitude: number | null;
  longitude: number | null;

  nights: number;

  roomTypeAr: string;
  roomTypeEn: string;

  mealPlanAr: string;
  mealPlanEn: string;

  checkInDate: string | null;
  checkOutDate: string | null;

  notesAr: string;
  notesEn: string;

  coverUrl: string | null;
  galleryUrls: string[];
};

export type PublicProgramDetails = {
  isDemo?: boolean;
  visaStatus?:import("../labels").VisaStatus;
  sectionErrors?:string[];
  display?:ProgramDisplayFacts;displayError?:boolean;
  id: string;

  titleAr: string;
  titleEn: string;

  slug: string;

  summaryAr: string;
  summaryEn: string;

  descriptionAr: string;
  descriptionEn: string;

  countryId: string | null;
  countryNameAr: string;
  countryNameEn: string;

  durationDays: number;
  durationNights: number;

  basePrice: number;
  currencyCode: string;

  isFeatured: boolean;

  flightInclusion:
    | "included"
    | "excluded"
    | "dynamic";

  flightNotesAr: string;
  flightNotesEn: string;

  coverUrl: string | null;

  hotels: PublicProgramHotel[];
  flights: PublicProgramFlight[];
};

function normalizeNumber(
  value: number | string | null,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function publicMediaUrl(
  supabase: SupabaseClient,
  media?: MediaRow | null,
): string | null {
  if (!media) {
    return null;
  }

  const { data } = supabase.storage
    .from(media.bucket)
    .getPublicUrl(media.path);

  return data.publicUrl || null;
}

export async function getPublicProgramBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<PublicProgramDetails | null> {
  const {
    data: programData,
    error: programError,
  } = await supabase
    .from("programs")
    .select(`
      id,
      title_ar,
      title_en,
      slug,
      summary_ar,
      summary_en,
      description_ar,
      description_en,
      is_demo,country_id,visa_status,
      duration_days,
      duration_nights,
      base_price,
      currency_code,
      cover_media_id,
      is_featured,
      flight_inclusion,
      flight_notes_ar,
      flight_notes_en
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (programError) {
    throw new Error(
      `تعذر تحميل البرنامج: ${programError.message}`,
    );
  }

  if (!programData) {
    return null;
  }

  const program = programData as ProgramRow;
  const sectionErrors:string[]=[];

  let country: CountryRow | null = null;

  if (program.country_id) {
    const {
      data: countryData,
      error: countryError,
    } = await supabase
      .from("countries")
      .select("id,name_ar,name_en")
      .eq("id", program.country_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (countryError) {
      sectionErrors.push("country");
    }

    country = countryData as CountryRow | null;
  }

  const mediaIds = new Set<string>();

  if (program.cover_media_id) {
    mediaIds.add(program.cover_media_id);
  }

  const {
    data: relationData,
    error: relationError,
  } = await supabase
    .from("program_hotels")
    .select(`
      id,
      program_id,
      hotel_id,
      nights,occupancy,
      room_type_ar,
      room_type_en,
      meal_plan_ar,
      meal_plan_en,
      check_in_date,
      check_out_date,
      notes_ar,
      notes_en,
      sort_order
    `)
    .eq("program_id", program.id)
    .order("sort_order", {
      ascending: true,
    });

  if (relationError) {
    sectionErrors.push("hotels");
  }

  const relations =
    (relationData ?? []) as ProgramHotelRow[];

  const hotelIds = [
    ...new Set(
      relations.map((item) => item.hotel_id),
    ),
  ];

  let hotelRows: HotelRow[] = [];

  if (hotelIds.length > 0) {
    const {
      data: hotelData,
      error: hotelError,
    } = await supabase
      .from("hotels")
      .select(`
        id,
        name_ar,
        name_en,
        city_ar,
        city_en,
        stars,
        description_ar,
        description_en,
        address_ar,
        address_en,
        latitude,
        longitude,
        cover_media_id
      `)
      .in("id", hotelIds)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (hotelError) {
      sectionErrors.push("hotels");
    }

    hotelRows = (hotelData ?? []) as HotelRow[];

    hotelRows.forEach((hotel) => {
      if (hotel.cover_media_id) {
        mediaIds.add(hotel.cover_media_id);
      }
    });
  }

  let hotelMediaRows: HotelMediaRow[] = [];

  if (hotelIds.length > 0) {
    const {
      data: galleryData,
      error: galleryError,
    } = await supabase
      .from("hotel_media")
      .select(`
        id,
        hotel_id,
        media_id,
        is_cover,
        sort_order
      `)
      .in("hotel_id", hotelIds)
      .order("sort_order", {
        ascending: true,
      });

    if (galleryError) {
      sectionErrors.push("media");
    }

    hotelMediaRows =
      (galleryData ?? []) as HotelMediaRow[];

    hotelMediaRows.forEach((item) => {
      mediaIds.add(item.media_id);
    });
  }

  const {
    data: flightData,
    error: flightError,
  } = await supabase
    .from("program_flights")
    .select(`
      id,
      program_id,
      direction,
      airline_name_ar,
      airline_name_en,
      flight_number,
      departure_airport_ar,
      departure_airport_en,
      arrival_airport_ar,
      arrival_airport_en,
      departure_at,
      arrival_at,
      flight_type,
      transit_airport_ar,
      transit_airport_en,
      transit_duration_minutes,
      cabin_class_ar,
      cabin_class_en,
      baggage_allowance_kg,
      notes_ar,
      notes_en,
      sort_order
    `)
    .eq("program_id", program.id)
    .order("sort_order", {
      ascending: true,
    });

  if (flightError) {
    sectionErrors.push("flights");
  }

  const flights: PublicProgramFlight[] =
    ((flightData ?? []) as ProgramFlightRow[]).map(
      (flight) => ({
        id: flight.id,
        direction: flight.direction,

        airlineNameAr:
          flight.airline_name_ar ?? "",
        airlineNameEn:
          flight.airline_name_en ?? "",

        flightNumber:
          flight.flight_number ?? "",

        departureAirportAr:
          flight.departure_airport_ar ?? "",
        departureAirportEn:
          flight.departure_airport_en ?? "",

        arrivalAirportAr:
          flight.arrival_airport_ar ?? "",
        arrivalAirportEn:
          flight.arrival_airport_en ?? "",

        departureAt:
          flight.departure_at,
        arrivalAt:
          flight.arrival_at,

        flightType:
          flight.flight_type,

        transitAirportAr:
          flight.transit_airport_ar ?? "",
        transitAirportEn:
          flight.transit_airport_en ?? "",

        transitDurationMinutes:
          flight.transit_duration_minutes ?? 0,

        cabinClassAr:
          flight.cabin_class_ar ?? "",
        cabinClassEn:
          flight.cabin_class_en ?? "",

        baggageAllowanceKg:
          flight.baggage_allowance_kg ?? 0,

        notesAr:
          flight.notes_ar ?? "",
        notesEn:
          flight.notes_en ?? "",

        sortOrder:
          flight.sort_order,
      }),
    );

  const mediaMap =
    new Map<string, MediaRow>();

  if (mediaIds.size > 0) {
    const {
      data: mediaData,
      error: mediaError,
    } = await supabase
      .from("media")
      .select("id,bucket,path")
      .in("id", [...mediaIds])
      .is("deleted_at", null);

    if (mediaError) {
      sectionErrors.push("media");
    }

    ((mediaData ?? []) as MediaRow[]).forEach(
      (media) => {
        mediaMap.set(media.id, media);
      },
    );
  }

  const hotelMap = new Map(
    hotelRows.map((hotel) => [
      hotel.id,
      hotel,
    ]),
  );

  const hotels: PublicProgramHotel[] =
    relations.flatMap((relation) => {
      const hotel =
        hotelMap.get(relation.hotel_id);

      if (!hotel) {
        return [];
      }

      const galleryUrls =
        hotelMediaRows
          .filter(
            (item) =>
              item.hotel_id === hotel.id,
          )
          .map((item) =>
            publicMediaUrl(
              supabase,
              mediaMap.get(item.media_id),
            ),
          )
          .filter(
            (url): url is string =>
              Boolean(url),
          );

      const coverUrl =
        hotel.cover_media_id
          ? publicMediaUrl(
              supabase,
              mediaMap.get(
                hotel.cover_media_id,
              ),
            )
          : galleryUrls[0] ?? null;

      return [
        {
          relationId: relation.id,
          hotelId: hotel.id,

          nameAr: hotel.name_ar,
          nameEn: hotel.name_en,

          cityAr: hotel.city_ar ?? "",
          cityEn: hotel.city_en ?? "",

          stars: hotel.stars,

          descriptionAr:
            hotel.description_ar ?? "",
          descriptionEn:
            hotel.description_en ?? "",

          addressAr:
            hotel.address_ar ?? "",
          addressEn:
            hotel.address_en ?? "",

          latitude:
            normalizeNumber(
              hotel.latitude,
            ),

          longitude:
            normalizeNumber(
              hotel.longitude,
            ),

          nights: relation.nights,occupancy:relation.occupancy,

          roomTypeAr:
            relation.room_type_ar ?? "",
          roomTypeEn:
            relation.room_type_en ?? "",

          mealPlanAr:
            relation.meal_plan_ar ?? "",
          mealPlanEn:
            relation.meal_plan_en ?? "",

          checkInDate:
            relation.check_in_date,

          checkOutDate:
            relation.check_out_date,

          notesAr:
            relation.notes_ar ?? "",
          notesEn:
            relation.notes_en ?? "",

          coverUrl,
          galleryUrls,
        },
      ];
    });

  let display:ProgramDisplayFacts|undefined;let displayError=false;try{display=(await loadDisplayFacts(supabase,[program.id])).get(program.id);}catch{displayError=true;}
  return {
    isDemo:program.is_demo,
    visaStatus:program.visa_status,display,displayError,sectionErrors,
    id: program.id,

    titleAr: program.title_ar,
    titleEn: program.title_en,

    slug: program.slug,

    summaryAr: program.summary_ar,
    summaryEn: program.summary_en,

    descriptionAr:
      program.description_ar,
    descriptionEn:
      program.description_en,

    countryId: program.country_id,

    countryNameAr:
      country?.name_ar ?? "",

    countryNameEn:
      country?.name_en ?? "",

    durationDays:
      program.duration_days,

    durationNights:
      program.duration_nights,

    basePrice:
      Number(program.base_price) || 0,

    currencyCode:
      program.currency_code,

    isFeatured:
      program.is_featured,

    flightInclusion:
      program.flight_inclusion ?? "dynamic",

    flightNotesAr:
      program.flight_notes_ar ?? "",

    flightNotesEn:
      program.flight_notes_en ?? "",

    coverUrl:
      program.cover_media_id
        ? publicMediaUrl(
            supabase,
            mediaMap.get(
              program.cover_media_id,
            ),
          )
        : null,

    hotels:hotels.sort((a,b)=>{const rank=(h:PublicProgramHotel)=>{const city=locationLabel(h.cityAr||h.cityEn,true);return city.includes('مكة')?0:city.includes('المدينة')?1:2;};return rank(a)-rank(b);}),
    flights,
  };
}
