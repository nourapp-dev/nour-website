import type { ProgramHotelFormValue } from "./program-hotel";
import type {
  ProgramFlightFormValue,
} from "./program-flight";

export type ProgramStatus =
  | "draft"
  | "published"
  | "inactive";

  export type ProgramFlightInclusion =
  | "included"
  | "excluded"
  | "dynamic";
  
export type Program = {
  visaStatus?:import("../labels").VisaStatus;
  originCityId?:string|null;travelMode?:string|null;priceBasis?:string|null;taxStatus?:string|null;
  id: string;

  titleAr: string;
  titleEn: string;

  slug: string;

  summaryAr: string;
  summaryEn: string;

  descriptionAr: string;
  descriptionEn: string;

  countryId: string | null;

  durationDays: number;
  durationNights: number;

  basePrice: number;
  currencyCode: string;

  flightInclusion: ProgramFlightInclusion;
flightNotesAr: string;
flightNotesEn: string;

  coverMediaId: string | null;
  coverUrl: string | null;

  status: ProgramStatus;

  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;

  createdBy: string | null;
  updatedBy: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ProgramFormValues = {
  visaStatus?:string;
  originCityId?:string;travelMode?:string;priceBasis?:string;taxStatus?:string;
  titleAr: string;
  titleEn: string;

  slug: string;

  summaryAr: string;
  summaryEn: string;

  descriptionAr: string;
  descriptionEn: string;

  countryId: string;

  durationDays: number;
  durationNights: number;

  basePrice: number;
  currencyCode: string;

  status: ProgramStatus;

  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;

  coverFile: File | null;

  hotels: ProgramHotelFormValue[];

  flightInclusion: ProgramFlightInclusion;
flightNotesAr: string;
flightNotesEn: string;

flights: ProgramFlightFormValue[];
};