import type { CreateProgramBookingInput } from "../services/public-booking.service";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isText = (value: unknown) => typeof value === "string" && value.trim().length > 0 && value.length <= 500;
const isOptionalText = (value: unknown) => value === undefined || (typeof value === "string" && value.length <= 500);

export function isBookingInput(value: unknown): value is CreateProgramBookingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  if (![input.programId, input.departureId, input.priceTierId].every((id) => typeof id === "string" && uuid.test(id))) return false;
  if (typeof input.travelersCount !== "number" || !Number.isSafeInteger(input.travelersCount) || input.travelersCount < 1) return false;
  if (!isText(input.contactName) || ![input.contactEmail, input.contactPhone, input.contactCountryCode].every(isOptionalText)) return false;
  if (!isText(input.contactEmail) && !isText(input.contactPhone)) return false;
  if (input.preferredLanguage !== "ar" && input.preferredLanguage !== "en") return false;
  if (!Array.isArray(input.travelers) || input.travelers.length !== input.travelersCount) return false;
  return input.travelers.every((traveler: unknown) => {
    if (!traveler || typeof traveler !== "object" || Array.isArray(traveler)) return false;
    const row = traveler as Record<string, unknown>;
    return isText(row.firstName) && isText(row.lastName)
      && [row.dateOfBirth, row.nationalityCode, row.passportNumber].every(isOptionalText);
  });
}
