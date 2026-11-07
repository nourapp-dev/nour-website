import {QueryClient} from "@tanstack/react-query";
import {getPublicSettingsMap} from "../../src/features/settings/services/public-settings.service.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getPublicCountries } from "../../src/features/countries/services/public-countries.service.ts";
import { getJourneyCatalog } from "../../src/features/journeys/journey.service.ts";
import { defaultPresentation } from "../../src/features/website/presentation.ts";
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
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
assert.ok(
  ["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "54331",
);
process.env.NEXT_PUBLIC_SUPABASE_URL = url.origin;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  service = createClient(url.origin, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }),
  anon = createClient(url.origin, key, { auth: { persistSession: false } });
const cookies = new Map(),
  admin = createServerClient(url.origin, key, {
    cookieOptions: {
      name: `nour-${url.hostname.split(".")[0]}-admin-auth-v1`,
      secure: false,
      path: "/",
    },
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: (values) =>
        values.forEach(({ name, value }) => cookies.set(name, value)),
    },
  });
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
const rpc = async (c, name, args = {}) => {
  const r = await c.rpc(name, args);
  assert.ifError(r.error);
  return r.data;
};
const insert = async (table, value) => {
  const r = await admin.from(table).insert(value).select("id").single();
  assert.ifError(r.error);
  return r.data.id;
};
const update = async (table, id, value) =>
  assert.ifError((await admin.from(table).update(value).eq("id", id)).error);
const sql = (command) =>
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
    { input: command, stdio: ["pipe", "pipe", "pipe"], encoding: "utf8" },
  );
const ids = {
  countries: [],
  departure_cities: [],
  programs: [],
  program_meeting_points: [],
  program_departures: [],
  media: [],
};
let role,
  user,
  originalVersion,
  changedContent = false;
