"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { useLanguage } from "../../src/core/i18n";
import usePrivacyConsent from "../../src/core/privacy/usePrivacyConsent";
import {
  isPublicPrivacyPath, openPrivacySettings, OPEN_PRIVACY_EVENT,
  parseConsent, saveConsent,
} from "../../src/core/privacy/consent";
import styles from "./PrivacyPreferences.module.css";

const subscribeReady = () => () => {};
const ready = () => true;
const notReady = () => false;

export default function PrivacyPreferences() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const pathname = usePathname();
  const raw = usePrivacyConsent();
  const hydrated = useSyncExternalStore(subscribeReady, ready, notReady);
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [notice, setNotice] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const consent = parseConsent(raw);

  useEffect(() => {
    let frame: number | undefined;
    const open = () => {
      returnFocus.current = document.activeElement instanceof window.HTMLElement ? document.activeElement : null;
      setAnalytics(parseConsent(raw)?.analytics ?? false);
      setExpanded(true);
      setOpened(true);
      frame = window.requestAnimationFrame(() => heading.current?.focus());
    };
    window.addEventListener(OPEN_PRIVACY_EVENT, open);
    return () => {
      window.removeEventListener(OPEN_PRIVACY_EVENT, open);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [raw]);

  const publicPath = isPublicPrivacyPath(pathname ?? "/");
  const hasConsent = consent !== null;
  const visible = opened || !consent;
  const finish = useCallback(() => {
    setOpened(false);
    setExpanded(false);
    window.requestAnimationFrame(() => {
      if (returnFocus.current?.isConnected && (!returnFocus.current.matches(".nr-program-privacy-button") || returnFocus.current.getClientRects().length)) returnFocus.current.focus();
      else {
        const barTrigger = document.querySelector<HTMLButtonElement>(".nr-program-privacy-button");
        if (barTrigger?.getClientRects().length) barTrigger.focus();
        else launcher.current?.focus();
      }
      returnFocus.current = null;
    });
  }, []);

  useEffect(() => {
    if (!hydrated || !publicPath || !visible || !hasConsent) return;
    // The panel is non-modal: language/theme controls can hold focus outside it.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      finish();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [hydrated, publicPath, visible, hasConsent, finish]);

  if (!hydrated || !publicPath) return null;
  const choose = (allow: boolean) => {
    setNotice(!saveConsent(allow));
    finish();
  };
  return (
    <div className={styles.root} dir={ar ? "rtl" : "ltr"}>
      {visible ? (
        <section className={styles.panel} role="region" aria-labelledby="privacy-title">
          <header className={styles.heading}>
            <ShieldCheck aria-hidden="true" />
            <h2 id="privacy-title" ref={heading} tabIndex={-1}>{ar ? "خصوصيتك في نور آب" : "Your privacy at NourApp"}</h2>
            {consent && <button type="button" className={styles.close} onClick={finish} aria-label={ar ? "إغلاق دون تغيير" : "Close without changes"}><X aria-hidden="true" /></button>}
          </header>
          <p>{ar
            ? "نستخدم ملفات الارتباط والتخزين المشابه لتشغيل الموقع وحفظ اختياراتك. التحليلات اختيارية ولا تبدأ إلا بموافقتك. يمكنك تصفح البرامج عند رفضها."
            : "We use cookies and similar storage to operate the site and remember your choices. Optional analytics start only with your permission. You can browse programs if you decline."}</p>
          {expanded && (
            <div id="privacy-options" className={styles.options}>
              <div className={styles.option}>
                <strong>{ar ? "التشغيل والتفضيلات التي تختارها" : "Site operation and preferences you select"}</strong>
                <span>{ar ? "مفعّلة دائمًا" : "Always active"}</span>
                <p>{ar ? "تشغيل الجلسات وحفظ اختيار الخصوصية واللغة والمظهر، وتذكّر ظهور شاشة الترحيب." : "Session operation, your privacy choice, language and theme selections, and remembering the welcome screen."}</p>
              </div>
              <label className={styles.option}>
                <span className={styles.checkRow}><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} /><strong>{ar ? "تحليلات الاستخدام" : "Usage analytics"}</strong></span>
                <p>{ar ? "قياس زيارات الصفحات والتفاعل مع الخريطة باستخدام معرّف للمتصفح، لفهم استخدام الموقع." : "Measure page visits and map interactions using a browser identifier to understand site usage."}</p>
              </label>
              <p className={styles.note}>{ar ? "نحفظ اختيارك لمدة 180 يومًا. سحب الموافقة يوقف التسجيل اللاحق ويمسح معرّف التحليلات المحلي؛ لا يحذف زيارات سُجلت سابقًا." : "Your choice lasts 180 days. Withdrawal stops future recording and removes the local analytics identifier; it does not delete previously recorded visits."}</p>
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" onClick={() => choose(true)}>{ar ? "قبول الكل" : "Accept all"}</button>
            <button type="button" onClick={() => choose(false)}>{ar ? "رفض الاختياري" : "Reject optional"}</button>
            {expanded
              ? <button type="button" onClick={() => choose(analytics)}>{ar ? "حفظ اختياراتي" : "Save my choices"}</button>
              : <button type="button" aria-expanded={false} aria-controls="privacy-options" onClick={() => { setAnalytics(consent?.analytics ?? false); setExpanded(true); }}>{ar ? "تخصيص" : "Customize"}</button>}
          </div>
          <Link className={styles.policy} href={"/privacy?lang=" + language}>{ar ? "سياسة الخصوصية" : "Privacy policy"}</Link>
        </section>
      ) : (
        <button ref={launcher} className={styles.launcher} type="button" onClick={openPrivacySettings}>
          <ShieldCheck aria-hidden="true" />{ar ? "إعدادات الخصوصية" : "Privacy settings"}
        </button>
      )}
      {notice && <p className={styles.notice} role="status">{ar ? "تعذّر حفظ الاختيار في المتصفح؛ سيُطبّق لهذه الصفحة فقط." : "Browser storage is unavailable; your choice applies to this page session only."}<button type="button" onClick={() => setNotice(false)} aria-label={ar ? "إغلاق التنبيه" : "Dismiss notice"}>×</button></p>}
    </div>
  );
}
