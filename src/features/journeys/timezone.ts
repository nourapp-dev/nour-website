/** Wall-clock input is interpreted in its saved IANA zone, never the browser zone. */
export function localTime(instant: string | null, zone: string) {
  if (!instant) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export function zonedInstant(wall: string, zone: string) {
  const stamp = Date.parse(`${wall}:00Z`);
  if (!Number.isFinite(stamp)) throw new Error("invalid_date");
  const candidates = new Set<string>();
  for (let h = -36; h <= 36; h += 6) {
    const sample = stamp + h * 3600000;
    const offset =
      Date.parse(`${localTime(new Date(sample).toISOString(), zone)}:00Z`) -
      sample;
    const candidate = new Date(stamp - offset).toISOString();
    if (localTime(candidate, zone) === wall) candidates.add(candidate);
  }
  if (candidates.size !== 1)
    throw new Error(
      "وقت غير موجود أو متكرر بسبب التوقيت الصيفي. اختر وقتًا آخر / Nonexistent or ambiguous local time; choose another time.",
    );
  return [...candidates][0];
}
