export type AuthScope = "admin" | "pilgrim";

export function authScopeForPath(path: string): AuthScope {
  return path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin/")
    ? "admin"
    : "pilgrim";
}

export function authCookieName(url: string, scope: AuthScope): string {
  return `nour-${new URL(url).hostname.split(".")[0]}-${scope}-auth-v1`;
}

export function safeAccountNext(value: string | null): string {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return "/account/profile";
  try {
    const url = new URL(value, "https://nour.invalid");
    if (
      url.origin !== "https://nour.invalid" ||
      authScopeForPath(decodeURIComponent(url.pathname)) === "admin" ||
      url.pathname.startsWith("/api/") ||
      url.pathname === "/account/login" ||
      url.pathname.startsWith("/auth/")
    )
      return "/account/profile";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/account/profile";
  }
}
