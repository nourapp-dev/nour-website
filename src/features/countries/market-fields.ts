export type CountryMarketFields = {
  marketStatus?: string | null;
  publicationStatus?: string | null;
  showPublic?: boolean | null;
  showOnMap?: boolean | null;
  statusLabelAr?: string;
  statusLabelEn?: string;
  phoneCodes?: string[];
  currencyCodes?: string[];
  timezones?: string[];
  directorySource?: string;
  flagEmoji?: string;
};
export type CountryMarketRow = {
  market_status?: string | null;
  publication_status?: string | null;
  show_public?: boolean | null;
  show_on_map?: boolean | null;
  status_label_ar?: string | null;
  status_label_en?: string | null;
  phone_codes?: string[] | null;
  currency_codes?: string[] | null;
  timezones?: string[] | null;
  directory_source?: string | null;
  flag_emoji?: string | null;
};
export const marketColumns =
  "market_status,publication_status,show_public,show_on_map,status_label_ar,status_label_en,phone_codes,currency_codes,timezones,directory_source,flag_emoji";
export function marketFromRow(row: CountryMarketRow): CountryMarketFields {
  return {
    marketStatus: row.market_status ?? null,
    publicationStatus: row.publication_status ?? null,
    showPublic: row.show_public ?? null,
    showOnMap: row.show_on_map ?? null,
    statusLabelAr: row.status_label_ar ?? "",
    statusLabelEn: row.status_label_en ?? "",
    phoneCodes: row.phone_codes ?? [],
    currencyCodes: row.currency_codes ?? [],
    timezones: row.timezones ?? [],
    directorySource: row.directory_source ?? "",
    flagEmoji: row.flag_emoji ?? "",
  };
}
export function marketPayload(value: CountryMarketFields) {
  return {
    market_status: value.marketStatus,
    publication_status: value.publicationStatus,
    show_public: value.showPublic,
    show_on_map: value.showOnMap,
    status_label_ar: value.statusLabelAr,
    status_label_en: value.statusLabelEn,
    phone_codes: value.phoneCodes,
    currency_codes: value.currencyCodes,
    timezones: value.timezones,
    directory_source: value.directorySource,
    flag_emoji: value.flagEmoji,
  };
}
