import type { SupabaseClient } from "@supabase/supabase-js";
import { safeImage } from "../website/presentation";
import { type Video, validateVideo, safeVideoLink } from "./model";
export async function listVideos(
  client: SupabaseClient,
  admin = false,
  trash = false,
) {
  let q = client
    .from("videos")
    .select(
      "id,title_ar,title_en,description_ar,description_en,source_kind,source_url,storage_path,cover_url,category,orientation,duration_seconds,status,show_on_home,is_featured,sort_order,cta_ar,cta_en,cta_href,updated_at,deleted_at",
    )
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });
  q = trash ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
  if (!admin) q = q.eq("status", "published");
  const r = await q;
  if (r.error) throw r.error;
  return (r.data ?? []) as Video[];
}
export async function saveVideo(
  client: SupabaseClient,
  video: Video,
  exists: boolean,
) {
  validateVideo(video);
  if (video.cover_url && !safeImage(video.cover_url))
    throw new Error("صورة غلاف غير صالحة / Invalid poster");
  const { updated_at, deleted_at, is_featured, ...fields } = video;
  void updated_at;
  void deleted_at;
  void is_featured;
  const q = exists
    ? client
        .from("videos")
        .update(fields)
        .eq("id", video.id)
        .eq("updated_at", video.updated_at)
        .is("deleted_at", null)
    : client.from("videos").insert(fields);
  const r = await q.select("id").maybeSingle();
  if (r.error) throw r.error;
  if (!r.data)
    throw new Error(
      "تغير الفيديو، حدّث القائمة وحاول مجددًا / Video changed; refresh and retry",
    );
}
export async function setFeaturedVideo(client: SupabaseClient, id: string) {
  const r = await client.rpc("set_featured_video", { video_id: id });
  if (r.error) throw r.error;
}
export async function resolveVideoSource(client: SupabaseClient, v: Video) {
  if (v.source_kind === "file") {
    const r = await client.storage
      .from("videos")
      .createSignedUrl(v.storage_path ?? "", 600);
    if (r.error) throw r.error;
    return { kind: "native" as const, url: r.data.signedUrl };
  }
  const result = safeVideoLink(v.source_url);
  if (!result) throw new Error("رابط غير صالح / Invalid video link");
  return result;
}
export async function uploadVideo(
  client: SupabaseClient,
  id: string,
  file: File,
) {
  if (
    !["video/mp4", "video/webm"].includes(file.type) ||
    file.size > 50 * 1024 * 1024
  )
    throw new Error("MP4 أو WebM حتى 50MB / MP4 or WebM, max 50MB");
  const path = `${id}/${crypto.randomUUID()}.${file.type === "video/mp4" ? "mp4" : "webm"}`;
  const r = await client.storage
    .from("videos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (r.error) throw r.error;
  return path;
}
export async function archiveVideo(
  client: SupabaseClient,
  v: Video,
  restore = false,
) {
  const r = await client
    .from("videos")
    .update({
      deleted_at: restore ? null : new Date().toISOString(),
      ...(restore ? { status: "draft", is_featured: false } : {}),
    })
    .eq("id", v.id)
    .eq("updated_at", v.updated_at)
    .select("id")
    .maybeSingle();
  if (r.error) throw r.error;
  if (!r.data)
    throw new Error("تغير الفيديو؛ حدّث القائمة / Video changed; refresh");
}
