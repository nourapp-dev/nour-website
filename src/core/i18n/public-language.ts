export type PublicLanguage = "ar" | "en";

export function parsePublicLanguage(value: unknown): PublicLanguage | null {
  return value === "ar" || value === "en" ? value : null;
}

export function languageHref(href: string, language: PublicLanguage): string {
  const url = new URL(href, "https://nour.invalid");
  url.searchParams.set("lang", language);
  return `${url.pathname}${url.search}${url.hash}`;
}
