"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./SiteIntro.module.css";

type SiteIntroProps = { language: "ar" | "en" };

const SESSION_KEY = "nour-welcome-seen";
// Keeps navigation quiet even when the browser blocks session storage.
let shownInThisPage = false;

export default function SiteIntro({ language }: SiteIntroProps) {
  const reduceMotion = useReducedMotion();
  // Server rendering and hydration never cover the page before preferences are known.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let closeTimer: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      if (reduceMotion !== false) {
        setVisible(false);
        return;
      }
      let seen = shownInThisPage;
      try {
        seen ||= window.sessionStorage.getItem(SESSION_KEY) === "1";
      } catch {
        // The intro is optional; blocked storage must not prevent browsing.
      }
      if (seen) {
        setVisible(false);
        return;
      }
      shownInThisPage = true;
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // The in-memory fallback still avoids replay on client navigation.
      }
      setVisible(true);
      closeTimer = window.setTimeout(() => setVisible(false), 820);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(closeTimer);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (!visible) return;
    const skipOnKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Tab") setVisible(false);
    };
    window.addEventListener("keydown", skipOnKey);
    return () => window.removeEventListener("keydown", skipOnKey);
  }, [visible]);

  const ar = language === "ar";
  return (
    <AnimatePresence>
      {visible && !reduceMotion && (
        <motion.div
          className={"nr-site-intro " + styles.screen}
          dir={ar ? "rtl" : "ltr"}
          lang={language}
          role="region"
          aria-label={ar ? "مرحبًا بك في نور آب" : "Welcome to NourApp"}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <motion.div
            className={styles.content}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <Image
              src="/images/brand/nour-stacked-light.svg"
              alt="NourApp"
              width={850}
              height={880}
              priority
              className={styles.logo}
            />
            <p>{ar ? "رفيقك لرحلة السعادة" : "Your companion for a joyful journey"}</p>
          </motion.div>
          <button
            type="button"
            className={"nr-site-intro-skip " + styles.skip}
            onClick={() => setVisible(false)}
          >
            {ar ? "تخطَّ المقدمة" : "Skip intro"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
