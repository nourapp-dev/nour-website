"use client";

import { useEffect, useRef } from "react";
import styles from "./HeroBackground.module.css";

// Rays follow the existing decorative SVG, from its apex to its outer vertices.
const rayEnds = [
  [20, 134], [49, 150], [67, 161], [116, 189], [132, 198],
  [182, 227], [199, 238], [261, 238], [278, 227], [328, 198],
  [344, 189], [393, 161], [411, 150], [441, 134],
];

export default function HeroBackground({ orbit = false }: { orbit?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let inView = false;
    const update = () => {
      node.dataset.active = String(inView && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      update();
    }, { threshold: 0 });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      node.dataset.active = "false";
    };
  }, []);

  return (
    <div ref={ref} className={orbit ? styles.orbitBackground : styles.background} data-active="false" aria-hidden="true">
      {orbit && <svg className={styles.shimmer} viewBox="0 0 460 270" fill="none" focusable="false">
        {rayEnds.map(([x, y]) => (
          <path key={x} className={styles.ray} d={`M230 10L${x} ${y}`} pathLength={100} />
        ))}
        <path className={styles.gold} d="M200 247 230 264 260 247" pathLength={100} />
      </svg>}
    </div>
  );
}

