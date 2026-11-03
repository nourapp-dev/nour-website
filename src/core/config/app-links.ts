// Confirmed from public contact.website_url and the Flutter application identifiers.
// No website program ID is sent: UUIDs have no verified mapping to Flutter's numeric IDs.
export const NOUR_WEBSITE_ORIGIN = "https://nourappglobal.com";
export const NOUR_APPLICATION_ID = "com.nourumrah.app";
export const NOUR_APP_ENTRY = `${NOUR_WEBSITE_ORIGIN}/open-app`;
export const APP_LINKS_READY = process.env.NEXT_PUBLIC_NOUR_APP_LINKS_READY === "true";

export function approvedStoreUrl(value: string, store: "appStore" | "googlePlay" | "appGallery") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
    if (store === "googlePlay") return url.hostname === "play.google.com" && url.pathname === "/store/apps/details" && url.searchParams.get("id") === NOUR_APPLICATION_ID ? url.href : "";
    if (store === "appStore") return url.hostname === "apps.apple.com" && /\/id\d+\/?$/.test(url.pathname) ? url.href : "";
    return url.hostname === "appgallery.huawei.com" && /^\/app\/C\d+\/?$/.test(url.pathname) ? url.href : "";
  } catch { return ""; }
}

export function androidAssociation(fingerprints: string | undefined) {
  const values = (fingerprints ?? "").split(",").map(value => value.trim().toUpperCase()).filter(Boolean);
  if (!values.length || values.some(value => !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(value))) return null;
  return [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: NOUR_APPLICATION_ID, sha256_cert_fingerprints: values } }];
}

export function appleAssociation(teamId: string | undefined) {
  if (!teamId || !/^[A-Z0-9]{10}$/.test(teamId)) return null;
  return { applinks: { apps: [], details: [{ appID: `${teamId}.${NOUR_APPLICATION_ID}`, paths: ["/open-app"] }] } };
}
