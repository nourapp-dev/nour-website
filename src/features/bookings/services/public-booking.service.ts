import { WEBSITE_BOOKING_ENABLED, WEBSITE_BOOKING_PAUSED_CODE } from "../../../core/config/website-booking";

export type BookingTravelerInput = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationalityCode?: string;
  passportNumber?: string;
};

export type CreateProgramBookingInput = {
  programId: string;
  departureId: string;
  priceTierId: string;
  travelersCount: number;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCountryCode?: string;
  preferredLanguage: "ar" | "en";
  travelers: BookingTravelerInput[];
};

export type CreatedBooking = {
  bookingId: string;
  bookingReference: string;
  status: "pending_payment" | "confirmed" | "cancelled" | "expired" | "refunded";
  reservedUntil: string | null;
  totalAmount: number;
  currencyCode: string;
};

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
