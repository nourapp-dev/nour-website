"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type {
  HomeCopy,
  Language,
  SectionId,
  Theme,
} from "../../data/home";

type Props = {
  t: HomeCopy;
  language: Language;
  theme: Theme;
  menuOpen: boolean;
  activeSection: SectionId;
  navItems: { id: SectionId; label: string }[];
  accountHref: string;
  accountLabel: string;
  onLanguageChange: () => void;
  onThemeChange: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
};

export default function Header({
  t,
  language,
  theme,
  menuOpen,
  activeSection,
  navItems,
  accountHref,
  accountLabel,
  onLanguageChange,
  onThemeChange,
  onMenuToggle,
  onMenuClose,
}: Props) {
  const menuButton = useRef<HTMLButtonElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      setIsScrolled(currentScrollY > 24);

      // Always keep the header visible near the top of the page.
      if (currentScrollY <= 90) {
        setIsHeaderHidden(false);
      } else if (!menuOpen) {
        // Ignore tiny scroll movements to prevent jitter.
        if (delta > 6) {
          setIsHeaderHidden(true);
        } else if (delta < -6) {
          setIsHeaderHidden(false);
        }
      } else {
        // Never hide the header while the mobile menu is open.
        setIsHeaderHidden(false);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    updateHeader();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    const closeMenuOnDesktop = () => {
      if (window.innerWidth > 1180 && menuOpen) {
        onMenuClose();
      }
    };

    window.addEventListener("resize", closeMenuOnDesktop);
    return () => window.removeEventListener("resize", closeMenuOnDesktop);
  }, [menuOpen, onMenuClose]);

  const navClass = (id: SectionId) =>
    activeSection === id ? "is-active" : undefined;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMenuClose();
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen, onMenuClose]);

  return (
    <>
      <header
        className={`nr-v2-header ${isScrolled ? "is-scrolled" : ""} ${
          isHeaderHidden && !menuOpen ? "is-hidden" : ""
        }`}
      >
        <div className="nr-v2-topbar">
          <div className="nr-container nr-v2-topbar-inner">
            <div className="nr-v2-trust-items">
              <span>
                <CheckIcon />
                {language === "ar" ? "دعم متواصل" : "Continuous support"}
              </span>

              <span>
                <ShieldIcon />
                {language === "ar" ? "دفع آمن" : "Secure payments"}
              </span>

              <span className="nr-v2-topbar-hide-mobile">
                <GlobeIcon />
                {language === "ar"
                  ? "خدمة بالعربية والإنجليزية"
                  : "Arabic and English service"}
              </span>
            </div>

            <a className="nr-v2-phone" href="tel:+966567488377" dir="ltr">
              +966 56 748 8377
            </a>
          </div>
        </div>

        <div className="nr-v2-navbar">
          <div className="nr-container nr-v2-nav-inner">
            <a
              className="nr-v2-logo"
              href="#home"
              aria-label={language === "ar" ? "العودة للرئيسية" : "Back home"}
              onClick={onMenuClose}
            >
              <Image
                src="/images/site/v-logo.png"
                alt="NourApp"
                width={160}
                height={64}
                priority
              />
            </a>

            <nav
              className="nr-v2-desktop-nav"
              aria-label={
                language === "ar" ? "التنقل الرئيسي" : "Main navigation"
              }
            >
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={navClass(item.id)}
                  aria-current={
                    activeSection === item.id ? "location" : undefined
                  }
                >
                  {item.label}
                </a>
              ))}

            </nav>

            <div className="nr-v2-actions">
              <button
                type="button"
                className="nr-v2-language"
                onClick={onLanguageChange}
                aria-label={
                  language === "ar"
                    ? "Switch to English"
                    : "التبديل إلى العربية"
                }
              >
                <GlobeIcon />
                <span>{t.lang}</span>
              </button>

              <button
                type="button"
                className="nr-v2-icon-button"
                onClick={onThemeChange}
                aria-label={
                  language === "ar"
                    ? "تغيير مظهر الموقع"
                    : "Change website theme"
                }
              >
                {theme === "light" ? <MoonIcon /> : <SunIcon />}
              </button>

              <Link className="nr-v2-primary-action" href={accountHref}>
                <span>{accountLabel}</span>
                <ArrowIcon language={language} />
              </Link>

              <button
                type="button"
                ref={menuButton}
                className={`nr-v2-menu-button ${
                  menuOpen ? "is-open" : ""
                }`}
                onClick={onMenuToggle}
                aria-label={
                  language === "ar" ? (menuOpen ? "إغلاق القائمة" : "فتح القائمة") : (menuOpen ? "Close navigation" : "Open navigation")
                }
                aria-expanded={menuOpen}
                aria-controls="nr-v2-mobile-menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="nr-v2-mobile-menu"
              className="nr-v2-mobile-shell"
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav
                className="nr-container nr-v2-mobile-nav"
                aria-label={
                  language === "ar" ? "قائمة الجوال" : "Mobile navigation"
                }
              >
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={navClass(item.id)}
                    aria-current={
                      activeSection === item.id ? "location" : undefined
                    }
                    onClick={onMenuClose}
                  >
                    <span>{item.label}</span>
                    <ArrowIcon language={language} />
                  </a>
                ))}

                <div className="nr-v2-mobile-controls">
                  <button type="button" onClick={onLanguageChange}>
                    <GlobeIcon />
                    {t.lang}
                  </button>

                  <button type="button" onClick={onThemeChange}>
                    {theme === "light" ? <MoonIcon /> : <SunIcon />}
                    {language === "ar"
                      ? theme === "light"
                        ? "الوضع الليلي"
                        : "الوضع النهاري"
                      : theme === "light"
                        ? "Dark mode"
                        : "Light mode"}
                  </button>
                </div>

                <Link
                  className="nr-v2-mobile-cta"
                  href={accountHref}
                  onClick={onMenuClose}
                >
                  <span>{accountLabel}</span>
                  <ArrowIcon language={language} />
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <style jsx global>{`
        .nr-v2-header a:focus-visible, .nr-v2-header button:focus-visible { outline: 3px solid #176fe8; outline-offset: 4px; }
        .nr-v2-mobile-shell { max-height: calc(100dvh - 100px); overflow-y: auto !important; }

        .nr-v2-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          transform: translateY(0);
          will-change: transform;
          transition:
            box-shadow 0.25s ease,
            transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .nr-v2-header.is-scrolled {
          box-shadow: 0 16px 44px rgba(9, 45, 92, 0.12);
        }

        .nr-v2-header.is-hidden {
          transform: translateY(-100%);
          box-shadow: none;
        }

        .nr-v2-topbar {
          min-height: 34px;
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.9);
          background: #071e3d;
          font-size: 12px;
          font-weight: 700;
        }

        .nr-v2-topbar-inner,
        .nr-v2-trust-items,
        .nr-v2-trust-items span,
        .nr-v2-actions,
        .nr-v2-language,
        .nr-v2-primary-action,
        .nr-v2-mobile-controls button,
        .nr-v2-mobile-cta {
          display: flex;
          align-items: center;
        }

        .nr-v2-topbar-inner {
          justify-content: space-between;
          gap: 20px;
        }

        .nr-v2-trust-items {
          gap: 24px;
        }

        .nr-v2-trust-items span {
          gap: 6px;
          white-space: nowrap;
        }

        .nr-v2-trust-items svg,
        .nr-v2-phone svg {
          width: 14px;
          height: 14px;
          color: #ffc313;
        }

        .nr-v2-phone {
          color: rgba(255, 255, 255, 0.92);
          letter-spacing: 0.02em;
          transition: color 0.2s ease;
        }

        .nr-v2-phone:hover {
          color: #ffc313;
        }

        .nr-v2-navbar {
          border-bottom: 1px solid var(--nr-border);
          background: color-mix(in srgb, var(--nr-bg) 92%, transparent);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nr-v2-nav-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 26px;
          transition: min-height 0.25s ease;
        }

        .nr-v2-header.is-scrolled .nr-v2-nav-inner {
          min-height: 66px;
        }

        .nr-v2-logo {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }

        .nr-v2-logo img {
          width: 72px;
          height: 58px;
          padding: 5px;
          border-radius: 12px;
          object-fit: contain;
          background: #ffffff;
          transition:
            width 0.25s ease,
            height 0.25s ease,
            transform 0.25s ease;
        }

        .nr-v2-logo:hover img {
          transform: translateY(-2px);
        }

        .nr-v2-header.is-scrolled .nr-v2-logo img {
          width: 64px;
          height: 52px;
        }

        .nr-v2-desktop-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(18px, 2vw, 30px);
          margin-inline: auto;
        }

        .nr-v2-desktop-nav a {
          position: relative;
          padding-block: 10px;
          color: var(--nr-text);
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.2s ease;
        }

        .nr-v2-desktop-nav a::after {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          bottom: 3px;
          width: 0;
          height: 3px;
          border-radius: 999px;
          background: #ffc313;
          transition: width 0.25s ease;
        }

        .nr-v2-desktop-nav a:hover,
        .nr-v2-desktop-nav a.is-active {
          color: #176fe8;
        }

        .nr-v2-desktop-nav a:hover::after,
        .nr-v2-desktop-nav a.is-active::after {
          width: 100%;
        }

        .nr-v2-desktop-nav .nr-v2-route-link {
          color: #0b4ead;
        }

        .nr-v2-desktop-nav .nr-v2-route-link:last-child {
          color: #8a6500;
        }

        .nr-v2-actions {
          flex: 0 0 auto;
          gap: 8px;
        }

        .nr-v2-language,
        .nr-v2-icon-button,
        .nr-v2-menu-button {
          border: 1px solid var(--nr-border);
          color: var(--nr-text);
          background: var(--nr-card);
          cursor: pointer;
        }

        .nr-v2-language {
          min-height: 42px;
          gap: 7px;
          padding-inline: 13px;
          border-radius: 13px;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .nr-v2-language svg {
          width: 17px;
          height: 17px;
        }

        .nr-v2-icon-button,
        .nr-v2-menu-button {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 13px;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .nr-v2-icon-button svg {
          width: 19px;
          height: 19px;
        }

        .nr-v2-language:hover,
        .nr-v2-icon-button:hover,
        .nr-v2-menu-button:hover {
          transform: translateY(-2px);
          border-color: #176fe8;
        }

        .nr-v2-primary-action {
          min-height: 44px;
          justify-content: center;
          gap: 9px;
          padding-inline: 18px;
          border-radius: 14px;
          color: #102b4e;
          background: #ffc313;
          box-shadow: 0 12px 26px rgba(255, 195, 19, 0.24);
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .nr-v2-primary-action svg,
        .nr-v2-mobile-cta svg,
        .nr-v2-mobile-nav > a svg,
        .nr-v2-mobile-route-link svg {
          width: 17px;
          height: 17px;
          transition: transform 0.2s ease;
        }

        .nr-v2-primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(255, 195, 19, 0.32);
        }

        html[dir="rtl"] .nr-v2-primary-action:hover svg,
        html[dir="rtl"] .nr-v2-mobile-cta:hover svg {
          transform: translateX(-3px);
        }

        html[dir="ltr"] .nr-v2-primary-action:hover svg,
        html[dir="ltr"] .nr-v2-mobile-cta:hover svg {
          transform: translateX(3px);
        }

        .nr-v2-menu-button {
          display: none;
        }

        .nr-v2-menu-button span {
          width: 18px;
          height: 2px;
          display: block;
          margin: 2px auto;
          border-radius: 999px;
          background: currentColor;
          transition:
            transform 0.24s ease,
            opacity 0.2s ease;
        }

        .nr-v2-menu-button.is-open span:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }

        .nr-v2-menu-button.is-open span:nth-child(2) {
          opacity: 0;
        }

        .nr-v2-menu-button.is-open span:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }

        .nr-v2-mobile-shell {
          overflow: hidden;
          border-bottom: 1px solid var(--nr-border);
          background: color-mix(in srgb, var(--nr-bg) 97%, transparent);
          box-shadow: 0 24px 45px rgba(9, 45, 92, 0.12);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .nr-v2-mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding-block: 14px 22px;
        }

        .nr-v2-mobile-nav > a:not(.nr-v2-mobile-cta) {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 14px;
          border-radius: 13px;
          color: var(--nr-text);
          font-weight: 800;
          transition:
            color 0.2s ease,
            background 0.2s ease;
        }

        .nr-v2-mobile-route-link {
          border: 1px solid color-mix(in srgb, #176fe8 18%, var(--nr-border));
          background: color-mix(in srgb, #176fe8 5%, var(--nr-card));
        }

        .nr-v2-mobile-route-link + .nr-v2-mobile-route-link {
          border-color: color-mix(in srgb, #ffc313 30%, var(--nr-border));
          background: color-mix(in srgb, #ffc313 7%, var(--nr-card));
        }

        .nr-v2-mobile-nav > a:hover,
        .nr-v2-mobile-nav > a.is-active {
          color: #176fe8;
          background: var(--nr-soft);
        }

        .nr-v2-mobile-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 6px;
        }

        .nr-v2-mobile-controls button {
          min-height: 44px;
          justify-content: center;
          gap: 7px;
          border: 1px solid var(--nr-border);
          border-radius: 13px;
          color: var(--nr-text);
          background: var(--nr-card);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .nr-v2-mobile-controls svg {
          width: 17px;
          height: 17px;
        }

        .nr-v2-mobile-cta {
          min-height: 50px;
          justify-content: center;
          gap: 9px;
          margin-top: 5px;
          border-radius: 14px;
          color: #102b4e;
          background: #ffc313;
          font-weight: 900;
          box-shadow: 0 12px 28px rgba(255, 195, 19, 0.2);
        }

        @media (max-width: 1120px) {
          .nr-v2-desktop-nav {
            gap: 17px;
          }

          .nr-v2-desktop-nav a {
            font-size: 13px;
          }

          .nr-v2-language span {
            display: none;
          }

          .nr-v2-language {
            width: 42px;
            justify-content: center;
            padding: 0;
          }
        }

        @media (max-width: 1180px) {
          .nr-v2-desktop-nav,
          .nr-v2-primary-action {
            display: none;
          }

          .nr-v2-menu-button {
            display: block;
          }

          .nr-v2-nav-inner {
            min-height: 68px;
          }

          .nr-v2-header.is-scrolled .nr-v2-nav-inner {
            min-height: 62px;
          }
        }

        @media (max-width: 680px) {
          .nr-v2-topbar {
            min-height: 31px;
          }

          .nr-v2-trust-items {
            gap: 13px;
          }

          .nr-v2-topbar-hide-mobile,
          .nr-v2-phone {
            display: none;
          }

          .nr-v2-topbar-inner {
            justify-content: center;
          }

          .nr-v2-logo img {
            width: 62px;
            height: 51px;
          }

          .nr-v2-language,
          .nr-v2-icon-button,
          .nr-v2-menu-button {
            width: 38px;
            height: 38px;
            min-height: 38px;
            border-radius: 11px;
          }

          .nr-v2-actions {
            gap: 5px;
          }
        }

        @media (max-width: 420px) {
          .nr-v2-topbar-inner {
            width: min(100% - 18px, 1180px);
          }

          .nr-v2-trust-items {
            width: 100%;
            justify-content: space-between;
            gap: 8px;
          }

          .nr-v2-trust-items span {
            font-size: 10px;
          }

          .nr-v2-nav-inner {
            width: min(100% - 20px, 1180px);
            gap: 8px;
          }

          .nr-v2-mobile-controls {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-v2-header {
            transition: none !important;
          }

          .nr-v2-header *,
          .nr-v2-header *::before,
          .nr-v2-header *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path
        d="m12 3 7 3v5c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V6l7-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21M12 3C9.8 5.5 8.7 8.5 8.7 12S9.8 18.5 12 21" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path
        d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon({ language }: { language: Language }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      {language === "ar" ? (
        <path d="M19 12H5m6 6-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}