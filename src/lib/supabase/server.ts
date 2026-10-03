import { createServerClient } from "@supabase/ssr";
import { authCookieName, type AuthScope } from "./auth-scope";
import { cookies } from "next/headers";

export async function createClient(scope: AuthScope = "admin") {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: authCookieName(supabaseUrl, scope),
      path: "/",
      sameSite: "lax",
      secure: new URL(supabaseUrl).protocol === "https:",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}
