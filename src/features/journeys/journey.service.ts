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
};
export type JourneyDeparture = {
  id: string;
  program_id: string;
  origin_city_id: string;
  start_at: string;
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
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
  })) as DepartureCity[];
}
export async function getJourneyCatalog(client: SupabaseClient) {
  const now = new Date().toISOString();
  const [countries, cities, programs, departures] = await Promise.all([
    getPublicCountries(client),
    getCities(client),
    getPublicPrograms(client),
    client
      .from("program_departures")
      .select("id,program_id,origin_city_id,start_at")
      .eq("is_active", true)
      .eq("status", "open")
      .is("deleted_at", null)
      .gt("seats_available", 0)
      .gt("start_at", now)
      .or(`booking_deadline.is.null,booking_deadline.gt.${now}`)
      .order("start_at"),
  ]);
  if (departures.error) throw departures.error;
  return {
    countries,
    cities,
    programs,
    departures: (departures.data ?? []) as JourneyDeparture[],
  };
}
export async function getJourneyMeetingPoints(
  client: SupabaseClient,
  programId: string,
  cityId: string,
  departureId: string,
) {
  const { data, error } = await client
    .from("program_meeting_points")
    .select(
      "id,name_ar,name_en,latitude,longitude,address_ar,address_en,departure_id",
    )
    .eq("program_id", programId)
    .eq("city_id", cityId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(`departure_id.is.null,departure_id.eq.${departureId}`)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}
