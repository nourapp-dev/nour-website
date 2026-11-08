import type {CountryMarketFields} from '../market-fields';
export type CountryStatus =
  | "active"
  | "inactive";

export type Country = CountryMarketFields & {
  id: string;

  nameAr: string;
  nameEn: string;

  iso2: string;
  iso3: string;

  phoneCode: string;

  currencyCode: string;
  currencyNameAr: string;
  currencyNameEn: string;

  timezone: string;

  latitude: number | null;
  longitude: number | null;

  flagMediaId: string | null;
  flagUrl?: string;

  status: CountryStatus;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};
