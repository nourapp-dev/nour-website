import { WEBSITE_BOOKING_ENABLED, websiteBookingCopy } from "./website-booking";
// Launch policy is code-owned. CMS presentation and store URLs cannot enable it.
export const launchState = {
  bookingEnabled: WEBSITE_BOOKING_ENABLED,
  appPublished: false,
} as const;
export const launchCopy = {
  ar: {
    bookingTitle: websiteBookingCopy.ar.title,
    bookingDescription: websiteBookingCopy.ar.description,
    appTitle: "التطبيق قريبًا",
    appDescription:
      "تطبيق نور آب غير منشور حاليًا. سنعلن عن روابط التحميل بعد إطلاقه.",
  },
  en: {
    bookingTitle: websiteBookingCopy.en.title,
    bookingDescription: websiteBookingCopy.en.description,
    appTitle: "App coming soon",
    appDescription:
      "The Nour app is not released yet. Download links will be announced after launch.",
  },
} as const;
