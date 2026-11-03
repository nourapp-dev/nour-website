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
