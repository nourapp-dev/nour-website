import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePublicPhone, normalizePublicUrl, resolvePublicContact } from "../src/features/settings/utils/public-contact.ts";
import { getPublishedMessage } from "../src/features/settings/utils/public-content.ts";

test("the observed incomplete support number falls back to configured WhatsApp", () => {
  const contact = resolvePublicContact({ "contact.support_phone": "96666666", "contact.whatsapp_number": "+966567488377" });
  assert.equal(contact.phoneHref, "tel:+966567488377");
  assert.equal(contact.phoneLabel, "+966 56 748 8377");
  assert.equal(contact.whatsappHref, "https://wa.me/966567488377");
});

test("contact edits propagate while valid international and Saudi local formats are retained", () => {
  for (const input of ["+966 56 748 8377", "00966567488377", "٠٥٦٧٤٨٨٣٧٧", "۰۵۶۷۴۸۸۳۷۷", "0567488377"]) {
    assert.equal(normalizePublicPhone(input), "+966567488377", input);
  }
  const contact = resolvePublicContact({ "contact.support_phone": "+44 20 7946 0123", "contact.whatsapp_number": "invalid" });
  assert.equal(contact.phoneHref, "tel:+442079460123");
  assert.equal(contact.whatsappHref, "https://wa.me/442079460123");
  for (const value of [null, {}, "+96666666", "123", "tel:+966567488377", "abc12345678", "+966+567488377"]) assert.equal(normalizePublicPhone(value), "");
});

test("placeholder social URLs and unsafe schemes are hidden; complete links survive", () => {
  for (const value of [null, {}, "", "https://", "https", "http", "javascript:alert(1)", "data:text/html,test", "//example.com", "https://user:pass@example.com", "https://not a host.com", "https://-invalid.com"]) {
    assert.equal(normalizePublicUrl(value), "", String(value));
  }
  assert.equal(normalizePublicUrl("instagram.com/nourapp"), "https://instagram.com/nourapp");
  assert.equal(normalizePublicUrl("https://x.com/nourapp?lang=ar"), "https://x.com/nourapp?lang=ar");
  assert.equal(resolvePublicContact({ "contact.website_url": "https", "contact.support_email": "test" }).email, "support@nourappglobal.com");
  assert.equal(resolvePublicContact({ "contact.website_url": "https" }).websiteHref, "https://nourappglobal.com");
});

test("unpublished placeholder CEO text is omitted without replacing a real message", () => {
  for (const value of [null, {}, "", " Test. ", "demo", "اختبار"]) assert.equal(getPublishedMessage(value), "");
  const message = "نهدف إلى تسهيل تجربة العمرة وخدمة ضيوف الرحمن.";
  assert.equal(getPublishedMessage(message), message);
  assert.equal(getPublishedMessage("A message about our testing and development process."), "A message about our testing and development process.");
});
