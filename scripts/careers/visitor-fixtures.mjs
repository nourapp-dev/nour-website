import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l
          .slice(i + 1)
          .trim()
          .replace(/^(["'])(.*)\1$/, "$2"),
      ];
    }),
);
assert.equal(
  env.NEXT_PUBLIC_SUPABASE_URL,
  "http://127.0.0.1:54331",
  "Local isolated API required",
);
const client = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
const account = JSON.parse(
  readFileSync(".next-ui-preview/local-admin-account.json", "utf8"),
);
assert.ifError(
  (
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
  ).error,
);
const manifestPath = ".next-ui-preview/visitor-fixtures.json";
let manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : { run: randomUUID(), rows: {}, files: [], complete: false };
const persist = () =>
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const rpc = async (name, args) => {
  const r = await client.rpc(name, args);
  assert.ifError(r.error);
  return r.data;
};
const add = async (table, value) => {
  if (table === "program_flights") {
    await rpc("replace_program_flights", {
      p_program_id: value.program_id,
      p_flights: [value],
    });
    const rows = await client
      .from(table)
      .select("id")
      .eq("program_id", value.program_id);
    assert.ifError(rows.error);
    const id = rows.data[0].id;
    (manifest.rows[table] ??= []).push(id);
    persist();
    return id;
  }
  const r = await client.from(table).insert(value).select("id").single();
  assert.ifError(r.error);
  (manifest.rows[table] ??= []).push(r.data.id);
  persist();
  return r.data.id;
};
if (process.argv.includes("--cleanup")) {
  let sql = "begin;";
  const order = [
    "program_faqs",
    "program_inclusion_items",
    "program_itinerary_days",
    "program_cancellation_rules",
    "program_price_tiers",
    "program_flights",
    "program_transports",
    "program_visas",
    "program_hotels",
    "program_departures",
    "program_meeting_points",
    "programs",
    "hotels",
    "transports",
    "visas",
    "departure_cities",
    "countries",
    "articles",
    "article_categories",
    "media",
  ];
  for (const table of order) {
    const ids = manifest.rows[table] ?? [];
    if (!ids.length) continue;
    assert.ok(ids.every((id) => /^[a-f0-9-]{36}$/.test(id)));
    if (table === "program_meeting_points")
      sql += `delete from public.meeting_point_operations where point_id in (${ids.map((id) => `'${id}'`).join(",")});`;
    sql += `delete from public.${table} where id in (${ids.map((id) => `'${id}'`).join(",")});`;
  }
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_nour-intake-local",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
    ],
    { input: sql + "commit;", stdio: ["pipe", "pipe", "pipe"] },
  );
  for (const path of manifest.files) {
    assert.ok(path.startsWith("local-visitor-fixtures/" + manifest.run + "/"));
    assert.ifError((await client.storage.from("media").remove([path])).error);
  }
  manifest = { run: randomUUID(), rows: {}, files: [], complete: false };
  persist();
  console.log(
    "Removed only recorded local visitor fixtures; original data and publication audit retained.",
  );
  process.exit(0);
}
async function ensureArticles() {
  if ((manifest.rows.articles ?? []).length >= 4) return;
  const category =
    (manifest.rows.article_categories ?? [])[0] ??
    (await add("article_categories", {
      name_ar: "محتوى تجربة محلية",
      name_en: "Local test content",
      slug: "local-fixture-category",
      is_active: true,
    }));
  for (let i = (manifest.rows.articles ?? []).length; i < 4; i++)
    await add("articles", {
      slug: "local-fixture-article-" + (i + 1),
      title_ar: "مقال تجربة محلية " + (i + 1),
      title_en: "Local synthetic article " + (i + 1),
      excerpt_ar: "محتوى اصطناعي لاختبار عرض المقالات وعلاقتها بالتصنيف.",
      excerpt_en:
        "Synthetic content for testing article display and category relationships.",
      content_ar: "<p>محتوى محلي للاختبار فقط، وليس إرشادات سفر معتمدة.</p>",
      content_en:
        "<p>Local test content only; this is not approved travel guidance.</p>",
      category_id: category,
      cover_media_id: manifest.rows.media[0],
      status: i === 3 ? "draft" : "published",
      is_active: true,
      is_featured: false,
      published_at: i === 3 ? null : new Date().toISOString(),
      tags: [],
    });
  console.log(
    "Local article fixtures ready: three related published records and one hidden draft.",
  );
}
if (manifest.complete) {
  await ensureArticles();
  console.log(
    "Local visitor fixtures already exist. Preview: /programs/local-fixture-bus",
  );
  process.exit(0);
}
if (Object.values(manifest.rows).some((ids) => ids.length))
  throw Error("Incomplete fixture run exists; use --cleanup before retrying.");
