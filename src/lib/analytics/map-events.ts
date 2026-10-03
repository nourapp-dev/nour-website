export type MapAnalyticsEventName =
  | "map_city_selected"
  | "map_country_selected"
  | "map_program_clicked"
  | "map_view_all_clicked"
  | "map_country_without_programs"
  | "map_story_advanced";

export type MapAnalyticsPayload = {
  countryId?: string;
  cityId?: string;
  countryIso2?: string;
  programId?: string;
  programSlug?: string;
  source?: "map" | "chip" | "program_card" | "journey_card" | "story";
  hasPrograms?: boolean;
};

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  gtag?: (...args: unknown[]) => void;
};

const SESSION_KEY = "nour:map-events";
const MAX_SESSION_EVENTS = 30;

export function trackMapEvent(
  name: MapAnalyticsEventName,
  payload: MapAnalyticsPayload = {},
) {
  if (typeof window === "undefined") return;

  const event = {
    event: name,
    ...payload,
    occurredAt: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("nour:analytics", { detail: event }));

  const analyticsWindow = window as DataLayerWindow;
  analyticsWindow.dataLayer?.push(event);
  analyticsWindow.gtag?.("event", name, payload);

  try {
    const current = JSON.parse(
      sessionStorage.getItem(SESSION_KEY) ?? "[]",
    ) as unknown[];
    const next = [...current, event].slice(-MAX_SESSION_EVENTS);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Analytics must never interrupt the map experience.
  }
}
