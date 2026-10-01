// These defaults match the contact details shipped with the platform settings.
const DEFAULT_PHONE = "+966567488377";
const DEFAULT_EMAIL = "support@nourappglobal.com";
const DEFAULT_WEBSITE = "https://nourappglobal.com";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePublicPhone(value: unknown): string {
  let number = text(value)
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
  if (!number || /[^\d+().\s-]/.test(number)) return "";
  number = number.replace(/[().\s-]/g, "").replace(/^00/, "+");
  if (/^05\d{8}$/.test(number)) number = `+966${number.slice(1)}`;
  if (!number.startsWith("+")) number = `+${number}`;
  if (!/^\+[1-9]\d{7,14}$/.test(number)) return "";
  // Saudi numbers need the full nine-digit national number after +966.
  if (number.startsWith("+966") && !/^\+966[1-9]\d{8}$/.test(number)) return "";
  return number;
}

export function normalizePublicUrl(value: unknown): string {
  const input = text(value);
  if (!input || /\s/.test(input) || input.startsWith("//")) return "";
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input)) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
    if (!/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,63}$/i.test(url.hostname)) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function resolvePublicContact(settings: Record<string, unknown>) {
  const configuredWhatsapp = normalizePublicPhone(settings["contact.whatsapp_number"]);
  const phone = normalizePublicPhone(settings["contact.support_phone"]) || configuredWhatsapp || DEFAULT_PHONE;
  const whatsapp = configuredWhatsapp || phone;
  const email = text(settings["contact.support_email"]);
  return {
    phone,
    phoneLabel: /^\+9665\d{8}$/.test(phone)
      ? phone.replace(/^(\+966)(\d{2})(\d{3})(\d{4})$/, "$1 $2 $3 $4")
      : phone,
    phoneHref: `tel:${phone}`,
    whatsappHref: `https://wa.me/${whatsapp.slice(1)}`,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : DEFAULT_EMAIL,
    websiteHref: normalizePublicUrl(settings["contact.website_url"]) || DEFAULT_WEBSITE,
  };
}
