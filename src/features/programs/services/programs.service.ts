import type { SupabaseClient } from "@supabase/supabase-js";

import { uploadMedia } from "../../media/repositories/media.repository";

import type {
  Program,
  ProgramFormValues,
} from "../types";

import {
  createProgram as createProgramRecord,
  deleteProgram as deleteProgramRecord,
  getDeletedPrograms as getDeletedProgramRecords,
  getProgramById as getProgramByIdRecord,
  getPrograms as getProgramRecords,
  permanentlyDeleteProgram as permanentlyDeleteProgramRecord,
  restoreProgram as restoreProgramRecord,
  setProgramPublication as setProgramPublicationRecord,
  updateProgram as updateProgramRecord,
} from "./programs.repository";

import {
  getProgramHotels,
  replaceProgramHotels,
} from "./program-hotels.repository";

import {
  getProgramFlights,
  replaceProgramFlights,
} from "./program-flights.repository";

async function assertPublishPermission(
  supabase: SupabaseClient,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "current_user_has_permission",
    {
      permission_code: "programs.publish",
    },
  );

  if (error) {
    throw new Error(
      `تعذر التحقق من صلاحية نشر البرامج: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "ليس لديك صلاحية تغيير حالة نشر البرنامج.",
    );
  }
}

/* =========================================================
   CREATE
========================================================= */

export async function createProgram(
  supabase: SupabaseClient,
  values: ProgramFormValues,
  onPersisted?: (program: Program) => void,
): Promise<Program> {
  if (values.status === "published") {
    await assertPublishPermission(supabase);
  }

  let coverMediaId: string | null = null;

  if (values.coverFile) {
    const uploadResult = await uploadMedia(
      supabase,
      {
        file: values.coverFile,
        folder: "programs",
        altAr: values.titleAr,
        altEn: values.titleEn,
      },
    );

    coverMediaId =
      uploadResult.media.id;
  }

  const program =
    await createProgramRecord(
      supabase,
      values,
      coverMediaId,
    );

  onPersisted?.(program);

  await replaceProgramHotels(
    supabase,
    program.id,
    values.hotels ?? [],
  );

  await replaceProgramFlights(
    supabase,
    program.id,
    values.flights ?? [],
  );

  return program;
}

/* =========================================================
   LIST
========================================================= */

export async function getPrograms(
  supabase: SupabaseClient,
): Promise<Program[]> {
  return getProgramRecords(
    supabase,
  );
}

/* =========================================================
   GET ONE
========================================================= */

export async function getProgramById(
  supabase: SupabaseClient,
  programId: string,
): Promise<Program> {
  return getProgramByIdRecord(
    supabase,
    programId,
  );
}

/* =========================================================
   PROGRAM HOTELS
========================================================= */

export async function getHotelsForProgram(
  supabase: SupabaseClient,
  programId: string,
) {
  return getProgramHotels(
    supabase,
    programId,
  );
}

/* =========================================================
   PROGRAM FLIGHTS
========================================================= */

export async function getFlightsForProgram(
  supabase: SupabaseClient,
  programId: string,
) {
  return getProgramFlights(
    supabase,
    programId,
  );
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateProgram(
  supabase: SupabaseClient,
  programId: string,
  values: ProgramFormValues,
  currentCoverMediaId: string | null = null,
): Promise<Program> {
  const currentProgram =
    await getProgramByIdRecord(
      supabase,
      programId,
    );

  const publicationChanged =
    currentProgram.status !== values.status ||
    currentProgram.isActive !== values.isActive;

  if (publicationChanged) {
    await assertPublishPermission(supabase);
  }

  let coverMediaId =
    currentCoverMediaId;

  if (values.coverFile) {
    const uploadResult = await uploadMedia(
      supabase,
      {
        file: values.coverFile,
        folder: "programs",
        altAr: values.titleAr,
        altEn: values.titleEn,
      },
    );

    coverMediaId =
      uploadResult.media.id;
  }

  const program =
    await updateProgramRecord(
      supabase,
      programId,
      values,
      coverMediaId,
    );

  if (publicationChanged) {
    await setProgramPublicationRecord(
      supabase,
      programId,
      values.status,
      values.isActive,
    );
  }

  await replaceProgramHotels(
    supabase,
    programId,
    values.hotels ?? [],
  );

  await replaceProgramFlights(
    supabase,
    programId,
    values.flights ?? [],
  );

  if (publicationChanged) {
    return getProgramByIdRecord(
      supabase,
      programId,
    );
  }

  return program;
}

export async function setProgramPublication(
  supabase: SupabaseClient,
  programId: string,
  status: Program["status"],
  isActive: boolean,
): Promise<void> {
  await setProgramPublicationRecord(
    supabase,
    programId,
    status,
    isActive,
  );
}

/* =========================================================
   SOFT DELETE
========================================================= */

export async function deleteProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  await deleteProgramRecord(
    supabase,
    programId,
  );
}

/* =========================================================
   DELETED PROGRAMS
========================================================= */

export async function getDeletedPrograms(
  supabase: SupabaseClient,
): Promise<Program[]> {
  return getDeletedProgramRecords(
    supabase,
  );
}

/* =========================================================
   RESTORE
========================================================= */

export async function restoreProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  await restoreProgramRecord(
    supabase,
    programId,
  );
}

/* =========================================================
   PERMANENT DELETE
========================================================= */

export async function permanentlyDeleteProgram(
  supabase: SupabaseClient,
  programId: string,
): Promise<void> {
  await permanentlyDeleteProgramRecord(
    supabase,
    programId,
  );
}