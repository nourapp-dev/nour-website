"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { WEBSITE_BOOKING_ENABLED } from "../../src/core/config/website-booking";
import PublicPageShell from "../components/layout/PublicPageShell";
import "./programs-ui.css";
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
    <PublicPageShell>
      {children}
      <div id="departures"><ProgramDepartures /></div>
      {WEBSITE_BOOKING_ENABLED && isDetailsRoute ? <>
        <ProgramBookingSelector />
        <ProgramBookingCheckout />
      </> : null}
      <div id="additional-information"><ProgramStructuredContent /></div>
      <ProgramDetailsExperience />
    </PublicPageShell>
  );
}
