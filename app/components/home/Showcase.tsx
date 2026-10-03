"use client";
import Image from "next/image";
import { useId, useRef, useState } from "react";
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
  const select = (index: number, focus = false) => {
    const target = screens[(index + screens.length) % screens.length];
    if (!target) return;
    setSelected(target.id);
    if (focus) document.getElementById(`${uid}-${target.id}`)?.focus();
  };
  if (!showcase.visible || !current) return null;
  return (
    <div className={styles.root}>
      <section
        id="showcase"
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
                  onClick={() => setSelected(s.id)}
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
            <div className={styles.phone}>
              <div
                className={styles.screen}
                role="tabpanel"
                id={`${uid}-panel`}
                aria-labelledby={`${uid}-${current.id}`}
                tabIndex={0}
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
                  key={current.image}
                  className={styles.screenImage}
                  src={current.image}
                  alt={current.title[language]}
                  fill
                  sizes="310px"
                  unoptimized
                  draggable={false}
                />
              </div>
            </div>
            {current.preview && (
              <p className={styles.previewLabel}>
                {ar
                  ? "معاينة للتطبيق · البيانات الظاهرة توضيحية"
                  : "App preview · Illustrative data"}
              </p>
            )}
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
