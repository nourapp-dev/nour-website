import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Program,
  ProgramFormValues,
  ProgramStatus,
} from "../types";

type CoverMediaRow = {
  bucket: string;
  path: string;
};

type ProgramRow = {
  is_demo: boolean;
  visa_status:import("../labels").VisaStatus;
  origin_city_id:string|null;travel_mode:string|null;price_basis:string|null;tax_status:string|null;
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

  flight_inclusion: "included" | "excluded" | "dynamic";
  flight_notes_ar: string | null;
  flight_notes_en: string | null;

  cover_media_id: string | null;
  cover_media: CoverMediaRow | CoverMediaRow[] | null;

  status: "draft" | "published" | "inactive";
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;

  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function getCoverMedia(
  coverMedia: ProgramRow["cover_media"],
): CoverMediaRow | null {
  if (!coverMedia) return null;
  if (Array.isArray(coverMedia)) return coverMedia[0] ?? null;
  return coverMedia;
}

function createPublicMediaUrl(
  media: CoverMediaRow | null,
): string | null {
  if (!media) {
    return null;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${media.bucket}/${media.path}`;
}

function mapProgram(row: ProgramRow): Program {
  const coverMedia = getCoverMedia(row.cover_media);

  return {
    isDemo: row.is_demo,
    id: row.id,visaStatus:row.visa_status,originCityId:row.origin_city_id,travelMode:row.travel_mode,priceBasis:row.price_basis,taxStatus:row.tax_status,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    slug: row.slug,
    summaryAr: row.summary_ar,
    summaryEn: row.summary_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    countryId: row.country_id,
    durationDays: row.duration_days,
    durationNights: row.duration_nights,
    basePrice: Number(row.base_price),
    currencyCode: row.currency_code,

    flightInclusion: row.flight_inclusion ?? "dynamic",
    flightNotesAr: row.flight_notes_ar ?? "",
    flightNotesEn: row.flight_notes_en ?? "",

    coverMediaId: row.cover_media_id,
    coverUrl: createPublicMediaUrl(coverMedia),
    status: row.status,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const programSelect = `
  id,
  title_ar,
  title_en,
  slug,
  summary_ar,
  summary_en,
  description_ar,
  description_en,
  is_demo,
  country_id,visa_status,origin_city_id,travel_mode,price_basis,tax_status,
  duration_days,
  duration_nights,
  base_price,
  currency_code,
  flight_inclusion,
  flight_notes_ar,
  flight_notes_en,
  cover_media_id,
  status,
  is_featured,
  is_active,
  sort_order,
  created_by,
  updated_by,
  created_at,
  updated_at,
  deleted_at,
  cover_media:media!programs_cover_media_id_fkey (
    bucket,
    path
  )
`;

export async function createProgram(
  supabase: SupabaseClient,
  values: ProgramFormValues,
  coverMediaId: string | null = null,
): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .insert({
      is_demo: values.isDemo,
      title_ar: values.titleAr.trim(),
      title_en: values.titleEn.trim(),
      slug: values.slug.trim(),
      summary_ar: values.summaryAr.trim(),
      summary_en: values.summaryEn.trim(),
      description_ar: values.descriptionAr.trim(),
      description_en: values.descriptionEn.trim(),
      country_id: values.countryId || null,
      visa_status:values.visaStatus===undefined?undefined:values.visaStatus||null,origin_city_id:values.originCityId===undefined?undefined:values.originCityId||null,travel_mode:values.travelMode===undefined?undefined:values.travelMode||null,price_basis:values.priceBasis===undefined?undefined:values.priceBasis||null,tax_status:values.taxStatus===undefined?undefined:values.taxStatus||null,
      duration_days: values.durationDays,
      duration_nights: values.durationNights,
      base_price: values.basePrice,
      currency_code: values.currencyCode.trim().toUpperCase(),

      flight_inclusion: values.flightInclusion,
      flight_notes_ar: values.flightNotesAr.trim() || null,
      flight_notes_en: values.flightNotesEn.trim() || null,

      cover_media_id: coverMediaId,
      status: values.status,
      is_featured: values.isFeatured,
      is_active: values.isActive,
      sort_order: values.sortOrder,
    })
    .select(programSelect)
    .single();

  if (error) {
    throw new Error(`تعذر إنشاء البرنامج: ${error.message}`);
  }

  return mapProgram(data as ProgramRow);
}

export async function getPrograms(
  supabase: SupabaseClient,
): Promise<Program[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(programSelect)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`تعذر تحميل البرامج: ${error.message}`);
  }

  return ((data ?? []) as ProgramRow[]).map(mapProgram);
}

export async function getProgramById(
  supabase: SupabaseClient,
  programId: string,
): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .select(programSelect)
    .eq("id", programId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw new Error(`تعذر تحميل تفاصيل البرنامج: ${error.message}`);
  }

  return mapProgram(data as ProgramRow);
}

export async function updateProgram(
  supabase: SupabaseClient,
  programId: string,
  values: ProgramFormValues,
  coverMediaId: string | null,
): Promise<Program> {
  const { data, error } = await supabase
    .from("programs")
    .update({
      is_demo: values.isDemo,
      title_ar: values.titleAr.trim(),
      title_en: values.titleEn.trim(),
      slug: values.slug.trim(),
      summary_ar: values.summaryAr.trim(),
      summary_en: values.summaryEn.trim(),
      description_ar: values.descriptionAr.trim(),
      description_en: values.descriptionEn.trim(),
      country_id: values.countryId || null,
      visa_status:values.visaStatus===undefined?undefined:values.visaStatus||null,origin_city_id:values.originCityId===undefined?undefined:values.originCityId||null,travel_mode:values.travelMode===undefined?undefined:values.travelMode||null,price_basis:values.priceBasis===undefined?undefined:values.priceBasis||null,tax_status:values.taxStatus===undefined?undefined:values.taxStatus||null,
      duration_days: values.durationDays,
      duration_nights: values.durationNights,
      base_price: values.basePrice,
      currency_code: values.currencyCode.trim().toUpperCase(),

      flight_inclusion: values.flightInclusion,
      flight_notes_ar: values.flightNotesAr.trim() || null,
      flight_notes_en: values.flightNotesEn.trim() || null,

      cover_media_id: coverMediaId,
      is_featured: values.isFeatured,
      sort_order: values.sortOrder,
    })
    .eq("id", programId)
    .is("deleted_at", null)
    .select(programSelect)
    .maybeSingle();

  if (error) {
    throw new Error(`تعذر تحديث البرنامج: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على البرنامج أو ليست لديك صلاحية تعديله.",
    );
  }

  return mapProgram(data as ProgramRow);
}

