"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import usePersistentState from "../src/core/hooks/usePersistentState";
import { useLanguage } from "../src/core/i18n";
import SiteEnhancements from "./components/SiteEnhancements";
import PublicHeader from "./components/layout/PublicHeader";
import Footer from "./components/layout/Footer";
import Hero from "./components/home/Hero";
import ProgramsPreview from "./components/home/ProgramsPreview";
import Services from "./components/home/Services";
import NourWorldMap from "./components/home/why-nour/NourWorldMapMobileLayout";
import Journey from "./components/home/Journey";
import Showcase from "./components/home/Showcase";
import WhyNour from "./components/home/WhyNour";
import Statistics from "./components/home/NourStatistics";
import CeoMessage from "./components/home/CeoMessage";
import ArticlesPreview from "./components/home/ArticlesPreview";
import Payments from "./components/home/Payments";
import CTA from "./components/home/CTA";
import { copy, sectionIds, type SectionId, type Theme } from "./data/home";

export default function Home() {
  const { language, toggleLanguage } = useLanguage();
  const [theme, setTheme] = usePersistentState<Theme>("nour-theme", "light", {
    serialize: (value) => value,
    deserialize: (value) => value === "dark" ? "dark" : "light",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const t = copy[language];
  const navItems = useMemo(
    () => sectionIds.map((id, index) => ({ id, label: t.nav[index] })),
    [t],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
          ?.target.id as SectionId | undefined;
        if (current) setActiveSection(current);
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.05, 0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <main className="nour-redesign">
      <SiteEnhancements />
      <PublicHeader
        t={t}
        language={language}
        theme={theme}
        menuOpen={menuOpen}
        activeSection={activeSection}
        navItems={navItems}
        onLanguageChange={toggleLanguage}
        onThemeChange={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        onMenuToggle={() => setMenuOpen((current) => !current)}
        onMenuClose={() => setMenuOpen(false)}
      />
      <Hero t={t} />
      <ProgramsPreview language={language} />
      <Services language={language} />
      <div id="world-map">
        <NourWorldMap language={language} />
      </div>
      <Journey t={t} language={language} />
      <Showcase
        t={t}
        language={language}
      />
      <div id="about">
        <WhyNour language={language} />
      </div>
      <Statistics language={language} />
      <CeoMessage language={language} />
      <ArticlesPreview language={language} />
      <Payments language={language} />
      <CTA t={t} language={language} />
      <Footer t={t} language={language} />

      <style jsx global>{`
        .nr-map-focus-line {
          --nr-journey-dot-size: 9px;
        }

        .nr-map-focus-line > i {
          display: none !important;
        }

        .nr-map-focus-line::after {
          content: "";
          position: absolute;
          z-index: 6;
          top: 50%;
          left: 0;
          right: auto;
          width: var(--nr-journey-dot-size);
          height: var(--nr-journey-dot-size);
          transform: translateY(-50%);
          border: 2px solid rgba(255, 255, 255, 0.92);
          border-radius: 50%;
          background: #ffc313;
          box-shadow:
            0 0 0 4px rgba(255, 195, 19, 0.2),
            0 0 20px rgba(255, 195, 19, 0.95);
          animation: nrJourneyDotLtr 2.35s linear infinite;
          will-change: left, right;
        }

        [dir="rtl"] .nr-map-focus-line::after {
          left: auto;
          right: 0;
          animation-name: nrJourneyDotRtl;
        }

        @keyframes nrJourneyDotLtr {
          from {
            left: 0;
          }
          to {
            left: calc(100% - var(--nr-journey-dot-size));
          }
        }

        @keyframes nrJourneyDotRtl {
          from {
            right: 0;
          }
          to {
            right: calc(100% - var(--nr-journey-dot-size));
          }
        }

        @media (max-width: 760px) {
          .nr-map-focus-line {
            --nr-journey-dot-size: 11px;
            min-width: 54px;
            height: 3px !important;
          }

          .nr-map-focus-line::after {
            border-width: 2px;
            box-shadow:
              0 0 0 5px rgba(255, 195, 19, 0.22),
              0 0 24px rgba(255, 195, 19, 1);
          }
        }
      `}</style>
    </main>
    </MotionConfig>
  );
}
