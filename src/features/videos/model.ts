export const videoCategories = [
  "about",
  "app",
  "programs",
  "experiences",
] as const;
export type VideoCategory = (typeof videoCategories)[number];
export const categoryLabels: Record<VideoCategory, [string, string]> = {
  about: ["عن نور آب", "About Nour App"],
  app: ["شرح التطبيق", "App guides"],
  programs: ["البرامج والرحلات", "Programs and journeys"],
  experiences: ["تجارب المعتمرين", "Pilgrim experiences"],
};
export type Video = {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  source_kind: "link" | "file";
  source_url: string;
  storage_path: string | null;
  cover_url: string;
  category: VideoCategory;
  orientation: "landscape" | "portrait";
  duration_seconds: number;
  status: "draft" | "published" | "hidden";
  show_on_home: boolean;
  is_featured: boolean;
  sort_order: number;
  cta_ar: string;
  cta_en: string;
  cta_href: string;
  updated_at: string;
  deleted_at: string | null;
};
export const emptyVideo = (): Video => ({
  id: crypto.randomUUID(),
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  source_kind: "link",
  source_url: "",
  storage_path: null,
  cover_url: "",
  category: "about",
  orientation: "landscape",
  duration_seconds: 0,
  status: "draft",
  show_on_home: true,
  is_featured: false,
  sort_order: 0,
  cta_ar: "",
  cta_en: "",
  cta_href: "",
  updated_at: "",
  deleted_at: null,
});
export function safeVideoLink(
  value: string,
): { kind: "native" | "embed"; url: string } | null {
  if (!value || /[\\\s\u0000-\u001f]/.test(value)) return null;
  if (/^\/videos\/[a-zA-Z0-9/_-]+\.(mp4|webm)$/.test(value))
    return { kind: "native", url: value };
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port)
      return null;
    let id = "";
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
        u.hostname,
      )
    ) {
      id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : u.pathname === "/watch"
            ? (u.searchParams.get("v") ?? "")
            : (u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)$/)?.[1] ?? "");
      if (/^[\w-]{11}$/.test(id))
        return {
          kind: "embed",
          url: "https://www.youtube-nocookie.com/embed/" + id + "?rel=0",
        };
    }
    if (
      ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(u.hostname)
    ) {
      id = u.pathname.match(/^\/(?:video\/)?(\d+)$/)?.[1] ?? "";
      if (id)
        return {
          kind: "embed",
          url: "https://player.vimeo.com/video/" + id + "?dnt=1",
        };
    }
  } catch {}
  return null;
}
export function safeVideoCta(value: string) {
  return (
    !value ||
    /^\/(?:programs(?:\/[a-z0-9-]+)?|get-app|become-a-partner|videos)$/.test(
      value,
    )
  );
}
export function durationLabel(seconds: number) {
  return seconds > 0
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : "";
}
export function validateVideo(v: Video) {
  if (!v.title_ar.trim() || !v.title_en.trim())
    throw new Error("أكمل العنوان باللغتين / Complete both titles");
  if (v.source_kind === "link" && !safeVideoLink(v.source_url))
    throw new Error(
      "استخدم رابط YouTube أو Vimeo صالحًا / Use a valid YouTube or Vimeo link",
    );
  if (
    v.source_kind === "file" &&
    !/^[\w-]+\/[\w-]+\.(mp4|webm)$/.test(v.storage_path ?? "")
  )
    throw new Error("ارفع ملف الفيديو / Upload the video file");
  if (!safeVideoCta(v.cta_href))
    throw new Error(
      "اختر رابطًا داخليًا صالحًا / Choose a valid internal link",
    );
  if (
    !Number.isInteger(v.sort_order) ||
    v.sort_order < 0 ||
    !Number.isFinite(v.duration_seconds) ||
    v.duration_seconds < 0
  )
    throw new Error("راجع الترتيب والمدة / Check order and duration");
  if (v.status === "published" && !v.cover_url)
    throw new Error(
      "أضف صورة الغلاف قبل النشر / Add a poster before publishing",
    );
}
