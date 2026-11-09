"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Play, ArrowUpLeft, Film, X } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { usePresentation } from "../website/usePresentation";
import { languageHref } from "../../core/i18n/public-language";
import {
  type Video,
  categoryLabels,
  videoCategories,
  durationLabel,
} from "./model";
import { listVideos, resolveVideoSource } from "./service";
import styles from "./VideoShowcase.module.css";
import palette from "../../styles/public-content.module.css";
export default function VideoShowcase({
  language,
  gallery = false,
}: {
  language: "ar" | "en";
  gallery?: boolean;
}) {
  const ar = language === "ar",
    client = useMemo(() => createClient("pilgrim"), []),
    section = usePresentation().sections.videos;
  const [active, setActive] = useState<Video | null>(null),
    [category, setCategory] = useState(""),
    [search, setSearch] = useState(""),
    [limit, setLimit] = useState(9);
  const q = useQuery({
    queryKey: ["public", "videos"],
    queryFn: () => listVideos(client),
    staleTime: 60000,
  });
  if (!gallery && !section.visible) return null;
  if (
    !gallery &&
    !q.isPending &&
    !q.isError &&
    !q.data?.some((v) => v.show_on_home)
  )
    return null;
  const rows = (q.data ?? [])
    .filter((v) => gallery || v.show_on_home)
    .filter((v) => !category || v.category === category)
    .filter((v) =>
      [v.title_ar, v.title_en, v.description_ar, v.description_en]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const items = gallery ? rows.slice(0, limit) : rows.slice(0, 4),
    featured = !gallery ? items[0] : undefined;
  function card(v: Video, large = false) {
    return (
      <article
        key={v.id}
        className={`${styles.card} ${large ? styles.featured : ""}`}
      >
        <button
          className={styles.poster}
          onClick={() => setActive(v)}
          aria-label={
            (ar ? "مشاهدة: " : "Watch: ") + (ar ? v.title_ar : v.title_en)
          }
        >
          <Image
            src={v.cover_url}
            alt=""
            fill
            sizes={
              large
                ? "(max-width:760px) 100vw, 720px"
                : "(max-width:760px) 100vw, 380px"
            }
            unoptimized
            style={{
              objectFit: v.orientation === "portrait" ? "contain" : "cover",
            }}
          />
          <span className={styles.play}>
            <Play
              fill="currentColor"
              aria-hidden="true"
              size={large ? 28 : 21}
            />
          </span>
          {v.duration_seconds > 0 && (
            <span className={styles.duration} dir="ltr">
              {durationLabel(v.duration_seconds)}
            </span>
          )}
        </button>
        <div className={styles.copy}>
          <span className={styles.category}>
            {categoryLabels[v.category]?.[ar ? 0 : 1]}
          </span>
          <h3>{ar ? v.title_ar : v.title_en}</h3>
          <p>{ar ? v.description_ar : v.description_en}</p>
          <button className={styles.watch} onClick={() => setActive(v)}>
            <Play size={15} aria-hidden="true" />
            {ar ? "شاهد الفيديو" : "Watch video"}
          </button>
          {v.cta_href && (
            <Link
              className={styles.cta}
              href={languageHref(v.cta_href, language)}
            >
              {(ar ? v.cta_ar : v.cta_en) ||
                (ar ? "اكتشف المزيد" : "Discover more")}
              <ArrowUpLeft aria-hidden="true" size={17} />
            </Link>
          )}
        </div>
      </article>
    );
  }
  return (
    <section
      id="videos"
      className={`${palette.surface} ${styles.section}`}
      dir={ar ? "rtl" : "ltr"}
      aria-labelledby="videos-heading"
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>
              <Film size={17} aria-hidden="true" />
              {ar ? "نور آب بالصورة والحكاية" : "Nour App, in motion"}
            </span>
            <h2 id="videos-heading">{section.title[language]}</h2>
            <p>{section.description[language]}</p>
          </div>
          {!gallery && rows.length > 1 && (
            <Link href={languageHref("/videos", language)}>
              {ar ? "جميع الفيديوهات" : "All videos"}
              <ArrowUpLeft size={19} aria-hidden="true" />
            </Link>
          )}
        </header>
        {gallery && (
          <div className={styles.filters}>
            <label>
              {ar ? "ابحث في الفيديوهات" : "Search videos"}
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setLimit(9);
                }}
                type="search"
              />
            </label>
            <label>
              {ar ? "التصنيف" : "Category"}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setLimit(9);
                }}
              >
                <option value="">{ar ? "كل الفيديوهات" : "All videos"}</option>
                {videoCategories.map((c) => (
                  <option value={c} key={c}>
                    {categoryLabels[c][ar ? 0 : 1]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {q.isPending ? (
          <p role="status">
            {ar ? "جارٍ تحميل الفيديوهات…" : "Loading videos…"}
          </p>
        ) : q.isError ? (
          <div role="alert">
            <p>
              {ar ? "تعذر تحميل الفيديوهات." : "Videos could not be loaded."}
            </p>
            <button onClick={() => void q.refetch()}>
              {ar ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        ) : !items.length ? (
          <p role="status">
            {ar
              ? "لا توجد فيديوهات منشورة مطابقة حاليًا."
              : "No matching published videos yet."}
          </p>
        ) : gallery ? (
          <div className={styles.grid}>{items.map((v) => card(v))}</div>
        ) : (
          <div
            className={`${styles.layout} ${items.length > 1 ? styles.hasSide : ""}`}
          >
            {featured && card(featured, true)}
            {items.length > 1 && (
              <div className={styles.side}>
                {items.slice(1).map((v) => card(v))}
              </div>
            )}
          </div>
        )}
        {gallery && rows.length > limit && (
          <button
            className={styles.more}
            onClick={() => setLimit((n) => n + 9)}
          >
            {ar ? "عرض المزيد" : "Show more"}
          </button>
        )}
        {active && (
          <VideoPlayer
            video={active}
            language={language}
            onClose={() => setActive(null)}
          />
        )}
      </div>
    </section>
  );
}
export function VideoPlayer({
  video,
  language,
  onClose,
  admin = false,
}: {
  video: Video;
  language: "ar" | "en";
  onClose: () => void;
  admin?: boolean;
}) {
  const ar = language === "ar",
    ref = useRef<HTMLDialogElement>(null),
    client = useMemo(() => createClient(admin ? "admin" : "pilgrim"), [admin]);
  const [playbackError, setPlaybackError] = useState(false);
  const sourceQuery = useQuery({
    queryKey: [
      admin ? "admin" : "public",
      "video-source",
      video.id,
      video.updated_at,
    ],
    queryFn: () => resolveVideoSource(client, video),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const source = sourceQuery.data,
    error = sourceQuery.isError || playbackError;
  function retry() {
    setPlaybackError(false);
    void sourceQuery.refetch();
  }
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="playing-video-title"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className={styles.playerHeader}>
        <h3 id="playing-video-title">{ar ? video.title_ar : video.title_en}</h3>
        <button
          onClick={onClose}
          aria-label={ar ? "إغلاق الفيديو" : "Close video"}
          autoFocus
        >
          <X />
        </button>
      </div>
      <div className={styles.screen}>
        {error ? (
          <div role="alert">
            <p>{ar ? "تعذر تشغيل الفيديو." : "Video could not be played."}</p>
            <button onClick={retry}>{ar ? "إعادة المحاولة" : "Retry"}</button>
          </div>
        ) : !source ? (
          <p role="status">{ar ? "جارٍ تجهيز الفيديو…" : "Preparing video…"}</p>
        ) : source.kind === "native" ? (
          <video
            controls
            playsInline
            preload="metadata"
            poster={video.cover_url}
            src={source.url}
            onError={() => setPlaybackError(true)}
            aria-label={ar ? video.title_ar : video.title_en}
          />
        ) : (
          <iframe
            src={source.url}
            title={ar ? video.title_ar : video.title_en}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
      {source?.kind === "embed" && (
        <p className={styles.provider}>
          {ar
            ? "يُشغَّل هذا الفيديو عبر مزوّده الخارجي."
            : "This video plays through its external provider."}
        </p>
      )}
    </dialog>
  );
}
