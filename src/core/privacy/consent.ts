export const CONSENT_KEY = "nour:privacy:v1";
export const CONSENT_EVENT = "nour:privacy-changed";
export const OPEN_PRIVACY_EVENT = "nour:open-privacy";
export const CONSENT_DURATION = 180 * 24 * 60 * 60 * 1000;
export type PrivacyConsent = { version: 1; analytics: boolean; savedAt: number; expiresAt: number };
let temporaryChoice: string | undefined;

export function parseConsent(raw: string | null, now = Date.now()): PrivacyConsent | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v?.version !== 1 || typeof v.analytics !== "boolean" ||
        !Number.isFinite(v.savedAt) || !Number.isFinite(v.expiresAt) ||
        v.savedAt > now || v.savedAt < 0 || v.expiresAt <= now ||
        v.expiresAt - v.savedAt !== CONSENT_DURATION) return null;
    return v;
  } catch { return null; }
}

export function consentSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = temporaryChoice ?? null;
  if (temporaryChoice === undefined) {
    try { raw = window.localStorage.getItem(CONSENT_KEY); } catch { /* Default to no consent. */ }
  }
  return parseConsent(raw) ? raw : null;
}

export function isPublicPrivacyPath(path: string): boolean {
  return !/^\/(admin|account|api|auth)(\/|$)/.test(path);
}

export function analyticsAllowed(): boolean {
  return typeof window !== "undefined" &&
    isPublicPrivacyPath(window.location.pathname) &&
    parseConsent(consentSnapshot())?.analytics === true;
}

export function clearOptionalAnalytics(): void {
  if (typeof window === "undefined") return;
  // Only our analytics keys; never clear authentication or other user data.
  try { window.localStorage.removeItem("nourapp_visitor_session_key"); } catch {}
  try { window.sessionStorage.removeItem("nour:map-events"); } catch {}
}

export function saveConsent(analytics: boolean): boolean {
  const savedAt = Date.now();
  const raw = JSON.stringify({ version: 1, analytics, savedAt, expiresAt: savedAt + CONSENT_DURATION });
  let persisted = true;
  try {
    window.localStorage.setItem(CONSENT_KEY, raw);
    temporaryChoice = undefined;
  } catch {
    temporaryChoice = raw;
    persisted = false;
  }
  if (!analytics) clearOptionalAnalytics();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
  return persisted;
}

export function subscribeConsent(notify: () => void): () => void {
  let timer: number | undefined;
  const refresh = () => {
    window.clearTimeout(timer);
    const consent = parseConsent(consentSnapshot());
    if (!consent?.analytics) clearOptionalAnalytics();
    notify();
    if (consent) {
      timer = window.setTimeout(refresh, Math.min(consent.expiresAt - Date.now() + 1, 2147483647));
    }
  };
  const storage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_KEY) {
      temporaryChoice = undefined;
      refresh();
    }
  };
  window.addEventListener(CONSENT_EVENT, refresh);
  window.addEventListener("storage", storage);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  refresh();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener(CONSENT_EVENT, refresh);
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}

export function openPrivacySettings(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PRIVACY_EVENT));
}
