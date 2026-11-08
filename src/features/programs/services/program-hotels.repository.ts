import type { SupabaseClient } from "@supabase/supabase-js";

export type ProgramHotelInput = {
  hotelId: string;
  nights: number;
  occupancy?:number|null;

  roomTypeAr: string;
  roomTypeEn: string;

  mealPlanAr: string;
  mealPlanEn: string;

  checkInDate: string;
  checkOutDate: string;

  notesAr: string;
  notesEn: string;

  sortOrder: number;
};

export type ProgramHotel = {
  id: string;
  programId: string;
  hotelId: string;

  nights: number;
  occupancy?:number|null;

  roomTypeAr: string;
  roomTypeEn: string;

  mealPlanAr: string;
  mealPlanEn: string;

  checkInDate: string | null;
  checkOutDate: string | null;

  notesAr: string;
  notesEn: string;

  sortOrder: number;
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

function mapProgramHotel(
  row: ProgramHotelRow,
): ProgramHotel {
  return {
    id: row.id,
    programId: row.program_id,
    hotelId: row.hotel_id,

    nights: row.nights,occupancy:row.occupancy,

    roomTypeAr:
      row.room_type_ar ?? "",

    roomTypeEn:
      row.room_type_en ?? "",

    mealPlanAr:
      row.meal_plan_ar ?? "",

    mealPlanEn:
      row.meal_plan_en ?? "",

    checkInDate:
      row.check_in_date,

    checkOutDate:
      row.check_out_date,

    notesAr:
      row.notes_ar ?? "",

    notesEn:
      row.notes_en ?? "",

    sortOrder:
      row.sort_order,
  };
}

export async function getProgramHotels(
  supabase: SupabaseClient,
  programId: string,
): Promise<ProgramHotel[]> {
  const { data, error } =
    await supabase
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
      .eq(
        "program_id",
        programId,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `تعذر تحميل فنادق البرنامج: ${error.message}`,
    );
  }

  return (
    (data ?? []) as ProgramHotelRow[]
  ).map(mapProgramHotel);
}

export async function replaceProgramHotels(
  supabase: SupabaseClient,
  programId: string,
  hotels: ProgramHotelInput[],
): Promise<void> {
  const {
    error: deleteError,
  } = await supabase
    .from("program_hotels")
    .delete()
    .eq(
      "program_id",
      programId,
    );

  if (deleteError) {
    throw new Error(
      `تعذر تحديث فنادق البرنامج: ${deleteError.message}`,
    );
  }

  if (hotels.length === 0) {
    return;
  }

  const rows =
    hotels.map(
      (hotel, index) => ({
        program_id:
          programId,

        hotel_id:
          hotel.hotelId,
        occupancy:hotel.occupancy??null,

        nights:
          hotel.nights,

        room_type_ar:
          hotel.roomTypeAr.trim() ||
          null,

        room_type_en:
          hotel.roomTypeEn.trim() ||
          null,

        meal_plan_ar:
          hotel.mealPlanAr.trim() ||
          null,

        meal_plan_en:
          hotel.mealPlanEn.trim() ||
          null,

        check_in_date:
          hotel.checkInDate ||
          null,

        check_out_date:
          hotel.checkOutDate ||
          null,

        notes_ar:
          hotel.notesAr.trim() ||
          null,

        notes_en:
          hotel.notesEn.trim() ||
          null,

        sort_order:
          hotel.sortOrder ??
          index,
      }),
    );

  const { error } =
    await supabase
      .from("program_hotels")
      .insert(rows);

  if (error) {
    throw new Error(
      `تعذر حفظ فنادق البرنامج: ${error.message}`,
    );
  }
}