const run = randomUUID();
try {
  const current = await rpc(admin, "website_content_state");
  const versions = await admin
    .from("website_presentation_versions")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);
  assert.ifError(versions.error);
  originalVersion = versions.data[0].id;
  const before = await getPublicCountries(anon);
  assert.ok(Array.isArray(before));
  console.log("PASS real public empty/read contract (no fixture fallback)");
  const country = await insert("countries", {
    name_ar: "اختبار اصطناعي " + run,
    name_en: "Synthetic " + run,
    iso2: "ZZ",
    iso3: "ZZZ",
    phone_code: "+0",
    currency_code: "SAR",
    currency_name_ar: "اختبار",
    currency_name_en: "Test",
    timezone: "Etc/UTC",
    latitude: 0,
    longitude: 0,
    is_active: true,
  });
  ids.countries.push(country);
  assert.ok(!(await getPublicCountries(anon)).some((c) => c.id === country));
  await update("countries", country, {
    publication_status: "published",
    market_status: "coming_soon",
    show_public: true,
    show_on_map: true,
  });
  assert.equal(
    (await getPublicCountries(anon)).find((c) => c.id === country)
      ?.marketStatus,
    "coming_soon",
  );
  const program = await insert("programs", {
    title_ar: "برنامج اختبار " + run,
    title_en: "Synthetic program " + run,
    slug: "qa-" + run,
    summary_ar: "اختبار",
    summary_en: "Synthetic",
    description_ar: "اختبار",
    description_en: "Synthetic",
    country_id: country,
    status: "draft",
    is_active: true,
    duration_days: 1,
    duration_nights: 0,
    travel_mode: "own", price_basis: "per_person", tax_status: "included",
    base_price: 100,
    currency_code: "SAR",
    flight_inclusion: "excluded",
  });
  ids.programs.push(program);
  assert.equal(
    (await anon.from("programs").select("id").eq("id", program)).data.length,
    0,
  );
  await update("countries", country, { market_status: "browsable" });
  const city = await insert("departure_cities", {
    country_id: country,
    name_ar: "مدينة اختبار",
    name_en: "Synthetic city",
    latitude: 0,
    longitude: 0,
    timezone: "Etc/UTC",
    publication_status: "published",
    is_active: true,
  });
  ids.departure_cities.push(city);
  const fixture = JSON.parse(readFileSync(".next-ui-preview/visitor-fixtures.json", "utf8"));
  await update("programs", program, {origin_city_id:city, cover_media_id:fixture.rows.media[0]});
  await rpc(admin,"set_program_publication",{p_program_id:program,p_status:"published",p_is_active:true});
  await update("countries",country,{market_status:"coming_soon"});
  assert.equal((await anon.from("programs").select("id").eq("id",program)).data.length,0);
  await update("countries",country,{market_status:"browsable"});
  const hidden = await insert("departure_cities", {
    country_id: country,
    name_ar: "مسودة",
    name_en: "Draft city",
    latitude: 1,
    longitude: 1,
    is_active: true,
  });
  ids.departure_cities.push(hidden);
  for (let i = 0; i < 2; i++) {
    const point = await rpc(admin, "catalogue_save_point", {
      input: {
        city_id: city,
        name_ar: "نقطة " + i,
        name_en: "Synthetic point " + i,
        latitude: 0,
        longitude: i,
        publication_status: "published",
        is_active: true,
        sort_order: i,
        address_ar: "عنوان اختبار",
        address_en: "Synthetic address",
        contact_details: "PRIVATE-SYNTHETIC-" + run,
      },
      expected_at: null,
    });
    ids.program_meeting_points.push(point.id);
  }
  for (let i = 0; i < 2; i++)
    ids.program_departures.push(
      await insert("program_departures", {
        program_id: program,
        origin_city_id: city,
        meeting_point_id: ids.program_meeting_points[0],
        departure_timezone: "Etc/UTC",
        start_at: `2030-12-${10 + i}T10:00:00Z`,
        status: "scheduled",
        is_active: true,
        capacity_total: 10,
        seats_available: 0,
      }),
    );
  const catalogue = await getJourneyCatalog(anon);
  assert.deepEqual(catalogue.errors, []);
  assert.equal(
    catalogue.programs.filter((p) => p.countryId === country).length,
    1,
  );
  assert.equal(
    catalogue.departures.filter((d) => d.program_id === program).length,
    2,
  );
  assert.ok(!catalogue.cities.some((c) => c.id === hidden));
  assert.equal(
    (await getPublicCountries(anon)).find((c) => c.id === country)
      .publishedProgramsCount,
    1,
  );
  assert.ok((await anon.from("meeting_point_operations").select("*")).error);
  const publicPoints = await anon
    .from("program_meeting_points")
    .select("*")
    .eq("city_id", city);
  assert.ifError(publicPoints.error);
  assert.equal(publicPoints.data.length, 2);
  assert.ok(!JSON.stringify(publicPoints.data).includes("PRIVATE-SYNTHETIC"));
  const invalidCover = await insert("media", {
    bucket: "media",
    path: `qa-${run}.png`,
    file_name: "Synthetic invalid cover",
    mime_type: "image/png",
    size_bytes: 1024,
    width: 700,
    height: 700,
  });
  ids.media.push(invalidCover);
  assert.ok(
    (
      await admin
        .from("programs")
        .update({ cover_media_id: invalidCover })
        .eq("id", program)
    ).error,
  );
  assert.ok(
    (await anon.from("website_presentation_versions").select("id")).error,
  );
  assert.ok(
    (
      await admin
        .from("countries")
        .update({ timezone: "Not/A_Zone" })
        .eq("id", country)
    ).error,
  );
  assert.ok((await admin.from("countries").delete().eq("id", country)).error);
  console.log(
    "PASS market/publication hierarchy, reusable points, private contacts, distinct programs, zero coordinates, timezone validation and archive protection",
  );
  const roleResult = await rpc(admin, "workspace_save_role", {
    target_role: null,
    role_key: "qa_editor_" + run.replaceAll("-", "").slice(0, 12),
    name_ar: "محرر اختبار",
    name_en: "Synthetic editor",
    permission_keys: [
      "website.edit",
      "programs.read",
      "programs.update",
      "countries.read",
      "countries.create",
      "countries.update",
    ],
  });
  role = roleResult.id ?? roleResult;
  const password = "Test!" + randomBytes(20).toString("base64url"),
    email = `content-${run}@example.test`;
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ifError(created.error);
  user = created.data.user.id;
  assert.ifError(
    (
      await service.from("admin_profiles").insert({
        id: user,
        email,
        full_name: "Synthetic content editor",
        status: "active",
      })
    ).error,
  );
  assert.ifError(
    (
      await service
        .from("admin_user_roles")
        .insert({ user_id: user, role_id: role })
    ).error,
  );
  const editor = createClient(url.origin, key, {
    auth: { persistSession: false },
  });
  assert.ifError(
    (await editor.auth.signInWithPassword({ email, password })).error,
  );
  assert.equal((await editor.rpc("set_program_publication",{p_program_id:program,p_status:"published",p_is_active:true})).error?.code,"42501");
  const cache=new QueryClient();const publicQuery={queryKey:["public","platform-settings"],queryFn:()=>getPublicSettingsMap(anon),staleTime:300000};
  const cachedBefore=await cache.fetchQuery(publicQuery);
  let state = await rpc(admin, "website_content_state");
  const writeArgs = (action, content) => ({
    action,
    content,
    expected_draft: state["website.home_presentation_draft"].revision,
    expected_published: state["website.home_presentation"].revision,
  });
  const content = structuredClone(defaultPresentation);
  content.programs.ids=[program];
  content.hero.title.en = "Synthetic draft " + run;
  content.hero.title.ar = "مسودة اختبار " + run;
  content.pages.partner.title.en="Partner draft "+run;
  content.pages.careers.faqs[0].answer.en="Career FAQ draft "+run;
  content.navigation.partnerLabel.en="Partner nav "+run;
  const draftArgs = writeArgs("draft", content);
  state = await rpc(editor, "website_content_write", draftArgs);
  changedContent = true;
  assert.deepEqual(
    (await rpc(anon, "get_public_platform_settings")).find(
      (s) => s.setting_key === "website.home_presentation",
    ).value_json,
    current["website.home_presentation"].value,
  );
  assert.equal(
    (await admin.rpc("website_content_write", draftArgs)).error?.code,
    "PT409",
  );
  assert.equal(
    (await editor.rpc("website_content_write", writeArgs("publish", null)))
      .error?.code,
    "42501",
  );
  assert.equal(
    (
      await editor.rpc("update_platform_setting", {
        p_setting_key: "website.home_presentation",
        p_value_json: content,
      })
    ).error?.code,
    "42501",
  );
  assert.ok(
    (
      await editor
        .from("countries")
        .update({ publication_status: "hidden" })
        .eq("id", country)
    ).error,
  );
  const direct = await admin
    .from("platform_settings")
    .update({ value_json: content })
    .eq("setting_key", "website.home_presentation")
    .select("id");
  assert.ifError(direct.error);
  assert.equal(direct.data.length, 0);
  const legacyBypass = await editor
    .from("departure_cities")
    .insert({
      country_id: country,
      name_ar: "تجاوز اصطناعي",
      name_en: "Synthetic null bypass",
      latitude: 0,
      longitude: 0,
      is_active: true,
      publication_status: null,
    })
    .select("id");
  if (legacyBypass.data?.length)
    ids.departure_cities.push(legacyBypass.data[0].id);
  assert.ok(
    legacyBypass.error,
    "An editor must not publish by inserting a legacy NULL state",
  );
  const requestHeaders = {
    cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "),
    origin: "http://localhost:3107",
    "content-type": "application/json",
  };
  const preview = await fetch(
    "http://localhost:3107/admin/website/preview?lang=en",
    { headers: requestHeaders, redirect: "manual" },
  );
  assert.equal(preview.status, 200);
  assert.match(preview.headers.get("cache-control"), /no-store|no-cache/);
  assert.equal(preview.headers.get("surrogate-control"), "no-store");
  assert.match(preview.headers.get("x-robots-tag"), /noindex/);
  assert.match(
    preview.headers.get("content-security-policy"),
    /frame-ancestors 'self'/,
  );
  assert.ok((await preview.text()).includes(run));
  const partnerPreview=await fetch("http://localhost:3107/admin/website/preview?lang=en&page=partner",{headers:requestHeaders});
  assert.equal(partnerPreview.status,200);assert.ok((await partnerPreview.text()).includes("Partner draft "+run));
  const api = await fetch("http://localhost:3107/api/admin/website", {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({
      action: "publish",
      expectedDraft: state["website.home_presentation_draft"].revision,
      expectedPublished: state["website.home_presentation"].revision,
    }),
  });
  assert.equal(api.status, 200);
  assert.match(api.headers.get("cache-control"),/no-store/);
  assert.deepEqual(cache.getQueryData(publicQuery.queryKey),cachedBefore);
  await cache.invalidateQueries({queryKey:publicQuery.queryKey});
  assert.equal((await cache.fetchQuery(publicQuery))["website.home_presentation"].hero.title.en,content.hero.title.en);
  state = await api.json();
  assert.equal(
    state["website.home_presentation"].value.hero.title.en,
    content.hero.title.en,
  );
  const after = await admin
    .from("website_presentation_versions")
    .select("id,actor_id,created_at,operation,content")
    .order("id", { ascending: false })
    .limit(1);
  assert.ifError(after.error);
  assert.equal(state["website.home_presentation"].versionId,after.data[0].id);
  assert.equal(after.data[0].actor_id,(await admin.auth.getUser()).data.user.id);
  assert.ok(Number.isFinite(Date.parse(after.data[0].created_at)));
  assert.equal(after.data[0].operation,"publish");
  assert.deepEqual(after.data[0].content,state["website.home_presentation"].value);
  assert.ok(after.data[0].id > originalVersion);
  const mutate = await admin
    .from("website_presentation_versions")
    .delete()
    .eq("id", after.data[0].id);
  assert.ok(mutate.error);
  const restoreResponse=await fetch("http://localhost:3107/api/admin/website",{method:"POST",headers:requestHeaders,body:JSON.stringify({action:"restore",expectedDraft:state["website.home_presentation_draft"].revision,expectedPublished:state["website.home_presentation"].revision,restoreId:originalVersion})});
  assert.equal(restoreResponse.status,200);
  const restored=await restoreResponse.json();
  const restoredRow=await admin.from("website_presentation_versions").select("id,content,actor_id,created_at,operation,restored_from").eq("id",restored["website.home_presentation"].versionId).single();assert.ifError(restoredRow.error);assert.equal(restoredRow.data.operation,"restore");assert.equal(restoredRow.data.restored_from,originalVersion);assert.ok(restoredRow.data.id>after.data[0].id);assert.deepEqual(restoredRow.data.content,current["website.home_presentation"].value);
  await cache.invalidateQueries({queryKey:publicQuery.queryKey});assert.deepEqual((await cache.fetchQuery(publicQuery))["website.home_presentation"],current["website.home_presentation"].value);
  state = restored;
  changedContent = false;
  assert.deepEqual(
    state["website.home_presentation"].value,
    current["website.home_presentation"].value,
  );
  console.log(
    "PASS real Auth: isolated editor, draft privacy, conflict, publisher denial, generic/direct bypass denial, private no-store/noindex preview, Next publish/cache endpoint, immutable versions and restore-as-new",
  );
} finally {
  if (changedContent && originalVersion) {
    const state = await rpc(admin, "website_content_state");
    await rpc(admin, "website_content_write", {
      action: "restore",
      expected_draft: state["website.home_presentation_draft"].revision,
      expected_published: state["website.home_presentation"].revision,
      restore_id: originalVersion,
    });
  }
  const list = (values) => values.map((id) => `'${id}'`).join(",");
  let cleanup = "begin;";
  if (ids.program_departures.length)
    cleanup += `delete from public.program_departures where id in (${list(ids.program_departures)});`;
  if (ids.program_meeting_points.length)
    cleanup += `delete from public.meeting_point_operations where point_id in (${list(ids.program_meeting_points)});delete from public.program_meeting_points where id in (${list(ids.program_meeting_points)});`;
  for (const table of ["programs", "departure_cities", "countries", "media"])
    if (ids[table].length)
      cleanup += `delete from public.${table} where id in (${list(ids[table])});`;
  if (user)
    cleanup += `delete from public.admin_user_roles where user_id='${user}';delete from public.admin_profiles where id='${user}';`;
  if (role && typeof role === "string")
    cleanup += `delete from public.admin_audit_logs where entity_id='${role}';delete from public.role_permissions where role_id='${role}';delete from public.roles where id='${role}';`;
  sql(cleanup + "commit;");
  if (user) assert.ifError((await service.auth.admin.deleteUser(user)).error);
  console.log(
    "Removed only this run’s synthetic catalog and editor records. Published content restored; immutable publication audit retained. No credentials printed.",
  );
}
