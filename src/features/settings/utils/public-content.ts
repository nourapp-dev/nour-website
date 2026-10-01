export function getPublishedMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  const message = value.trim();
  // Suppress unmistakable placeholder messages without inventing a replacement quote.
  return /^(test|testing|demo|placeholder|اختبار|تجربة|تجريبي)[.!؟\s]*$/i.test(message)
    ? ""
    : message;
}
