import type { BookingTravelerInput } from "../services/public-booking.service";
import type { PilgrimProfile } from "../../pilgrims/services/pilgrim-account.service";

export function buildBookingTravelers(
  count: number,
  profile: PilgrimProfile | null,
  edits: Record<number, Partial<BookingTravelerInput>>,
): BookingTravelerInput[] {
  const parts = profile?.fullName.trim().split(/\s+/) ?? [];
  return Array.from({ length: count }, (_, index) => ({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationalityCode: "",
    passportNumber: "",
    ...(index === 0 && profile ? {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") || parts[0] || "",
      dateOfBirth: profile.dateOfBirth,
      nationalityCode: profile.nationalityCode,
      passportNumber: profile.passportNumber,
    } : {}),
    ...edits[index],
  }));
}
