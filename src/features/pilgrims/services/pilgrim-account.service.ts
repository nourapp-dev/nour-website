import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getPilgrimUser } from "../../auth/services/account-access";

export type PilgrimProfile = {
  userId: string;
  fullName: string;
  phone: string;
  countryCode: string;
  nationalityCode: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  residenceCountryCode: string;
  preferredLanguage: "ar" | "en";
};

export type PilgrimDocument = {
  id: string;
  documentType: "passport" | "residence_permit" | "national_id" | "other";
  path: string;
  originalName: string;
  mimeType: string;
  fileSize: number | null;
  isVerified: boolean;
};

type PilgrimProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  nationality_code: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  residence_country_code: string | null;
  preferred_language: string | null;
};

const mapProfile = (row: PilgrimProfileRow): PilgrimProfile => ({
  userId: row.user_id,
  fullName: row.full_name ?? "",
  phone: row.phone ?? "",
  countryCode: row.country_code ?? "",
  nationalityCode: row.nationality_code ?? "",
  dateOfBirth: row.date_of_birth ?? "",
  passportNumber: row.passport_number ?? "",
  passportExpiry: row.passport_expiry ?? "",
  residenceCountryCode: row.residence_country_code ?? "",
  preferredLanguage: row.preferred_language === "en" ? "en" : "ar",
});

export async function getCurrentPilgrimAccount(supabase: SupabaseClient) {
  const user = await getPilgrimUser(supabase);
  if (!user)
    return {
      user: null as User | null,
      profile: null as PilgrimProfile | null,
      documents: [] as PilgrimDocument[],
      complete: false,
    };

  const [profileResult, documentsResult] = await Promise.all([
    supabase
      .from("pilgrim_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("pilgrim_documents")
      .select(
        "id,document_type,path,original_name,mime_type,file_size,is_verified",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (documentsResult.error) throw documentsResult.error;

  const profile = profileResult.data ? mapProfile(profileResult.data) : null;
  const documents = (documentsResult.data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type,
    path: row.path,
    originalName: row.original_name ?? "",
    mimeType: row.mime_type ?? "",
    fileSize: row.file_size == null ? null : Number(row.file_size),
    isVerified: Boolean(row.is_verified),
  })) as PilgrimDocument[];
  const hasPassport = documents.some((doc) => doc.documentType === "passport");
  const complete = Boolean(
    profile &&
      profile.fullName.trim().length >= 2 &&
      profile.dateOfBirth &&
      profile.nationalityCode &&
      profile.passportNumber &&
      profile.passportExpiry &&
      new Date(profile.passportExpiry).getTime() > Date.now() &&
      hasPassport,
  );
  return { user, profile, documents, complete };
}

export async function savePilgrimProfile(
  supabase: SupabaseClient,
  input: Omit<PilgrimProfile, "userId">,
) {
  const user = await getPilgrimUser(supabase);
  if (!user) throw new Error("authentication_required");
  const { error } = await supabase.from("pilgrim_profiles").upsert(
    {
      user_id: user.id,
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
      country_code: input.countryCode.trim() || null,
      nationality_code: input.nationalityCode.trim().toUpperCase() || null,
      date_of_birth: input.dateOfBirth || null,
      passport_number: input.passportNumber.trim() || null,
      passport_expiry: input.passportExpiry || null,
      residence_country_code:
        input.residenceCountryCode.trim().toUpperCase() || null,
      preferred_language: input.preferredLanguage,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function uploadPilgrimDocument(
  supabase: SupabaseClient,
  documentType: PilgrimDocument["documentType"],
  file: File,
) {
  const user = await getPilgrimUser(supabase);
  if (!user) throw new Error("authentication_required");
  if (file.size > 10 * 1024 * 1024) throw new Error("file_too_large");
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type))
    throw new Error("invalid_file_type");

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${user.id}/${documentType}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("pilgrim-documents")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: existing, error: readError } = await supabase
    .from("pilgrim_documents")
    .select("id")
    .eq("user_id", user.id)
    .eq("document_type", documentType)
    .is("deleted_at", null)
    .maybeSingle();
  if (readError) throw readError;
  const payload = {
    path,
    original_name: file.name,
    mime_type: file.type,
    file_size: file.size,
  };
  if (existing?.id) {
    const { error } = await supabase
      .from("pilgrim_documents")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("pilgrim_documents")
      .insert({
        user_id: user.id,
        document_type: documentType,
        bucket: "pilgrim-documents",
        ...payload,
      });
    if (error) throw error;
  }
}
