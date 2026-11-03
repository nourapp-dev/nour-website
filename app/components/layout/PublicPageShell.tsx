"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useLanguage } from "../../../src/core/i18n";
import { languageHref } from "../../../src/core/i18n/public-language";
import usePersistentState from "../../../src/core/hooks/usePersistentState";
import { copy, type Theme, type SectionId } from "../../data/home";
import PublicHeader from "./PublicHeader";
import Footer from "./Footer";

export default function PublicPageShell({ children, activeSection = "programs" }: { children: ReactNode; activeSection?: SectionId }) {
  const { language, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = usePersistentState<Theme>("nour-theme", "light", {
    serialize: (value) => value,
    deserialize: (value) => value === "dark" ? "dark" : "light",
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const t = copy[language];

  return <MotionConfig reducedMotion="user"><div className="nour-redesign programs-shell">
    {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_UI_PREVIEW === "true" && <p className="nour-preview-banner" role="status">{language === "ar" ? "معاينة محلية — جميع البرامج والأسعار والمواعيد بيانات عرض تجريبية وليست عروضًا متاحة." : "Local preview — all programs, prices and dates are display fixtures, not available offers."} <a href="/ui-preview" target="_top">{language === "ar" ? "أدوات الفحص" : "Review controls"}</a></p>}
    <a className="programs-skip" href="#programs-content">{language === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}</a>
    <PublicHeader t={t} language={language} theme={theme} menuOpen={menuOpen} activeSection={activeSection}
      homeHref={languageHref("/", language)}
      navItems={[
        { id: "home", label: language === "ar" ? "الرئيسية" : "Home", href: languageHref("/", language) },
        { id: "programs", label: language === "ar" ? "البرامج" : "Programs", href: languageHref("/programs", language) },
        { id: "journey", label: language === "ar" ? "تطبيق نور آب" : "Nour app", href: languageHref("/get-app", language) },
        { id: "contact", label: language === "ar" ? "تواصل معنا" : "Contact", href: "#contact" },
      ]}
      onLanguageChange={toggleLanguage} onThemeChange={() => setTheme(theme === "light" ? "dark" : "light")}
      onMenuToggle={() => setMenuOpen(!menuOpen)} onMenuClose={() => setMenuOpen(false)} />
    <div id="programs-content" tabIndex={-1}>{children}</div>
    <Footer t={t} language={language} />
  </div></MotionConfig>;
}
