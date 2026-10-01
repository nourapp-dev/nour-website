import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramDetailSection =
  | "itinerary"
  | "inclusions"
  | "cancellation"
  | "meetingPoints"
  | "priceTiers"
  | "faqs";

export type ProgramItineraryDay = {
  id: string;
  dayNumber: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  locationAr: string;
  locationEn: string;
  startTime: string;
  endTime: string;
  sortOrder: number;
};

export type ProgramInclusionItem = {
  id: string;
  inclusionType: "included" | "excluded";
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  sortOrder: number;
};

export type ProgramCancellationRule = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  daysBeforeStart: number | null;
  refundPercent: number | null;
  sortOrder: number;
};

export type ProgramMeetingPoint = {
  id: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  latitude: number | null;
  longitude: number | null;
  meetingAt: string | null;
  notesAr: string;
  notesEn: string;
  sortOrder: number;
};

export type ProgramPriceTier = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  currencyCode: string;
  minTravelers: number | null;
  maxTravelers: number | null;
  sortOrder: number;
};

export type ProgramFaq = {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  sortOrder: number;
};

export type ProgramDetailContent = {
  itinerary: ProgramItineraryDay[];
  inclusions: ProgramInclusionItem[];
  cancellation: ProgramCancellationRule[];
  meetingPoints: ProgramMeetingPoint[];
  priceTiers: ProgramPriceTier[];
  faqs: ProgramFaq[];
};

const n = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function getProgramDetailContent(
  supabase: SupabaseClient,
  programId: string,
): Promise<ProgramDetailContent> {
  const [itinerary, inclusions, cancellation, meetingPoints, priceTiers, faqs] = await Promise.all([
    supabase.from("program_itinerary_days").select("*").eq("program_id", programId).is("deleted_at", null).order("sort_order").order("day_number"),
    supabase.from("program_inclusion_items").select("*").eq("program_id", programId).is("deleted_at", null).order("inclusion_type").order("sort_order"),
    supabase.from("program_cancellation_rules").select("*").eq("program_id", programId).is("deleted_at", null).order("sort_order"),
    supabase.from("program_meeting_points").select("*").eq("program_id", programId).is("deleted_at", null).order("sort_order"),
    supabase.from("program_price_tiers").select("*").eq("program_id", programId).is("departure_id", null).is("deleted_at", null).order("sort_order"),
    supabase.from("program_faqs").select("*").eq("program_id", programId).is("deleted_at", null).order("sort_order"),
  ]);

  const error = [itinerary, inclusions, cancellation, meetingPoints, priceTiers, faqs].find((r) => r.error)?.error;
  if (error) throw new Error(`تعذر تحميل تفاصيل البرنامج: ${error.message}`);

  return {
    itinerary: (itinerary.data ?? []).map((row) => ({
      id: row.id,
      dayNumber: row.day_number,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      descriptionAr: row.description_ar ?? "",
      descriptionEn: row.description_en ?? "",
      locationAr: row.location_ar ?? "",
      locationEn: row.location_en ?? "",
      startTime: row.start_time ?? "",
      endTime: row.end_time ?? "",
      sortOrder: row.sort_order,
    })),
    inclusions: (inclusions.data ?? []).map((row) => ({
      id: row.id,
      inclusionType: row.inclusion_type,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      descriptionAr: row.description_ar ?? "",
      descriptionEn: row.description_en ?? "",
      sortOrder: row.sort_order,
    })),
    cancellation: (cancellation.data ?? []).map((row) => ({
      id: row.id,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      daysBeforeStart: n(row.days_before_start),
      refundPercent: n(row.refund_percent),
      sortOrder: row.sort_order,
    })),
    meetingPoints: (meetingPoints.data ?? []).map((row) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      addressAr: row.address_ar ?? "",
      addressEn: row.address_en ?? "",
      latitude: n(row.latitude),
      longitude: n(row.longitude),
      meetingAt: row.meeting_at,
      notesAr: row.notes_ar ?? "",
      notesEn: row.notes_en ?? "",
      sortOrder: row.sort_order,
    })),
    priceTiers: (priceTiers.data ?? []).map((row) => ({
      id: row.id,
      nameAr: row.name_ar,
      nameEn: row.name_en,
      descriptionAr: row.description_ar ?? "",
      descriptionEn: row.description_en ?? "",
      price: Number(row.price) || 0,
      currencyCode: row.currency_code,
      minTravelers: n(row.min_travelers),
      maxTravelers: n(row.max_travelers),
      sortOrder: row.sort_order,
    })),
    faqs: (faqs.data ?? []).map((row) => ({
      id: row.id,
      questionAr: row.question_ar,
      questionEn: row.question_en,
      answerAr: row.answer_ar,
      answerEn: row.answer_en,
      sortOrder: row.sort_order,
    })),
  };
}

const TABLES: Record<ProgramDetailSection, string> = {
  itinerary: "program_itinerary_days",
  inclusions: "program_inclusion_items",
  cancellation: "program_cancellation_rules",
  meetingPoints: "program_meeting_points",
  priceTiers: "program_price_tiers",
  faqs: "program_faqs",
};

export async function createProgramDetailItem(
  supabase: SupabaseClient,
  section: ProgramDetailSection,
  programId: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from(TABLES[section]).insert({
    program_id: programId,
    ...payload,
  });
  if (error) throw new Error(error.message);
}

export async function updateProgramDetailItem(
  supabase: SupabaseClient,
  section: ProgramDetailSection,
  id: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from(TABLES[section]).update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveProgramDetailItem(
  supabase: SupabaseClient,
  section: ProgramDetailSection,
  id: string,
) {
  const { error } = await supabase.from(TABLES[section]).update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}
