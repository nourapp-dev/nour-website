import "server-only";

import { createClient } from "@supabase/supabase-js";

type PublicSettingRow = {
  setting_key: string;
  value_json: unknown;
};

export type PublicServerSettingsMap = Record<
  string,
  unknown
>;

function getSupabaseEnvironment() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseKey,
  };
}

export async function getPublicServerSettings(): Promise<PublicServerSettingsMap> {
  const environment =
    getSupabaseEnvironment();

  /*
   * لا نوقف الموقع إذا كانت متغيرات Supabase
   * غير متاحة لأي سبب.
   *
   * generateMetadata سيستخدم القيم الاحتياطية.
   */
  if (!environment) {
    return {};
  }

  try {
    const supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    const { data, error } =
      await supabase.rpc(
        "get_public_platform_settings",
      );

    /*
     * لا نستخدم console.error هنا.
     *
     * في وضع التطوير Next.js قد يعرض
     * console.error كـ Runtime Overlay.
     */
    if (error) {
      return {};
    }

    const rows =
      (data ?? []) as PublicSettingRow[];

    return rows.reduce<PublicServerSettingsMap>(
      (result, setting) => {
        result[setting.setting_key] =
          setting.value_json;

        return result;
      },
      {},
    );
  } catch {
    /*
     * أخطاء الشبكة مثل:
     * TypeError: fetch failed
     *
     * لا يجب أن تمنع تحميل الموقع.
     */
    return {};
  }
}

export function getServerTextSetting(
  settings: PublicServerSettingsMap,
  key: string,
  fallbackValue: string,
): string {
  const value = settings[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return fallbackValue;
  }

  return value.trim();
}