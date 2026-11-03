"use client";
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(notify: () => void) {
  const media = window.matchMedia?.(motionQuery);
  media?.addEventListener("change", notify);
  return () => media?.removeEventListener("change", notify);
}
const readReducedMotion = () => window.matchMedia?.(motionQuery).matches ?? true;
function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
const readVisible = () => document.visibilityState === "visible";
const serverReducedMotion = () => true;
const serverVisible = () => false;
import type { HomeCopy, Language } from "../../data/home";
import type { Presentation } from "../../../src/features/website/presentation";
import { usePresentation } from "../../../src/features/website/usePresentation";
import styles from "./Presentation.module.css";
export default function Showcase({
  language,
  presentation,
}: {
  t?: HomeCopy;
  language: Language;
  presentation?: Presentation;
}) {
  const { showcase } = usePresentation(presentation);
  const screens = showcase.screens.filter((s) => s.visible && s.image);
  const [selected, setSelected] = useState("");
  const current = screens.find((s) => s.id === selected) ?? screens[0];
  const active = screens.findIndex((s) => s.id === current?.id);
  const start = useRef<{ x: number; y: number } | null>(null);
  const uid = useId();
  const ar = language === "ar";
  const viewport = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loadedImage, setLoadedImage] = useState("");
  const [failedImage, setFailedImage] = useState("");
  const reduceMotion = useSyncExternalStore(subscribeMotion, readReducedMotion, serverReducedMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, readVisible, serverVisible);
  const hasScreen = Boolean(current);
  const next = screens.length > 1 ? screens[(active + 1) % screens.length] : undefined;
  const nextId = next?.id;
  const duration = current?.id === "welcome" ? 3000 : 5000;
  const imageReady = Boolean(current && loadedImage === current.image && failedImage !== current.image);
  const running = showcase.visible && !paused && !reduceMotion && inView && pageVisible && imageReady && Boolean(nextId);

  useEffect(() => {
    if (!showcase.visible || !hasScreen || !viewport.current || typeof window.IntersectionObserver === "undefined") return;
    const observer = new window.IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry) setInView(entry.isIntersecting && entry.intersectionRatio >= 0.25);
    }, { threshold: [0, 0.25] });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [showcase.visible, hasScreen]);

  useEffect(() => {
    if (!running || !nextId) return;
    const timer = window.setTimeout(() => setSelected(nextId), duration);
    return () => window.clearTimeout(timer);
  }, [running, nextId, duration, current?.id, language]);

  const pauseForInteraction = (target: EventTarget | null) => {
    if (!(target as HTMLElement | null)?.closest("[data-rotation-control]")) setPaused(true);
  };
  const select = (index: number, focus = false) => {
    const target = screens[(index + screens.length) % screens.length];
    if (!target) return;
    setPaused(true);
    setSelected(target.id);
    if (focus) document.getElementById(`${uid}-${target.id}`)?.focus();
  };
  if (!showcase.visible || !current) return null;
  return (
    <div className={styles.root}>
      <section
        id="showcase"
        onFocusCapture={(event) => pauseForInteraction(event.target)}
        onPointerDownCapture={(event) => pauseForInteraction(event.target)}
        className={styles.showcase}
        dir={ar ? "rtl" : "ltr"}
        aria-labelledby={`${uid}-title`}
      >
        <div className={styles.showGrid}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>
              {ar ? "تطبيق نور آب" : "NourApp"}
            </span>
            <h2 id={`${uid}-title`}>{showcase.title[language]}</h2>
            <p>{showcase.description[language]}</p>
            <div className={styles.features}>
              {screens.slice(0, 3).map((s, i) => (
                <button
                  key={s.id}
                  className={styles.feature}
                  type="button"
                  aria-pressed={s.id === current.id}
                  onClick={() => select(i)}
                >
                  <span aria-hidden="true">0{i + 1}</span>
                  <div>
                    <strong>{s.title[language]}</strong>
                    <small>{s.description[language]}</small>
                  </div>
                </button>
              ))}
            </div>
            {showcase.href && showcase.button[language] && (
              <a className={styles.action} href={showcase.href}>
                {showcase.button[language]}{" "}
                <span aria-hidden="true">{ar ? "←" : "→"}</span>
              </a>
            )}
          </div>
          <div className={styles.stage}>
            <div className={styles.phone} ref={viewport}>
              <div
                className={styles.screen}
                role="tabpanel"
                id={`${uid}-panel`}
                aria-labelledby={`${uid}-${current.id}`}
                tabIndex={0}
                aria-live={paused || reduceMotion ? "polite" : "off"}
                aria-busy={!imageReady && failedImage !== current.image}
                onPointerDown={(e) => {
                  start.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerCancel={() => {
                  start.current = null;
                }}
                onPointerUp={(e) => {
                  const point = start.current;
                  start.current = null;
                  if (!point) return;
                  const dx = e.clientX - point.x,
                    dy = e.clientY - point.y;
                  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy))
                    select(active + (dx < 0 ? (ar ? -1 : 1) : ar ? 1 : -1));
                }}
              >
                <Image
                  key={current.id + current.image}
                  className={styles.screenImage + (imageReady ? " " + styles.screenReady : "")}
                  style={{ animation: reduceMotion ? "none" : undefined }}
                  onLoad={() => { setLoadedImage(current.image); setFailedImage(""); }}
                  onError={() => setFailedImage(current.image)}
                  src={current.image}
                  alt={current.title[language]}
                  fill
                  sizes="310px"
                  unoptimized={!current.image.startsWith("/images/")}
                  draggable={false}
                />
                {!imageReady && <p className={styles.screenStatus} role="status">
                  {failedImage === current.image
                    ? ar ? "تعذر تحميل هذه الشاشة. اختر شاشة أخرى من القائمة." : "This screen could not load. Choose another screen from the list."
                    : ar ? "جارٍ تحميل الشاشة…" : "Loading screen…"}
                </p>}
              </div>
            </div>
            {inView && pageVisible && next && <div className={styles.preloadScreen} aria-hidden="true">
              <Image src={next.image} alt="" fill sizes="310px" loading="eager"
                unoptimized={!next.image.startsWith("/images/")} />
            </div>}
            <p className={styles.previewLabel}>
              {ar ? "معاينة لتجربة التطبيق — التطبيق قريبًا، والحجز عبر الموقع متوقف."
                : "App experience preview — the app is coming soon; website booking is paused."}
            </p>
            {screens.length > 1 && <div className={styles.rotationControls}>
              <button type="button" className={styles.rotationButton} data-rotation-control
                disabled={reduceMotion}
                aria-controls={`${uid}-panel`}
                aria-describedby={reduceMotion ? `${uid}-motion-note` : undefined}
                onClick={() => setPaused(value => !value)}>
                {paused || reduceMotion ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                {paused || reduceMotion
                  ? ar ? "تشغيل العرض التلقائي" : "Play slideshow"
                  : ar ? "إيقاف العرض التلقائي" : "Pause slideshow"}
              </button>
              {reduceMotion && <small id={`${uid}-motion-note`}>
                {ar ? "التنقل اليدوي مفعّل احترامًا لإعداد تقليل الحركة." : "Manual navigation respects your reduced-motion preference."}
              </small>}
            </div>}
            <div
              className={styles.tabs}
              role="tablist"
              aria-label={ar ? "شاشات التطبيق" : "App screens"}
            >
              {screens.map((s, i) => (
                <button
                  key={s.id}
                  id={`${uid}-${s.id}`}
                  role="tab"
                  aria-selected={s.id === current.id}
                  aria-controls={`${uid}-panel`}
                  tabIndex={s.id === current.id ? 0 : -1}
                  className={styles.tab}
                  type="button"
                  onClick={() => select(i)}
                  onKeyDown={(e) => {
                    let index: number | undefined;
                    if (e.key === "ArrowRight") index = i + (ar ? -1 : 1);
                    if (e.key === "ArrowLeft") index = i + (ar ? 1 : -1);
                    if (e.key === "Home") index = 0;
                    if (e.key === "End") index = screens.length - 1;
                    if (index !== undefined) {
                      e.preventDefault();
                      select(index, true);
                    }
                  }}
                >
                  {s.title[language]}
                  {s.id === current.id && <span aria-hidden="true" className={styles.progressTrack}>
                    {running && <span key={current.id + language} className={styles.progressFill}
                      style={{ animationDuration: duration + "ms" }} />}
                  </span>}
                </button>
              ))}
            </div>
            <p className={styles.caption}>{current.description[language]}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
