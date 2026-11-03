import { analyticsAllowed } from "../../../core/privacy/consent";
import { createBrowserClient } from "@supabase/ssr";

type VisitorDeviceType =
  | "desktop"
  | "mobile"
  | "tablet"
  | "bot"
  | "unknown";

type RecordVisitInput = {
  pagePath: string;
  pageTitle?: string | null;
  language?: "ar" | "en" | null;
};

const VISITOR_SESSION_KEY = "nourapp_visitor_session_key";

function createSupabaseBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase browser environment variables are missing.",
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}

function createSessionKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(16),
    Math.random().toString(16).slice(2),
    Math.random().toString(16).slice(2),
  ].join("-");
}

function getVisitorSessionKey(): string {
  const existingSessionKey =
    window.localStorage.getItem(
      VISITOR_SESSION_KEY,
    );

  if (existingSessionKey) {
    return existingSessionKey;
  }

  const newSessionKey = createSessionKey();

  window.localStorage.setItem(
    VISITOR_SESSION_KEY,
    newSessionKey,
  );

  return newSessionKey;
}

function detectDeviceType(): VisitorDeviceType {
  const userAgent =
    window.navigator.userAgent.toLowerCase();

  if (
    /bot|crawler|spider|crawling|headless/i.test(
      userAgent,
    )
  ) {
    return "bot";
  }

  if (
    /ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(
      userAgent,
    )
  ) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

function getSearchParameter(
  searchParams: URLSearchParams,
  key: string,
): string | null {
  const value = searchParams.get(key)?.trim();

  return value || null;
}

function normalizeLanguage(
  language?: string | null,
): "ar" | "en" | null {
  if (language === "ar" || language === "en") {
    return language;
  }

  const documentLanguage =
    document.documentElement.lang
      ?.toLowerCase()
      .trim();

  if (documentLanguage.startsWith("ar")) {
    return "ar";
  }

  if (documentLanguage.startsWith("en")) {
    return "en";
  }

  return null;
}

export async function recordVisitorPageVisit({
  pagePath,
  pageTitle,
  language,
}: RecordVisitInput): Promise<void> {
  if (!analyticsAllowed()) {
    return;
  }

  const normalizedPagePath =
    pagePath?.trim();

  if (
    !normalizedPagePath ||
    !normalizedPagePath.startsWith("/")
  ) {
    return;
  }

  try {
    const supabase =
      createSupabaseBrowserClient();

    const sessionKey =
      getVisitorSessionKey();

    const searchParams =
      new URLSearchParams(
        window.location.search,
      );

    const { error } = await supabase.rpc(
      "record_page_visit",
      {
        p_session_key: sessionKey,
        p_page_path: normalizedPagePath,
        p_page_title:
          pageTitle?.trim() ||
          document.title ||
          null,
        p_referrer:
          document.referrer || null,
        p_language:
          normalizeLanguage(language),
        p_device_type:
          detectDeviceType(),
        p_country_code: null,
        p_utm_source:
          getSearchParameter(
            searchParams,
            "utm_source",
          ),
        p_utm_medium:
          getSearchParameter(
            searchParams,
            "utm_medium",
          ),
        p_utm_campaign:
          getSearchParameter(
            searchParams,
            "utm_campaign",
          ),
      },
    );

    if (error) {
      console.warn(
        "[Visitor Analytics] Visit was not recorded:",
        error.message,
      );
    }
  } catch (error) {
    console.warn(
      "[Visitor Analytics] Unexpected error:",
      error instanceof Error
        ? error.message
        : error,
    );
  }
}