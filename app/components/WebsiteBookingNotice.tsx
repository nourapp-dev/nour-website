"use client";

import { Info } from "lucide-react";
import { WEBSITE_BOOKING_ENABLED, websiteBookingCopy } from "../../src/core/config/website-booking";

export default function WebsiteBookingNotice({ language, compact = false }: { language: "ar" | "en"; compact?: boolean }) {
  if (WEBSITE_BOOKING_ENABLED) return null;
  const copy = websiteBookingCopy[language];

  return (
    <div className={`nr-booking-notice${compact ? " nr-booking-notice-compact" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <Info size={20} aria-hidden="true" />
      <div>
        <strong>{copy.title}</strong>
        {!compact ? <div className="nr-booking-notice-description">{copy.description}</div> : null}
      </div>
      <style jsx>{`
        .nr-booking-notice { display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; padding: 16px; border: 1px solid #d2e3f8; border-inline-start: 4px solid #ffc313; border-radius: 14px; background: #f0f6ff; color: #173557; text-align: start; }
        .nr-booking-notice :global(svg) { flex: 0 0 auto; margin-top: 3px; color: #176fe8; }
        .nr-booking-notice strong { display: block; font-size: 14px; font-weight: 800; line-height: 1.7; }
        .nr-booking-notice-description { margin-top: 4px; color: #4c647f; font-size: 13px; line-height: 1.8; }
        .nr-booking-notice-compact { margin-top: 12px; padding: 10px 12px; }
        .nr-booking-notice-compact strong { font-size: 12px; }
      `}</style>
    </div>
  );
}
