"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WEBSITE_BOOKING_ENABLED } from "../../src/core/config/website-booking";
import ProgramDetailsExperience from "./ProgramDetailsExperience";
import ProgramStructuredContent from "./ProgramStructuredContent";
import ProgramDepartures from "./ProgramDepartures";
import ProgramBookingSelector from "./ProgramBookingSelector";
import ProgramBookingCheckout from "./ProgramBookingCheckout";

export default function ProgramsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isDetailsRoute = /^\/programs\/[^/]+\/?$/.test(pathname);

  useEffect(() => {
    if (WEBSITE_BOOKING_ENABLED) return;
    try {
      sessionStorage.removeItem("nour_booking_selection");
    } catch {
      // Browsing remains available if storage is disabled.
    }
  }, []);

  return (
    <>
      {children}
      <ProgramDepartures />
      {WEBSITE_BOOKING_ENABLED && isDetailsRoute ? <>
        <ProgramBookingSelector />
        <ProgramBookingCheckout />
      </> : null}
      <ProgramStructuredContent />
      <ProgramDetailsExperience />
    </>
  );
}
