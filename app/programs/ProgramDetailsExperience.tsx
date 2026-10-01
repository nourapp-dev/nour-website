"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, MessageCircle, Smartphone } from "lucide-react";
import { WEBSITE_BOOKING_ENABLED } from "../../src/core/config/website-booking";
import { useLanguage } from "../../src/core/i18n";

const SECTION_IDS = ["overview", "hotels", "flights", "transport", "visas"] as const;

export default function ProgramDetailsExperience() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const pathname = usePathname();
  const isDetailsRoute = /^\/programs\/[^/]+\/?$/.test(pathname);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [bookingHref, setBookingHref] = useState("");
  const [priceText, setPriceText] = useState("");

  useEffect(() => {
    if (!isDetailsRoute) return;

    const syncDetails = () => {
      const booking = document.querySelector<HTMLAnchorElement>(".nr-program-details-book");
      const price = document.querySelector<HTMLElement>(".nr-program-details-booking > strong");

      if (booking?.href) setBookingHref(booking.href);
      if (price?.textContent) setPriceText(price.textContent.replace(/\s+/g, " ").trim());
    };

    syncDetails();

    const observer = new MutationObserver(syncDetails);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });

    return () => observer.disconnect();
  }, [isDetailsRoute]);

  useEffect(() => {
    if (!isDetailsRoute) return;

    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      {
        rootMargin: "-20% 0px -62% 0px",
        threshold: [0.08, 0.2, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isDetailsRoute]);

  useEffect(() => {
    if (!isDetailsRoute) return;

    const links = document.querySelectorAll<HTMLAnchorElement>(
      ".nr-program-details-subnav a[href^='#']",
    );

    links.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const isActive = id === activeSection;
      link.dataset.active = isActive ? "true" : "false";
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, [activeSection, isDetailsRoute]);

  if (!isDetailsRoute) return null;

  return (
    <>
      {bookingHref ? (
        <aside className="nr-program-mobile-booking" aria-label={isArabic ? "معلومات البرنامج" : "Program information"}>
          <div>
            <span>
              <CheckCircle2 aria-hidden="true" />
              {WEBSITE_BOOKING_ENABLED ? (isArabic ? "الحجز متاح عبر التطبيق" : "Booking available in the app") : (isArabic ? "الحجز متوقف مؤقتًا" : "Website booking paused")}
            </span>
            {priceText ? <strong>{priceText}</strong> : null}
          </div>

          <a href={bookingHref}>
            {WEBSITE_BOOKING_ENABLED ? <Smartphone aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
            {WEBSITE_BOOKING_ENABLED ? (isArabic ? "احجز الآن" : "Book now") : (isArabic ? "تواصل معنا" : "Contact us")}
          </a>
        </aside>
      ) : null}

      <style jsx global>{`
        .nr-program-details-subnav a[data-active="true"] {
          color: #176fe8 !important;
          background: rgba(23, 111, 232, 0.09) !important;
          box-shadow: inset 0 0 0 1px rgba(23, 111, 232, 0.12);
        }

        .nr-program-details-subnav a:focus-visible,
        .nr-program-details-book:focus-visible,
        .nr-program-mobile-booking a:focus-visible {
          outline: 3px solid rgba(23, 111, 232, 0.32);
          outline-offset: 3px;
        }

        .nr-program-mobile-booking {
          display: none;
        }

        @media (max-width: 900px) {
          .nr-program-details {
            padding-bottom: 94px;
          }

          .nr-program-mobile-booking {
            position: fixed;
            z-index: 70;
            inset-inline: 12px;
            bottom: calc(10px + env(safe-area-inset-bottom));
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-height: 72px;
            padding: 10px 10px 10px 14px;
            border: 1px solid rgba(255, 255, 255, 0.72);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.96);
            box-shadow: 0 18px 48px rgba(12, 42, 77, 0.2);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .nr-program-mobile-booking > div {
            min-width: 0;
            display: grid;
            gap: 3px;
          }

          .nr-program-mobile-booking > div > span {
            display: flex;
            align-items: center;
            gap: 5px;
            color: #687b92;
            font-size: 10px;
            font-weight: 800;
          }

          .nr-program-mobile-booking > div > span svg {
            width: 14px;
            height: 14px;
            color: #176fe8;
          }

          .nr-program-mobile-booking strong {
            overflow: hidden;
            color: #14253d;
            font-size: 15px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .nr-program-mobile-booking > a {
            flex: 0 0 auto;
            min-height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding-inline: 17px;
            border-radius: 14px;
            color: #14355f;
            background: #ffc313;
            box-shadow: 0 10px 26px rgba(255, 195, 19, 0.3);
            text-decoration: none;
            font-size: 12px;
            font-weight: 900;
          }

          .nr-program-mobile-booking > a svg {
            width: 17px;
            height: 17px;
          }
        }

        @media (max-width: 420px) {
          .nr-program-mobile-booking {
            inset-inline: 8px;
            gap: 8px;
            min-height: 68px;
            padding: 8px 8px 8px 11px;
            border-radius: 17px;
          }

          .nr-program-mobile-booking > div > span {
            font-size: 9px;
          }

          .nr-program-mobile-booking strong {
            font-size: 13px;
          }

          .nr-program-mobile-booking > a {
            min-height: 46px;
            padding-inline: 13px;
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nr-program-details-subnav a,
          .nr-program-mobile-booking a {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
}
