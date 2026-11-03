import "server-only";

import { createClient } from "@supabase/supabase-js";

// Anonymous, read-only published content: metadata must never use admin cookies or service keys.
export async function getPublicProgramMetadata(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  try {
    const { data, error } = await client.from("programs")
      .select("title_ar,title_en,summary_ar,summary_en,cover_media:media!programs_cover_media_id_fkey(bucket,path)")
      .eq("slug", slug).eq("status", "published").eq("is_active", true).is("deleted_at", null)
      .abortSignal(AbortSignal.timeout(5000)).retry(false).maybeSingle();
    if (error || !data) return null;
    const media = Array.isArray(data.cover_media) ? data.cover_media[0] : data.cover_media;
    return { ...data, coverUrl: media ? client.storage.from(media.bucket).getPublicUrl(media.path).data.publicUrl : null };
  } catch { return null; }
}
