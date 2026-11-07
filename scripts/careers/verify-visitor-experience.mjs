import {
  getPublicArticles,
  getPublicArticle,
  articleCategory,
} from "../../src/features/articles/public-articles.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getPublicPrograms } from "../../src/features/programs/services/public-programs.service.ts";
import { getPublicProgramBySlug } from "../../src/features/programs/services/public-program-details.service.ts";
import {
  getJourneyCatalog,
  getJourneyMeetingPoints,
} from "../../src/features/journeys/journey.service.ts";
import {
  upcomingDepartures,
  priceDescription,
  isActualFlight,
} from "../../src/features/programs/display.ts";
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
assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, "http://127.0.0.1:54331");
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const options = { auth: { persistSession: false } },
  anon = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  ),
  admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
const account = JSON.parse(
  readFileSync(".next-ui-preview/local-admin-account.json", "utf8"),
);
assert.ifError(
  (
    await admin.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })
  ).error,
);
const rpc = async (c, name, args) => {
  const r = await c.rpc(name, args);
  assert.ifError(r.error);
  return r.data;
};
let temporary;
try {
  const programs = await getPublicPrograms(anon),
    bus = programs.find((p) => p.slug === "local-fixture-bus"),
    multi = programs.find((p) => p.slug === "local-fixture-multiple-stays"),
    noDates = programs.find((p) => p.slug === "local-fixture-no-dates");
  assert.ok(bus && multi && noDates);
  assert.ok(!programs.some((p) => p.slug === "local-fixture-hidden-draft"));
  assert.ok(programs.every((p) => !p.displayError));
  assert.equal(bus.display.travelMode, "bus");
  assert.equal(bus.display.actualFlightCount, 0);
  assert.equal(upcomingDepartures(bus.display).length, 2);
  assert.equal(bus.display.departures.length, 3);
  assert.equal(upcomingDepartures(noDates.display).length, 0);
  assert.equal(noDates.display.origins[0].id, bus.display.origins[0].id);
  assert.equal(multi.durationNights, 6);
  assert.equal(
    multi.display.stays.reduce((sum, h) => sum + h.nights, 0),
    6,
  );
  assert.deepEqual(
    multi.display.stays.map((h) => h.occupancy),
    [4, 2],
  );
  assert.match(
    priceDescription(multi.display, false),
    /per room.*Tax excluded/,
  );
  for (const program of [bus, multi, noDates]) {
    const details = await getPublicProgramBySlug(anon, program.slug);
    assert.ok(details);
    assert.deepEqual(details.sectionErrors, []);
    assert.deepEqual(details.display, program.display);
    const ready = await rpc(admin, "program_publication_readiness", {
      program_id: program.id,
    });
    assert.deepEqual(ready.errors, []);
    if (program === noDates)
      assert.ok(ready.warnings.includes("no_upcoming_departures"));
  }
  const airDetails = await getPublicProgramBySlug(anon, multi.slug);
  assert.equal(airDetails.flights.filter(isActualFlight).length, 1);
  assert.equal(
    (await getPublicProgramBySlug(anon, bus.slug)).flights.length,
    0,
  );
  assert.equal(airDetails.hotels[0].cityEn, "MAKKAH");
  const journey = await getJourneyCatalog(anon);
  assert.deepEqual(journey.errors, []);
  const origins = journey.programs.filter((p) =>
    p.display.origins.some((o) => o.id === bus.display.origins[0].id),
  );
  assert.equal(origins.length, 2);
  assert.equal(
    journey.departures.filter(
      (d) => d.origin_city_id === bus.display.origins[0].id,
    ).length,
    2,
  );
  assert.ok(journey.cities.every((c) => c.publication_status === "published"));
  const dep = journey.departures.find(
    (d) => d.program_id === bus.id && d.meeting_point_id,
  );
  const points = await getJourneyMeetingPoints(
    anon,
    bus.id,
    dep.origin_city_id,
    dep.id,
    dep.meeting_point_id,
  );
  assert.equal(points.length, 1);
  assert.ok(!JSON.stringify(points).includes("PRIVATE FIXTURE"));
  assert.ok((await anon.from("meeting_point_operations").select("*")).error);
  console.log(
    "PASS shared card/detail/map facts: bus without flights, multiple stays/rooms, stored price basis/tax, past versus future, no-upcoming program retained, unique counts, private/draft data hidden.",
  );
  const created = await admin
    .from("programs")
    .insert({
      title_ar: "مسودة اختبار مؤقتة",
      title_en: "Temporary synthetic draft",
      slug: "qa-readiness-" + randomUUID(),
      summary_ar: "اختبار",
      summary_en: "Test",
      description_ar: "اختبار",
      description_en: "Test",
      status: "draft",
      country_id: bus.countryId,
      duration_days: 3,
      duration_nights: 2,
      base_price: 0,
      currency_code: "SAR",
    })
    .select("id")
    .single();
  assert.ifError(created.error);
  temporary = created.data.id;
  const invalid = await rpc(admin, "program_publication_readiness", {
    program_id: temporary,
  });
  assert.equal(invalid.ready, false);
  for (const key of [
    "cover_required",
    "origin_city_required",
    "price_basis_required",
    "tax_status_required",
    "travel_mode_required",
    "stay_nights_mismatch",
  ])
    assert.ok(invalid.errors.includes(key));
  const rejected = await admin.rpc("set_program_publication", {
    p_program_id: temporary,
    p_status: "published",
    p_is_active: true,
  });
  assert.equal(rejected.error?.code, "23514");
  assert.ok(
    (await anon.rpc("program_publication_readiness", { program_id: temporary }))
      .error,
  );
  assert.equal((await getPublicProgramBySlug(anon,bus.slug)).visaStatus,'not_applicable');
  const testVisa=JSON.parse(readFileSync('.next-ui-preview/visitor-fixtures.json','utf8')).rows.visas[0];
  const setVisa=async(status)=>{assert.ifError((await admin.from('programs').update({visa_status:status}).eq('id',temporary)).error);return rpc(admin,'program_publication_readiness',{program_id:temporary});};
  assert.ok((await setVisa(null)).warnings.includes('visa_status_unspecified'));
  for(const status of ['included','excluded'])assert.ok((await setVisa(status)).errors.includes('visa_details_required'));
  assert.ifError((await admin.from('program_visas').insert({program_id:temporary,visa_id:testVisa,is_included:false,sort_order:0})).error);
  assert.ok(!(await setVisa('excluded')).errors.includes('visa_details_required'));
  assert.ok((await setVisa('included')).errors.includes('visa_inclusion_mismatch'));
  assert.ok((await setVisa('not_applicable')).errors.includes('visa_not_applicable_has_services'));
  assert.ifError((await admin.from('program_visas').update({is_included:true}).eq('program_id',temporary)).error);
  assert.ok(!(await setVisa('included')).errors.some(k=>k.startsWith('visa_')));
  assert.ifError((await admin.from('program_visas').delete().eq('program_id',temporary)).error);
  await setVisa(null);
  console.log('PASS real visa readiness: unknown preserved, applicable missing/contradictory details rejected, linked inclusion checked, explicit not-applicable has no linked services.');
  const flight = {
    direction: "outbound",
    airline_name_ar: "ناقل اختبار",
    airline_name_en: "Test carrier",
    departure_airport_ar: "مطار اختبار",
    departure_airport_en: "Test origin",
    arrival_airport_ar: "مطار وصول اختبار",
    arrival_airport_en: "Test destination",
    departure_at: "2030-01-01T10:00:00Z",
    arrival_at: "2030-01-01T12:00:00Z",
    flight_type: "direct",
  };
  assert.ok(
    (
      await admin
        .from("program_flights")
        .insert({ program_id: temporary, ...flight })
    ).error,
    "No broad authenticated table write grant",
  );
  assert.ok(
    (
      await anon.rpc("replace_program_flights", {
        p_program_id: temporary,
        p_flights: [flight],
      })
    ).error,
  );
  await rpc(admin, "replace_program_flights", {
    p_program_id: temporary,
    p_flights: [flight],
  });
  const original = await admin
    .from("program_flights")
    .select("id")
    .eq("program_id", temporary);
  assert.ifError(original.error);
  assert.equal(original.data.length, 1);
  assert.ok(
    (
      await admin.rpc("replace_program_flights", {
        p_program_id: temporary,
        p_flights: [{ direction: "invalid-enum" }],
      })
    ).error,
  );
  const preserved = await admin
    .from("program_flights")
    .select("id")
    .eq("program_id", temporary);
  assert.deepEqual(preserved.data, original.data);
  assert.ok(
    (
      await admin.rpc("replace_program_flights", {
        p_program_id: multi.id,
        p_flights: [],
      })
    ).error,
  );
  console.log(
    "PASS incomplete draft saved; invalid publication rejected; no direct table write grant; permission-aware flight RPC rejects anonymous/published targets and preserves prior rows on failed replacement.",
  );
  const articles = await getPublicArticles(anon);
  const own = articles.filter((a) =>
    a.slug.startsWith("local-fixture-article-"),
  );
  assert.equal(own.length, 3);
  assert.ok(
    own.every(
      (a) =>
        a.image &&
        a.imageAltEn &&
        articleCategory(a)?.slug === "local-fixture-category",
    ),
  );
  assert.equal(await getPublicArticle(anon, "local-fixture-article-4"), null);
  const article = await getPublicArticle(anon, "local-fixture-article-1");
  assert.equal(
    own.filter(
      (a) => a.id !== article.id && a.category_id === article.category_id,
    ).length,
    2,
  );
  console.log(
    "PASS real article/category/media read, stored alt, related categories and hidden draft.",
  );
  for (const key of ["privacy-policy", "terms-and-conditions"]) {
    const legal = await rpc(anon, "get_published_legal_page", { p_key: key });
    assert.equal(legal.length, 0);
  }
  console.log(
    "CONFIRMED legal blocker: empty/unpublished local approved policies; no substitute policy published.",
  );
  for (const path of [
    "/",
    "/programs",
    "/programs/" + bus.slug,
    "/programs/" + multi.slug,
    "/become-a-partner",
    "/join-us",
    "/become-a-partner/guide",
    "/articles",
    "/articles/local-fixture-article-1",
  ]) {
    const response = await fetch("http://localhost:3107" + path);
    assert.equal(response.status, 200, path);
  }
  console.log(
    "PASS local public route HTTP checks; these are not browser screenshots.",
  );
} finally {
  if (temporary)
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
      {
        input: `begin;delete from public.program_visas where program_id='${temporary}';delete from public.program_flights where program_id='${temporary}';delete from public.programs where id='${temporary}';commit;`,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  console.log(
    "Removed only temporary negative-test program. Reusable labelled local visitor fixtures remain for review.",
  );
}
