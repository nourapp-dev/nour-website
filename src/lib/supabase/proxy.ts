import {
  authCookieName,
  authScopeForPath,
  safeAccountNext,
} from "./auth-scope";
import {
  canAccessAdmin,
  getPilgrimUser,
} from "../../features/auth/services/account-access";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function readMaintenanceMode(
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("get_maintenance_mode");

    if (error) {
      return false;
    }

    return data === true;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new Error("Supabase environment variables are missing.");
  const pathname = request.nextUrl.pathname;
  const scope = authScopeForPath(pathname);
  const supabase = createServerClient(url, key, {
    cookieOptions: {
      name: authCookieName(url, scope),
      path: "/",
      sameSite: "lax",
      secure: new URL(url).protocol === "https:",
    },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const finish = (next: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => next.cookies.set(cookie));
    // Old shared sessions must never be silently adopted into either realm.
    const legacy = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
    request.cookies
      .getAll()
      .filter((c) => c.name === legacy || c.name.startsWith(legacy + "."))
      .forEach((c) => next.cookies.set(c.name, "", { path: "/", maxAge: 0 }));
    if (
      scope === "admin" ||
      pathname.startsWith("/account") ||
      pathname.startsWith("/api/bookings") ||
      next.cookies.getAll().length
    )
      next.headers.set("Cache-Control", "private, no-store");
    return next;
  };
  const redirect = (path: string) =>
    finish(NextResponse.redirect(new URL(path, request.url)));
  const isApi = pathname.startsWith("/api/");
  if (
    scope !== "admin" &&
    !isApi &&
    pathname !== "/maintenance" &&
    (await readMaintenanceMode(supabase))
  )
    return finish(NextResponse.rewrite(new URL("/maintenance", request.url)));
  if (pathname === "/maintenance" && !(await readMaintenanceMode(supabase)))
    return redirect("/");

  if (scope === "admin") {
    const publicAdmin = [
      "/admin/login",
      "/admin/login/invite",
      "/admin/invite",
    ].includes(pathname);
    const { data } = await supabase.auth.getUser();
    let allowed = false;
    if (data.user) {
      try {
        allowed = await canAccessAdmin(supabase, data.user.id);
      } catch {
        allowed = false;
      }
    }
    if (!publicAdmin && !allowed) {
      if (isApi)
        return finish(
          NextResponse.json(
            { error: "admin_access_required" },
            { status: data.user ? 403 : 401 },
          ),
        );
      return redirect("/admin/login" + (data.user ? "?error=forbidden" : ""));
    }
    if (pathname === "/admin/login" && allowed)
      return redirect("/admin/dashboard");
  } else if (pathname.startsWith("/account/")) {
    let user = null;
    try {
      user = await getPilgrimUser(supabase);
    } catch {
      user = null;
    }
    if (pathname !== "/account/login" && !user)
      return redirect("/account/login?next=" + encodeURIComponent(pathname));
    if (pathname === "/account/login" && user)
      return redirect(
        safeAccountNext(request.nextUrl.searchParams.get("next")),
      );
  }
  return finish(response);
}