persist();
const directory = JSON.parse(
  readFileSync("src/features/countries/data/directory-v1.json", "utf8"),
);
async function country(iso) {
  const item = directory.find((c) => c.iso2 === iso);
  const existing = await client
    .from("countries")
    .select("id")
    .eq("iso2", iso)
    .is("deleted_at", null);
  assert.ifError(existing.error);
  if (existing.data.length)
    throw Error(
      "A non-fixture country already uses " + iso + "; it will not be changed.",
    );
  return add("countries", {
    name_ar: item.nameAr + " — اختبار محلي",
    name_en: item.nameEn + " — local test",
    iso2: item.iso2,
    iso3: item.iso3,
    phone_code: item.primaryPhone,
    currency_code: item.currencies[0].code,
    currency_name_ar: item.currencies[0].ar,
    currency_name_en: item.currencies[0].en,
    timezone: item.timezones[0],
    latitude: item.latitude,
    longitude: item.longitude,
    phone_codes: item.phoneCodes,
    currency_codes: item.currencies.map((c) => c.code),
    timezones: item.timezones,
    directory_source: "world-countries@5.1.0; local synthetic market",
    flag_emoji: item.flag,
    is_active: true,
    market_status: "browsable",
    publication_status: "published",
    show_public: true,
    show_on_map: true,
  });
}
const sa = await country("SA"),
  eg = await country("EG");
