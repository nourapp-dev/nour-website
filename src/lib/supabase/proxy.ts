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
import { routePermission } from "../../features/admin-workspace/navigation";
import { safeAdminNext } from "../../features/admin-workspace/contracts";
import { readMaintenanceMode } from "./maintenance";

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
      {next.headers.set("Cache-Control", "private, no-store");next.headers.set("X-Robots-Tag","noindex, nofollow");next.headers.set("Pragma","no-cache");next.headers.set("Expires","0");}
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
    const { data, error: sessionError } = await supabase.auth.getUser();
    if (sessionError && (sessionError.name === "AuthRetryableFetchError" || (sessionError.status ?? 0) >= 500)) {
      return finish(new NextResponse("Authentication service unavailable. خدمة الدخول غير متاحة مؤقتًا. أعد المحاولة.", {status:503,headers:{"Retry-After":"10"}}));
    }
    let allowed = false;
    if (data.user) {
      try {
        allowed = await canAccessAdmin(supabase, data.user.id);
      } catch {
        return finish(new NextResponse("Unable to verify admin access. تعذر التحقق من صلاحية الإدارة. أعد المحاولة.",{status:503}));
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
      return redirect("/admin/login?next=" + encodeURIComponent(safeAdminNext(pathname+request.nextUrl.search)) + (data.user ? "&error=forbidden" : "&reason=session_required"));
    }
    if (pathname === "/admin/login" && allowed)
      return redirect(safeAdminNext(request.nextUrl.searchParams.get("next")));
    if (!publicAdmin && allowed) {
      const permissionModule = routePermission(pathname.replace(/^\/api\/admin\//,"/admin/"));
      if(permissionModule){
        const codes=pathname.includes("/website")?["website.edit","website.publish","settings.manage"]:["view","read","manage"].map(action=>`${permissionModule}.${action}`);
        const checks = await Promise.all(codes.map(permission_code=>supabase.rpc("current_user_has_permission",{permission_code})));
        if(checks.some(result=>result.error)) return finish(new NextResponse("Permission verification unavailable. تعذر التحقق من الصلاحيات.",{status:503}));
        if(!checks.some(result=>result.data===true)) return finish(new NextResponse("Access denied. لا تملك صلاحية عرض هذا القسم.",{status:403}));
      }
    }
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
