import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ProgramFlightDirection,
  ProgramFlightFormValue,
  ProgramFlightType,
} from "../types";

export type ProgramFlight = {
  id: string;
  programId: string;

  direction: ProgramFlightDirection;

  airlineNameAr: string;
  airlineNameEn: string;

  flightNumber: string;

  departureAirportAr: string;
  departureAirportEn: string;

  arrivalAirportAr: string;
  arrivalAirportEn: string;

  departureAt: string | null;
  arrivalAt: string | null;

  flightType: ProgramFlightType;

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

type ProgramFlightRow = {
  id: string;
  program_id: string;

  direction:
    | "outbound"
    | "return";

  airline_name_ar: string | null;
  airline_name_en: string | null;

  flight_number: string | null;

  departure_airport_ar: string | null;
  departure_airport_en: string | null;

  arrival_airport_ar: string | null;
  arrival_airport_en: string | null;

  departure_at: string | null;
  arrival_at: string | null;

  flight_type:
    | "direct"
    | "transit";

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

function mapProgramFlight(
  row: ProgramFlightRow,
): ProgramFlight {
  return {
    id: row.id,
    programId: row.program_id,

    direction: row.direction,

    airlineNameAr:
      row.airline_name_ar ?? "",

    airlineNameEn:
      row.airline_name_en ?? "",

    flightNumber:
      row.flight_number ?? "",

    departureAirportAr:
      row.departure_airport_ar ?? "",

    departureAirportEn:
      row.departure_airport_en ?? "",

    arrivalAirportAr:
      row.arrival_airport_ar ?? "",

    arrivalAirportEn:
      row.arrival_airport_en ?? "",

    departureAt:
      row.departure_at,

    arrivalAt:
      row.arrival_at,

    flightType:
      row.flight_type,

    transitAirportAr:
      row.transit_airport_ar ?? "",

    transitAirportEn:
      row.transit_airport_en ?? "",

    transitDurationMinutes:
      row.transit_duration_minutes ?? 0,

    cabinClassAr:
      row.cabin_class_ar ?? "",

    cabinClassEn:
      row.cabin_class_en ?? "",

    baggageAllowanceKg:
      row.baggage_allowance_kg ?? 0,

    notesAr:
      row.notes_ar ?? "",

    notesEn:
      row.notes_en ?? "",

    sortOrder:
      row.sort_order,
  };
}

export async function getProgramFlights(
  supabase: SupabaseClient,
  programId: string,
): Promise<ProgramFlight[]> {
  const { data, error } = await supabase
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
    .eq("program_id", programId)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `تعذر تحميل رحلات البرنامج: ${error.message}`,
    );
  }

  return (
    (data ?? []) as ProgramFlightRow[]
  ).map(mapProgramFlight);
}

export async function replaceProgramFlights(
  supabase: SupabaseClient,
  programId: string,
  flights: ProgramFlightFormValue[],
): Promise<void> {
  const rows = flights.map(
    (flight, index) => ({
      program_id: programId,

      direction:
        flight.direction,

      airline_name_ar:
        flight.airlineNameAr.trim() ||
        null,

      airline_name_en:
        flight.airlineNameEn.trim() ||
        null,

      flight_number:
        flight.flightNumber.trim() ||
        null,

      departure_airport_ar:
        flight.departureAirportAr.trim() ||
        null,

      departure_airport_en:
        flight.departureAirportEn.trim() ||
        null,

      arrival_airport_ar:
        flight.arrivalAirportAr.trim() ||
        null,

      arrival_airport_en:
        flight.arrivalAirportEn.trim() ||
        null,

      departure_at:
        flight.departureAt || null,

      arrival_at:
        flight.arrivalAt || null,

      flight_type:
        flight.flightType,

      transit_airport_ar:
        flight.flightType === "transit"
          ? flight.transitAirportAr.trim() ||
            null
          : null,

      transit_airport_en:
        flight.flightType === "transit"
          ? flight.transitAirportEn.trim() ||
            null
          : null,

      transit_duration_minutes:
        flight.flightType === "transit"
          ? Math.max(
              0,
              flight.transitDurationMinutes,
            )
          : 0,

      cabin_class_ar:
        flight.cabinClassAr.trim() ||
        null,

      cabin_class_en:
        flight.cabinClassEn.trim() ||
        null,

      baggage_allowance_kg:
        Math.max(
          0,
          flight.baggageAllowanceKg,
        ),

      notes_ar:
        flight.notesAr.trim() ||
        null,

      notes_en:
        flight.notesEn.trim() ||
        null,

      sort_order: index,
    }),
  );

  const { error: insertError } =
    await supabase.rpc("replace_program_flights",{p_program_id:programId,p_flights:rows});

  if (insertError) {
    throw new Error(
      `تعذر حفظ رحلات البرنامج: ${insertError.message}`,
    );
  }
}