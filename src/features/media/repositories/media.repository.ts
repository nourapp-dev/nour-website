import {imageInfo} from "../utils/imageInfo";
import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  DeleteMediaInput,
  MediaRecord,
  UploadMediaInput,
  UploadMediaResult,
} from "../types/media.types";
import { createMediaFilePath } from "../utils/filePath";
import { validateMediaFile } from "../utils/fileValidation";

export type MediaItem = {
  id: string;
  fileName: string;
  bucket: string;
  path: string;
  mimeType: string;
  altAr: string;
  altEn: string;
  publicUrl: string;
  createdAt: string;
};

type MediaRow = {
  id: string;
  bucket: string;
  path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_ar: string | null;
  alt_en: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const mediaSelect = `
  id,
  bucket,
  path,
  file_name,
  mime_type,
  size_bytes,
  width,
  height,
  alt_ar,
  alt_en,
  uploaded_by,
  created_at,
  updated_at,
  deleted_at
`;

function mapMedia(
  row: MediaRow,
): MediaRecord {
  return {
    id: row.id,
    bucket: row.bucket,
    path: row.path,
    fileName: row.file_name,
    mimeType:
      row.mime_type ??
      "application/octet-stream",
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    altAr: row.alt_ar,
    altEn: row.alt_en,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function createPublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function uploadMedia(
  supabase: SupabaseClient,
  input: UploadMediaInput,
): Promise<UploadMediaResult> {
  validateMediaFile(input.file);
  const dimensions=await imageInfo(input.file);

  let session;

  try {
    const {
      data,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        `تعذر التحقق من جلسة الدخول: ${sessionError.message}`,
      );
    }

    session = data.session;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    const normalizedMessage =
      message.toLowerCase();

    if (
      normalizedMessage.includes("failed to fetch") ||
      normalizedMessage.includes("networkerror") ||
      normalizedMessage.includes("network request failed")
    ) {
      throw new Error(
        "تعذر الاتصال بـ Supabase للتحقق من جلسة الدخول. تحقق من اتصال الإنترنت وإعدادات Supabase ثم حاول مجددًا.",
      );
    }

    throw error;
  }

  if (!session) {
    throw new Error(
      "جلسة تسجيل الدخول غير موجودة أو انتهت. سجل الخروج ثم سجل الدخول من جديد.",
    );
  }

  const bucket = "media";

  const path = createMediaFilePath(
    input.folder,
    input.file,
  );

  try {
    const {
      data: uploadedFile,
      error: uploadError,
    } = await supabase.storage
      .from(bucket)
      .upload(path, input.file, {
        cacheControl: "3600",
        contentType:
          input.file.type ||
          "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `تعذر رفع الملف إلى التخزين: ${uploadError.message}`,
      );
    }

    if (!uploadedFile?.path) {
      throw new Error(
        "لم يُرجع Supabase مسار الملف بعد الرفع.",
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    const normalizedMessage =
      message.toLowerCase();

    if (
      normalizedMessage.includes("failed to fetch") ||
      normalizedMessage.includes("networkerror") ||
      normalizedMessage.includes("network request failed")
    ) {
      throw new Error(
        "تعذر الاتصال بخدمة Supabase Storage. تحقق من اتصال Supabase ومن متغير NEXT_PUBLIC_SUPABASE_URL ثم حاول مجددًا.",
      );
    }

    throw error;
  }

  const {
    data,
    error: mediaError,
  } = await supabase
    .from("media")
    .insert({
      bucket,
      path,
      file_name: input.file.name,
      mime_type:
        input.file.type ||
        "application/octet-stream",
      size_bytes: input.file.size,
      width:dimensions.width,height:dimensions.height,
      alt_ar:
        input.altAr?.trim() || null,
      alt_en:
        input.altEn?.trim() || null,
      uploaded_by: session.user.id,
    })
    .select(mediaSelect)
    .single();

  if (mediaError) {
    try {
      await supabase.storage
        .from(bucket)
        .remove([path]);
    } catch {
      // لا نستبدل خطأ قاعدة البيانات بخطأ تنظيف الملف.
    }

    throw new Error(
      `تعذر حفظ سجل الوسائط: ${mediaError.message}`,
    );
  }

  return {
    media: mapMedia(
      data as MediaRow,
    ),
    publicUrl: createPublicUrl(
      supabase,
      bucket,
      path,
    ),
  };
}

export async function getMedia(
  supabase: SupabaseClient,
): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from("media")
    .select(mediaSelect)
    .is("deleted_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `تعذر تحميل الوسائط: ${error.message}`,
    );
  }

  return (data as MediaRow[]).map(
    (row) => ({
      id: row.id,
      fileName: row.file_name,
      bucket: row.bucket,
      path: row.path,
      mimeType:
        row.mime_type ??
        "application/octet-stream",
      altAr: row.alt_ar ?? "",
      altEn: row.alt_en ?? "",
      publicUrl: createPublicUrl(
        supabase,
        row.bucket,
        row.path,
      ),
      createdAt: row.created_at,
    }),
  );
}

async function ensureMediaIsNotUsed(
  supabase: SupabaseClient,
  mediaId: string,
): Promise<void> {
  const usage=await supabase.rpc('website_media_in_use',{media_id:mediaId});
  if(usage.error)throw usage.error;
  if(usage.data)throw new Error('لا يمكن حذف الأصل: مستخدم في محتوى الموقع أو إصدار محفوظ. أزل الارتباط أولًا / Media is used by content or a retained version.');
  const {
    data: linkedProgram,
    error: programError,
  } = await supabase
    .from("programs")
    .select("id, title_ar, title_en")
    .eq("cover_media_id", mediaId)
    .limit(1)
    .maybeSingle();

  if (programError) {
    throw new Error(
      `تعذر التحقق من استخدام الصورة في البرامج: ${programError.message}`,
    );
  }

  if (linkedProgram) {
    throw new Error(
      `لا يمكن حذف الصورة لأنها مستخدمة كغلاف للبرنامج: ${
        linkedProgram.title_ar ||
        linkedProgram.title_en
      }`,
    );
  }

  const {
    data: linkedCountry,
    error: countryError,
  } = await supabase
    .from("countries")
    .select("id, name_ar, name_en")
    .eq("flag_media_id", mediaId)
    .limit(1)
    .maybeSingle();

  if (countryError) {
    throw new Error(
      `تعذر التحقق من استخدام الصورة في الدول: ${countryError.message}`,
    );
  }

  if (linkedCountry) {
    throw new Error(
      `لا يمكن حذف الصورة لأنها مستخدمة كعلم للدولة: ${
        linkedCountry.name_ar ||
        linkedCountry.name_en
      }`,
    );
  }
}
export async function deleteMedia(
  supabase: SupabaseClient,
  input: DeleteMediaInput,
): Promise<void> {
  const {
    data: media,
    error: mediaFetchError,
  } = await supabase
    .from("media")
    .select(`
      id,
      bucket,
      path,
      deleted_at
    `)
    .eq("id", input.mediaId)
    .maybeSingle();

  if (mediaFetchError) {
    throw new Error(
      `تعذر تحميل بيانات الملف: ${mediaFetchError.message}`,
    );
  }

  if (!media) {
    throw new Error(
      "لم يتم العثور على ملف الوسائط.",
    );
  }

  if (media.deleted_at) {
    throw new Error(
      "ملف الوسائط محذوف بالفعل.",
    );
  }

  await ensureMediaIsNotUsed(
    supabase,
    input.mediaId,
  );

  const { error: storageError } =
    await supabase.storage
      .from(media.bucket)
      .remove([media.path]);

  if (storageError) {
    throw new Error(
      `تعذر حذف الملف من التخزين: ${storageError.message}`,
    );
  }

  const { data, error: updateError } =
    await supabase
      .from("media")
      .update({
        deleted_at:
          new Date().toISOString(),
      })
      .eq("id", input.mediaId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

  if (updateError) {
    throw new Error(
      `تم حذف الملف من التخزين، لكن تعذر تحديث سجل الوسائط: ${updateError.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على سجل الوسائط أو أنه محذوف بالفعل.",
    );
  }
}

export type MediaUsage = {
  programs: {
    id: string;
    titleAr: string;
    titleEn: string;
  }[];
  countries: {
    id: string;
    nameAr: string;
    nameEn: string;
  }[];
};

export type MediaDetails = MediaItem & {
  sizeBytes: number;
  width: number | null;
  height: number | null;
  uploadedBy: string | null;
  updatedAt: string;
  usage: MediaUsage;
};

export async function getMediaById(
  supabase: SupabaseClient,
  mediaId: string,
): Promise<MediaDetails> {
  const { data, error } = await supabase
    .from("media")
    .select(mediaSelect)
    .eq("id", mediaId)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw new Error(
      `تعذر تحميل تفاصيل الوسيط: ${error.message}`,
    );
  }

  const row = data as MediaRow;

  const [
    programsResult,
    countriesResult,
  ] = await Promise.all([
    supabase
      .from("programs")
      .select("id, title_ar, title_en")
      .eq("cover_media_id", mediaId)
      .is("deleted_at", null),

    supabase
      .from("countries")
      .select("id, name_ar, name_en")
      .eq("flag_media_id", mediaId)
      .is("deleted_at", null),
  ]);

  if (programsResult.error) {
    throw new Error(
      `تعذر تحميل البرامج المرتبطة: ${programsResult.error.message}`,
    );
  }

  if (countriesResult.error) {
    throw new Error(
      `تعذر تحميل الدول المرتبطة: ${countriesResult.error.message}`,
    );
  }

  return {
    id: row.id,
    fileName: row.file_name,
    bucket: row.bucket,
    path: row.path,
    mimeType:
      row.mime_type ??
      "application/octet-stream",
    altAr: row.alt_ar ?? "",
    altEn: row.alt_en ?? "",
    publicUrl: createPublicUrl(
      supabase,
      row.bucket,
      row.path,
    ),
    createdAt: row.created_at,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    uploadedBy: row.uploaded_by,
    updatedAt: row.updated_at,
    usage: {
      programs: (
        programsResult.data ?? []
      ).map((program) => ({
        id: program.id,
        titleAr: program.title_ar,
        titleEn: program.title_en,
      })),
      countries: (
        countriesResult.data ?? []
      ).map((country) => ({
        id: country.id,
        nameAr: country.name_ar,
        nameEn: country.name_en,
      })),
    },
  };
}

export async function updateMediaAltText(
  supabase: SupabaseClient,
  mediaId: string,
  altAr: string,
  altEn: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("media")
    .update({
      alt_ar: altAr.trim() || null,
      alt_en: altEn.trim() || null,
    })
    .eq("id", mediaId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `تعذر تحديث النص البديل: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم العثور على ملف الوسائط.",
    );
  }
}