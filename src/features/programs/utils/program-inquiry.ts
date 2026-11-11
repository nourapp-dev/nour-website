export function programInquiryHref(whatsappHref: string, title: string, slug: string, language: "ar" | "en") {
  if (!/^https:\/\/wa\.me\/\d+$/.test(whatsappHref)) return "#contact";
  const url = new URL(whatsappHref);
  const programUrl = `https://nourappglobal.com/programs/${encodeURIComponent(slug)}?lang=${language}`;
  url.searchParams.set("text", `${language === "ar" ? "مرحبًا نور آب، أود الاستفسار عن البرنامج:" : "Hello Nour App, I would like to ask about:"}\n${title}\n${programUrl}`);
  return url.href;
}
