// Public flags are fixed at build time. Booking stays paused unless explicitly enabled.
export const WEBSITE_BOOKING_ENABLED =
  process.env.NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED === "true";

export const WEBSITE_BOOKING_PAUSED_CODE = "website_booking_paused";

export const websiteBookingCopy = {
  ar: {
    title: "الحجز عبر الموقع متوقف مؤقتًا",
    description: "يمكنك استعراض البرامج ومقارنة تفاصيلها. سنعلن هنا عند تفعيل الحجز الإلكتروني.",
  },
  en: {
    title: "Website booking is temporarily paused",
    description: "You can explore programs and compare their details. We will announce here when online booking opens.",
  },
} as const;
