"use client";

import { useEffect, useRef } from "react";
import styles from "./DownloadOrnament.module.css";

export default function DownloadOrnament() {
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
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      node.dataset.active = "false";
    };
  }, []);

  return (
    <div ref={ref} className={styles.window} data-active="false" aria-hidden="true">
      <div className={styles.wheel} />
    </div>
  );
}