export async function setProgramPublication(
  supabase: SupabaseClient,
  programId: string,
  status: ProgramStatus,
  isActive: boolean,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "set_program_publication",
    {
      p_program_id: programId,
      p_status: status,
      p_is_active: isActive,
    },
  );

  if (error) {
    if (error.code === "42501") {
      throw new Error(
        "ليس لديك صلاحية تغيير حالة نشر هذا البرنامج.",
      );
    }

    throw new Error(
      `تعذر تغيير حالة نشر البرنامج: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على البرنامج أو أنه محذوف.",
    );
  }
}

export async function deleteProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "soft_delete_program",
    {
      p_program_id: programId,
    },
  );

  if (error) {
    if (
      error.code === "42501" ||
      error.message.includes("صلاحية")
    ) {
      throw new Error(
        "ليس لديك صلاحية حذف هذا البرنامج.",
      );
    }

    throw new Error(
      `تعذر حذف البرنامج: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على البرنامج أو أنه محذوف بالفعل.",
    );
  }
}

export async function getDeletedPrograms(
  supabase: SupabaseClient,
): Promise<Program[]> {
  const { data, error } = await supabase.rpc(
    "get_deleted_programs",
  );

  if (error) {
    throw new Error(
      `تعذر تحميل البرامج المحذوفة: ${error.message}`,
    );
  }

  return ((data ?? []) as ProgramRow[]).map(mapProgram);
}

export async function restoreProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "restore_program",
    {
      p_program_id: programId,
    },
  );

  if (error) {
    if (
      error.code === "42501" ||
      error.message.includes("صلاحية")
    ) {
      throw new Error(
        "ليس لديك صلاحية استعادة هذا البرنامج.",
      );
    }

    throw new Error(
      `تعذر استعادة البرنامج: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على البرنامج داخل سلة المحذوفات.",
    );
  }
}

export async function permanentlyDeleteProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "permanently_delete_program",
    {
      p_program_id: programId,
    },
  );

  if (error) {
    if (
      error.code === "42501" ||
      error.message.includes("صلاحية")
    ) {
      throw new Error(
        "ليس لديك صلاحية حذف هذا البرنامج نهائيًا.",
      );
    }

    throw new Error(
      `تعذر حذف البرنامج نهائيًا: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على البرنامج داخل سلة المحذوفات.",
    );
  }
}