const riyadh = await add("departure_cities", {
  country_id: sa,
  name_ar: "الرياض — اختبار محلي",
  name_en: "Riyadh — local test",
  latitude: 24.7,
  longitude: 46.7,
  timezone: "Asia/Riyadh",
  publication_status: "published",
  show_on_map: true,
  is_active: true,
});
const cairo = await add("departure_cities", {
  country_id: eg,
  name_ar: "القاهرة — اختبار محلي",
  name_en: "Cairo — local test",
  latitude: 30,
  longitude: 31,
  timezone: "Africa/Cairo",
  publication_status: "published",
  show_on_map: true,
  is_active: true,
});
const hidden = await add("departure_cities", {
  country_id: sa,
  name_ar: "مدينة مسودة للاختبار",
  name_en: "Synthetic draft city",
  latitude: 0,
  longitude: 0,
  timezone: "Etc/UTC",
  publication_status: "draft",
  is_active: true,
});
const image = readFileSync(
  "public/images/site/ChatGPT Image Aug 16, 2026, 06_53_26 PM.png",
);
const coverPath = `local-visitor-fixtures/${manifest.run}/cover.png`;
assert.ifError(
  (
    await client.storage
      .from("media")
      .upload(coverPath, image, { contentType: "image/png", upsert: false })
  ).error,
);
manifest.files.push(coverPath);
persist();
const cover = await add("media", {
  bucket: "media",
  path: coverPath,
  file_name: "Local synthetic program cover.png",
  mime_type: "image/png",
  size_bytes: image.length,
  width: 1672,
  height: 941,
  alt_ar: "صورة تعريفية من أصول الموقع لبرنامج تجريبي محلي",
  alt_en: "Existing site artwork used for a synthetic local program",
});
const h1 = await add("hotels", {
  name_ar: "فندق مكة الاصطناعي — اختبار فقط",
  name_en: "Synthetic Makkah hotel — test only",
  city_ar: "MAKKAH",
  city_en: "MAKKAH",
  stars: 3,
  description_ar: "سجل اصطناعي للاختبار؛ ليس عرض إقامة حقيقيًا.",
  description_en: "Synthetic fixture, not an actual accommodation offer.",
  is_active: true,
});
const h2 = await add("hotels", {
  name_ar: "فندق المدينة الاصطناعي — اختبار فقط",
  name_en: "Synthetic Madinah hotel — test only",
  city_ar: "MADINAH",
  city_en: "MADINAH",
  stars: 4,
  is_active: true,
});
const bus = await add("transports", {
  name_ar: "حافلة اختبار بين المدن",
  name_en: "Synthetic intercity bus",
  service_type: "intercity",
  mode: "shared",
  vehicle_type: "bus",
  capacity: 40,
  luggage_capacity: 40,
  is_active: true,
});
const visa = await add("visas", {
  name_ar: "تأشيرة اختبار وصفية",
  name_en: "Synthetic visa description",
  visa_type: "umrah",
  processing_type: "standard",
  country_id: eg,
  is_active: true,
});
const date = (offset) => new Date(Date.now() + offset * 86400000).toISOString();
const program = async ({
  slug,
  title,
  countryId,
  city,
  mode,
  nights,
  days,
  basis = "per_person",
  tax = "included",
  published = true,
  flights = false,
  upcoming = true,
}) => {
  const id = await add("programs", {
    title_ar: title + " — تجريبي محلي",
    title_en: slug + " — synthetic local test",
    slug,
    summary_ar: `بيانات اختبار: ${days} أيام و${nights} ليالي سكن. راجع الغرف والخدمات المسجلة أدناه.`,
    summary_en: `Synthetic fixture: ${days} trip days and ${nights} stay nights. Review registered rooms and services.`,
    description_ar:
      "هذا برنامج اصطناعي لاختبار تطابق البطاقة والتفاصيل والخريطة؛ ليس عرضًا تجاريًا.",
    description_en:
      "Synthetic program for verifying cards, details and map consistency; not a commercial offer.",
    country_id: countryId,
    origin_city_id: city,
    travel_mode: mode,
    price_basis: basis,
    tax_status: tax,
    duration_days: days,
    duration_nights: nights,
    base_price: mode === "bus" ? 350 : 750,
    currency_code: "SAR",
    cover_media_id: cover,
    status: "draft",
    is_active: true,
    is_featured: slug === "local-fixture-bus",
    flight_inclusion: flights ? "included" : "excluded",
  });
  if (nights) {
    await add("program_hotels", {
      program_id: id,
      hotel_id: h1,
      nights: nights > 2 ? nights - 1 : nights,
      room_type_ar: "غرفة رباعية تجريبية",
      room_type_en: "Synthetic quadruple room",
      occupancy: 4,
      meal_plan_ar: "إفطار مسجل للاختبار",
      meal_plan_en: "Fixture breakfast",
      sort_order: 0,
    });
    if (nights > 2)
      await add("program_hotels", {
        program_id: id,
        hotel_id: h2,
        nights: 1,
        room_type_ar: "غرفة مزدوجة تجريبية",
        room_type_en: "Synthetic double room",
        occupancy: 2,
        sort_order: 1,
      });
  }
  if (mode === "bus")
    await add("program_transports", {
      program_id: id,
      transport_id: bus,
      is_included: true,
      pickup_name_ar: "مدينة الانطلاق المسجلة",
      pickup_name_en: "Registered origin",
      dropoff_name_ar: "مكة المكرمة",
      dropoff_name_en: "Makkah",
    });
  if (flights) {
    await add("program_flights", {
      program_id: id,
      direction: "outbound",
      airline_name_ar: "ناقل اصطناعي للاختبار",
      airline_name_en: "Synthetic test carrier",
      flight_number: "TEST01",
      departure_airport_ar: "مطار اختبار القاهرة",
      departure_airport_en: "Synthetic Cairo airport",
      arrival_airport_ar: "مطار اختبار جدة",
      arrival_airport_en: "Synthetic Jeddah airport",
      departure_at: date(15),
      arrival_at: date(15.15),
      flight_type: "direct",
    });
    await add("program_visas", {
      program_id: id,
      visa_id: visa,
      is_included: false,
    });
  }
  await add("program_inclusion_items", {
    program_id: id,
    inclusion_type: "included",
    title_ar: "الإقامة وفق الغرف المسجلة",
    title_en: "Accommodation as registered",
    sort_order: 0,
  });
  await add("program_inclusion_items", {
    program_id: id,
    inclusion_type: "excluded",
    title_ar: "الخدمات غير المذكورة",
    title_en: "Services not listed",
    sort_order: 1,
  });
  await add("program_itinerary_days", {
    program_id: id,
    day_number: 1,
    title_ar: "الوصول التجريبي",
    title_en: "Synthetic arrival",
    description_ar: "خطة وصفية للاختبار فقط",
    description_en: "Descriptive test itinerary only",
    location_ar: "مكة المكرمة",
    location_en: "Makkah",
  });
  await add("program_departures", {
    program_id: id,
    origin_city_id: city,
    start_at: date(-20),
    end_at: date(-20 + days),
    departure_timezone: countryId === sa ? "Asia/Riyadh" : "Africa/Cairo",
    capacity_total: 40,
    seats_available: 0,
    status: "closed",
    is_active: true,
  });
  if (upcoming)
    for (const offset of [15, 30])
      await add("program_departures", {
        program_id: id,
        origin_city_id: city,
        start_at: date(offset),
        end_at: date(offset + days),
        departure_timezone: countryId === sa ? "Asia/Riyadh" : "Africa/Cairo",
        capacity_total: 40,
        seats_available: 0,
        status: "scheduled",
        is_active: true,
      });
  if (published)
    await rpc("set_program_publication", {
      p_program_id: id,
      p_status: "published",
      p_is_active: true,
    });
  return id;
};
const busId = await program({
  slug: "local-fixture-bus",
  title: "عمرة حافلة من الرياض",
  countryId: sa,
  city: riyadh,
  mode: "bus",
  nights: 2,
  days: 3,
});
await program({
  slug: "local-fixture-multiple-stays",
  title: "إقامة مكة والمدينة",
  countryId: eg,
  city: cairo,
  mode: "air",
  nights: 6,
  days: 7,
  flights: true,
  basis: "per_room",
  tax: "excluded",
});
await program({
  slug: "local-fixture-no-dates",
  title: "برنامج دون مواعيد قادمة",
  countryId: sa,
  city: riyadh,
  mode: "own",
  nights: 0,
  days: 1,
  upcoming: false,
});
await program({
  slug: "local-fixture-hidden-draft",
  title: "مسودة لا تظهر للعامة",
  countryId: sa,
  city: hidden,
  mode: "own",
  nights: 0,
  days: 1,
  published: false,
  upcoming: false,
});
for (let i = 0; i < 2; i++) {
  const p = await rpc("catalogue_save_point", {
    input: {
      city_id: riyadh,
      name_ar: `نقطة تجمع اختبار ${i + 1}`,
      name_en: `Synthetic meeting point ${i + 1}`,
      latitude: 24.7 + i * 0.01,
      longitude: 46.7,
      publication_status: "published",
      address_ar: "عنوان اصطناعي للاختبار فقط",
      address_en: "Synthetic test address",
      is_active: true,
      arrival_instructions_ar: "تعليمات وصول وصفية للاختبار",
      arrival_instructions_en: "Descriptive test arrival instructions",
      contact_details: "PRIVATE FIXTURE — NOT PUBLIC",
    },
    expected_at: null,
  });
  (manifest.rows.program_meeting_points ??= []).push(p.id);
  persist();
  if (!i) {
    const dep = manifest.rows.program_departures[1];
    assert.ifError(
      (
        await client
          .from("program_departures")
          .update({ meeting_point_id: p.id })
          .eq("id", dep)
          .eq("program_id", busId)
      ).error,
    );
  }
}
await ensureArticles();
manifest.complete = true;
persist();
console.log(
  "Created isolated local visitor fixtures: SA/EG, published/draft cities, bus/no-flight, two-stay air, no-upcoming and hidden-draft programs, past/future departures, reusable meeting points and private contacts.",
);
console.log(
  "Preview /programs/local-fixture-bus and /programs/local-fixture-multiple-stays. Original intake data and production are unchanged.",
);
