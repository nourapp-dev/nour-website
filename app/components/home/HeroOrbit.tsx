"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Presentation } from "../../../src/features/website/presentation";
import HeroBackground from "./HeroBackground";
import styles from "./HeroOrbit.module.css";

export default function HeroOrbit({ hero, language }: {
  hero: Presentation["hero"];
  language: "ar" | "en";
}) {
  const scene = useRef<HTMLDivElement>(null);
  const ar = language === "ar";

  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    let inView = false;
    const update = () => {
      node.dataset.active = String(inView && !document.hidden);
    };
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      update();
    }, { threshold: 0.15 });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      node.dataset.active = "false";
    };
  }, []);

  const cards = [
    { title: ar ? "اكتشف برنامجك" : "Explore your program", subtitle: ar ? "تفاصيل في مكان واحد" : "Details in one place", icon: "check" },
    { title: ar ? "خيارات الإقامة" : "Accommodation options", subtitle: ar ? "قريب من الحرم" : "Near the Haram", icon: "hotel" },
    { title: ar ? "تفاصيل رحلتك" : "Your trip details", subtitle: ar ? "في مكان واحد" : "In one place", icon: "trip" },
  ];

  return (
    <div ref={scene} className={styles.scene} data-active="false"
      tabIndex={0} role="group" aria-label={ar ? "معاينة تطبيق نور آب" : "Nour App preview"}>
      <HeroBackground orbit />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.ring} aria-hidden="true" />
      <div className={`${styles.phone} ${styles.back} ${styles.animated}`}>
        <Image src={hero.backImage} alt={hero.backAlt[language]}
          unoptimized={!hero.backImage.startsWith("/images/")} width={630} height={630}
          sizes="(max-width: 768px) 220px, 340px" priority />
      </div>
      <div className={`${styles.phone} ${styles.front} ${styles.animated}`}>
        <Image src={hero.frontImage} alt={hero.frontAlt[language]}
          unoptimized={!hero.frontImage.startsWith("/images/")} width={420} height={720}
          sizes="(max-width: 768px) 160px, 230px" priority />
      </div>
      {cards.map((card, index) => (
        <div key={card.icon} className={`${styles.card} ${styles.animated} ${styles[`card${index}`]}`}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {card.icon === "check" ? <path d="m5 12 4 4L19 6" /> : card.icon === "hotel" ? <><path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M2 21h20M8 7h2M14 7h2M10 21v-5h4v5" /></> : <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h5M8 16h7" /></>}
            </svg>
          </span>
          <span><strong>{card.title}</strong><small>{card.subtitle}</small></span>
        </div>
      ))}
    </div>
  );
}
