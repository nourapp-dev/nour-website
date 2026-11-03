import { WEBSITE_BOOKING_ENABLED, WEBSITE_BOOKING_PAUSED_CODE } from "../../../core/config/website-booking";

import type { CreateProgramBookingInput, CreatedBooking } from "../types/booking";
export type { BookingTravelerInput, CreateProgramBookingInput, CreatedBooking } from "../types/booking";

export async function createProgramBooking(
  input: CreateProgramBookingInput,
): Promise<CreatedBooking> {
  if (!WEBSITE_BOOKING_ENABLED) throw new Error(WEBSITE_BOOKING_PAUSED_CODE);

  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.code ?? "booking_not_created");
  return result as CreatedBooking;
}
