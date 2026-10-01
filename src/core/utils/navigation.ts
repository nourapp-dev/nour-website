export function getSafeInternalPath(value: string | null, fallback: string): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const origin = "https://nour.invalid";
  try {
    return new URL(value, origin).origin === origin ? value : fallback;
  } catch {
    return fallback;
  }
}
