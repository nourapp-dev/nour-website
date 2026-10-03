import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramDepartureStatus =
  | "scheduled"
  | "open"
  | "full"
  | "closed"
  | "cancelled";

export type ProgramDeparture = {
  id: string;
  programId: string;
  originCityId: string | null;
  startAt: string;
  endAt: string | null;
  bookingDeadline: string | null;
  capacityTotal: number;
  seatsAvailable: number;
  status: ProgramDepartureStatus;
  notesAr: string;
  notesEn: string;
  isActive: boolean;
  sortOrder: number;
};

type DepartureRow = {
  id: string;
  program_id: string;
  origin_city_id: string | null;
  start_at: string;
  end_at: string | null;
  booking_deadline: string | null;
  capacity_total: number;
  seats_available: number;
  status: ProgramDepartureStatus;
  notes_ar: string | null;
  notes_en: string | null;
  is_active: boolean;
  sort_order: number;
};

const select =
  "id,program_id,origin_city_id,start_at,end_at,booking_deadline,capacity_total,seats_available,status,notes_ar,notes_en,is_active,sort_order";

function mapRow(row: DepartureRow): ProgramDeparture {
  return {
    id: row.id,
    programId: row.program_id,
    originCityId: row.origin_city_id,
    startAt: row.start_at,
    endAt: row.end_at,
    bookingDeadline: row.booking_deadline,
    capacityTotal: row.capacity_total,
    seatsAvailable: row.seats_available,
    status: row.status,
    notesAr: row.notes_ar ?? "",
    notesEn: row.notes_en ?? "",
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

export async function getProgramDepartures(
  supabase: SupabaseClient,
  programId: string,
) {
  const { data, error } = await supabase
    .from("program_departures")
    .select(select)
    .eq("program_id", programId)
    .is("deleted_at", null)
    .order("start_at", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DepartureRow[]).map(mapRow);
}

export async function getPublicProgramDepartures(
  supabase: SupabaseClient,
  programId: string,
) {
  const { data, error } = await supabase
    .from("program_departures")
    .select(select)
    .eq("program_id", programId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("start_at", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DepartureRow[]).map(mapRow);
}

export async function getNextPublicDepartures(
  supabase: SupabaseClient,
  programIds: string[],
) {
  const nextDates: Record<string, string> = {};
  if (!programIds.length) return nextDates;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("program_departures")
    .select("program_id,start_at")
    .in("program_id", programIds)
    .eq("is_active", true)
    .eq("status", "open")
    .gt("seats_available", 0)
    .is("deleted_at", null)
    .gte("start_at", now)
    .or(`booking_deadline.is.null,booking_deadline.gte.${now}`)
    .order("start_at", { ascending: true });
  if (error) throw error;
  for (const row of (data ?? []) as Pick<
    DepartureRow,
    "program_id" | "start_at"
  >[]) {
    nextDates[row.program_id] ??= row.start_at;
  }
  return nextDates;
}

export async function createProgramDeparture(
  supabase: SupabaseClient,
  programId: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("program_departures")
    .insert({ program_id: programId, ...payload })
    .select(select)
    .single();
  if (error) throw error;
  return mapRow(data as DepartureRow);
}

export async function updateProgramDeparture(
  supabase: SupabaseClient,
  id: string,
  payload: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("program_departures")
    .update(payload)
    .eq("id", id)
    .select(select)
    .single();
  if (error) throw error;
  return mapRow(data as DepartureRow);
}

export async function archiveProgramDeparture(
  supabase: SupabaseClient,
  id: string,
) {
  const { error } = await supabase
    .from("program_departures")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

/** One INSERT statement: either every new departure is saved or none is. */
export async function createProgramDepartures(
  supabase: SupabaseClient,
  programId: string,
  payloads: Record<string, unknown>[],
) {
  if (!payloads.length) return;
  const { error } = await supabase.from("program_departures").insert(
    payloads.map((payload) => ({ ...payload, program_id: programId })),
  );
  if (error) throw new Error(`تعذر حفظ مواعيد الرحلات: ${error.message}`);
}
