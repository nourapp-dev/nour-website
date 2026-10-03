import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { authCookieName, authScopeForPath, type AuthScope } from "./auth-scope";

const clients = new Map<AuthScope, SupabaseClient>();

export function createClient(
  scope: AuthScope = typeof window === "undefined"
    ? "pilgrim"
    : authScopeForPath(window.location.pathname),
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Supabase environment variables are missing.");
  if (typeof window !== "undefined" && clients.has(scope))
    return clients.get(scope)!;
  const client = createBrowserClient(url, key, {
    // The SSR package singleton is shared across all storage keys: own one per realm.
    isSingleton: false,
    cookieOptions: {
      name: authCookieName(url, scope),
      path: "/",
      sameSite: "lax",
      secure: new URL(url).protocol === "https:",
    },
    auth: {
      detectSessionInUrl:
        typeof window !== "undefined" &&
        (window.location.pathname === "/admin/login/invite" ||
          window.location.pathname === "/account/login"),
    },
  });
  if (typeof window !== "undefined") clients.set(scope, client);
  return client;
}
