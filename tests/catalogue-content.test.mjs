import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getPublicCountries } from "../src/features/countries/services/public-countries.service.ts";
import { localTime, zonedInstant } from "../src/features/journeys/timezone.ts";
import {
  normalizePresentation,
  defaultPresentation,
  safeImage,
} from "../src/features/website/presentation.ts";
import { validateProgramCover } from "../src/features/media/utils/imageInfo.ts";
test("reference directory preserves multiple currencies, calling codes and IANA zones; it does not create markets", () => {
  const rows = JSON.parse(
    readFileSync(
      new URL(
        "../src/features/countries/data/directory-v1.json",
        import.meta.url,
      ),
    ),
  );
  const zones = JSON.parse(
    readFileSync(
      new URL(
        "../src/features/countries/data/iana-timezones-v1.json",
        import.meta.url,
      ),
    ),
  );
  assert.equal(new Set(rows.map((r) => r.iso2)).size, rows.length);
  assert.ok(rows.length >= 249);
  assert.ok(zones.length > 400);
  assert.ok(rows.some((r) => r.currencies.length > 1));
  assert.ok(rows.some((r) => r.phoneCodes.length > 1));
  assert.ok(rows.some((r) => r.timezones.length > 1));
  assert.ok(
    rows.every(
      (r) =>
        r.nameAr && r.nameEn && r.iso3 && r.latitude >= -90 && r.latitude <= 90,
    ),
  );
  assert.ok(!JSON.stringify(rows).includes("market_status"));
});
test("country network failure is distinct from empty success; count failure preserves countries with unknown counts", async () => {
  const query = (data, error) => {
    const q = {
      select: () => q,
      eq: () => q,
      is: () => q,
      not: () => q,
      order: () => q,
      then: (resolve) => resolve({ data, error }),
    };
    return q;
  };
  await assert.rejects(
    getPublicCountries({ from: () => query(null, { message: "network" }) }),
    /network/,
  );
  assert.deepEqual(
    await getPublicCountries({ from: () => query([], null) }),
    [],
  );
  const rows = await getPublicCountries({
    from: (table) =>
      table === "countries"
        ? query(
            [
              {
                id: "zero",
                iso2: "ZZ",
                name_ar: "اختبار",
                name_en: "Synthetic",
                latitude: 0,
                longitude: 0,
                flag_media_id: null,
                sort_order: 0,
              },
            ],
            null,
          )
        : query(null, { message: "unavailable" }),
  });
  assert.equal(rows[0].latitude, 0);
  assert.equal(rows[0].publishedProgramsCount, null);
  assert.equal(rows[0].countsError, true);
});
test("saved IANA wall clock round trips independently of browser zone, rejecting ambiguous and nonexistent DST times", () => {
  assert.equal(
    zonedInstant("2026-11-08T13:00", "Asia/Riyadh"),
    "2026-11-08T10:00:00.000Z",
  );
  assert.equal(
    localTime("2026-11-08T10:00:00Z", "Asia/Riyadh"),
    "2026-11-08T13:00",
  );
  assert.throws(
    () => zonedInstant("2026-03-08T02:30", "America/New_York"),
    /ambiguous/,
  );
  assert.throws(
    () => zonedInstant("2026-11-01T01:30", "America/New_York"),
    /ambiguous/,
  );
});
test("known section edits and hiding survive normalization without changing unrelated sections or modes", () => {
  const value = structuredClone(defaultPresentation);
  value.sections.map.title.en = "Edited map";
  value.sections.services.visible = false;
  value.hero.focusX = 80;
  const result = normalizePresentation(value);
  assert.equal(result.sections.map.title.en, "Edited map");
  assert.equal(result.sections.services.visible, false);
  assert.deepEqual(
    result.sections.journey,
    defaultPresentation.sections.journey,
  );
  assert.equal(result.hero.focusX, 80);
  const fallback = normalizePresentation({ hero: { mode: "photo" } });
  assert.deepEqual(fallback.sections, defaultPresentation.sections);
});
test("local image origin is supported without accepting unrelated insecure or authenticated URLs", () => {
  const old = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54331";
  try {
    const valid =
      "http://127.0.0.1:54331/storage/v1/object/public/media/test.png";
    assert.equal(safeImage(valid), valid);
    assert.equal(safeImage(valid.replace("54331", "54332")), "");
    assert.equal(
      safeImage(valid.replace("127.0.0.1", "user:pass@127.0.0.1")),
      "",
    );
  } finally {
    if (old === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = old;
  }
});
test("program-cover constraints reject wrong ratio, small or oversized images and accept recommended size", () => {
  assert.doesNotThrow(() =>
    validateProgramCover({ size: 1024 }, { width: 1600, height: 900 }),
  );
  for (const dimensions of [
    { width: 1600, height: 1600 },
    { width: 799, height: 450 },
    { width: 800, height: 449 },
  ])
    assert.throws(() => validateProgramCover({ size: 1024 }, dimensions));
  assert.throws(() =>
    validateProgramCover({ size: 5242881 }, { width: 1600, height: 900 }),
  );
});
