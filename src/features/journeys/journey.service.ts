import { validCoordinates } from "./coordinates";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicCountries } from "../countries/services/public-countries.service";
import { getPublicPrograms } from "../programs/services/public-programs.service";
export type DepartureCity = {
  id: string;
  country_id: string;
  name_ar: string;
  name_en: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  deleted_at: string | null;
  sort_order: number;
  timezone?: string | null;
  publication_status?: string | null;
  show_on_map?: boolean | null;
  updated_at?: string;
};
export type JourneyDeparture = {
  id: string;
  program_id: string;
  origin_city_id: string;
  start_at: string;
  departure_timezone?: string | null;
  meeting_point_id?: string | null;
  status?: string;
};
export async function getCities(client: SupabaseClient, admin = false) {
  let query = client
    .from("departure_cities")
    .select("*")
    .order("sort_order")
    .order("name_ar");
  if (!admin) query = query.eq("is_active", true).is("deleted_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c) => ({
    ...c,
    latitude: validCoordinates(c.latitude, c.longitude)
      ? Number(c.latitude)
      : Number.NaN,
    longitude: validCoordinates(c.latitude, c.longitude)
      ? Number(c.longitude)
      : Number.NaN,
  })) as DepartureCity[];
}
export async function getJourneyCatalog(client: SupabaseClient) {
  const now = new Date().toISOString();
  const results = await Promise.allSettled([
    getPublicCountries(client),
    getCities(client),
    getPublicPrograms(client),
    client
      .from("program_departures")
      .select(
        "id,program_id,origin_city_id,start_at,departure_timezone,meeting_point_id,status",
      )
      .eq("is_active", true)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .gt("start_at", now)
      .order("start_at"),
  ]);
  const [countries, cities, programs, departures] = results;
  const errors: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (
      r.status === "rejected" ||
      (i === 3 &&
        r.status === "fulfilled" &&
        (r.value as { error?: unknown }).error)
    )
      errors.push(["countries", "cities", "programs", "departures"][i]);
  }
  return {
    countries: countries.status === "fulfilled" ? countries.value : [],
    cities: cities.status === "fulfilled" ? cities.value : [],
    programs: programs.status === "fulfilled" ? programs.value : [],
    departures:
      departures.status === "fulfilled" && !departures.value.error
        ? ((departures.value.data ?? []) as JourneyDeparture[])
        : [],
    errors,
  };
}
export async function getJourneyMeetingPoints(
  client: SupabaseClient,
  programId: string,
  cityId: string,
  departureId: string,
  meetingPointId?: string | null,
) {
  const { data, error } = await client
    .from("program_meeting_points")
    .select(
      "id,name_ar,name_en,latitude,longitude,address_ar,address_en,departure_id,map_url,arrival_instructions_ar,arrival_instructions_en",
    )
    .or(
      `program_id.eq.${programId}${meetingPointId ? `,id.eq.${meetingPointId}` : ""}`,
    )
    .eq("city_id", cityId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(`departure_id.is.null,departure_id.eq.${departureId}`)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}
