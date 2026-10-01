export function getErrorMessage(error: unknown, fallback = ""): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return typeof error.message === "string" ? error.message : fallback;
  }
  return fallback;
}
