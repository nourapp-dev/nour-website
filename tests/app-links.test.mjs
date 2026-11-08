import assert from "node:assert/strict";
import { test } from "node:test";
import { approvedStoreUrl, androidAssociation, appleAssociation, NOUR_APP_ENTRY } from "../src/core/config/app-links.ts";
import { createFixtureServer } from "../scripts/ui-preview.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

test("store links require a real store listing and the confirmed Android package", () => {
  assert.equal(approvedStoreUrl("https://play.google.com/store/apps/details?id=com.nourumrah.app", "googlePlay"), "https://play.google.com/store/apps/details?id=com.nourumrah.app");
  for (const value of ["", "https://play.google.com", "https://play.google.com/store/apps/details?id=other.app", "https://play.google.com.evil.test/store/apps/details?id=com.nourumrah.app", "http://play.google.com/store/apps/details?id=com.nourumrah.app"]) assert.equal(approvedStoreUrl(value, "googlePlay"), "");
  assert.equal(approvedStoreUrl("https://apps.apple.com/sa/app/example/id123456", "appStore"), "https://apps.apple.com/sa/app/example/id123456");
  assert.equal(approvedStoreUrl("https://apps.apple.com", "appStore"), "");
  assert.equal(approvedStoreUrl("https://user:password@apps.apple.com/sa/app/id123", "appStore"), "");
  assert.equal(approvedStoreUrl("https://appgallery.huawei.com/app/C1234", "appGallery"), "https://appgallery.huawei.com/app/C1234");
  assert.equal(new URL(NOUR_APP_ENTRY).pathname, "/open-app");
  assert.equal(new URL(NOUR_APP_ENTRY).search, "");
});

test("domain association stays unavailable until valid release identifiers are provided", () => {
  for (const value of [undefined, "", "debug-key", "AA:BB"]) assert.equal(androidAssociation(value), null);
  const fingerprint = Array(32).fill("AB").join(":");
  const association = androidAssociation(fingerprint);
  assert.equal(association[0].target.package_name, "com.nourumrah.app");
  assert.deepEqual(association[0].target.sha256_cert_fingerprints, [fingerprint]);
  for (const value of [undefined, "", "UNCONFIRMED", "123"]) assert.equal(appleAssociation(value), null);
  assert.deepEqual(appleAssociation("ABCD123456").applinks.details, [{ appID: "ABCD123456.com.nourumrah.app", paths: ["/open-app"] }]);
});

test("fixture mode cannot enter a production build and framing is limited to local preview", async () => {
  const source = ts.transpileModule(readFileSync(new URL("../next.config.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const load = env => {
    const loaded = { exports: {} };
    vm.runInNewContext(source, { module: loaded, exports: loaded.exports, process: { env }, URL });
    return loaded.exports.default;
  };
  assert.throws(() => load({ NODE_ENV: "production", NEXT_PUBLIC_UI_PREVIEW: "true" }), /only run in local development/);
  const production = load({ NODE_ENV: "production" });
  const preview = load({ NODE_ENV: "development", NEXT_PUBLIC_UI_PREVIEW: "true" });
  assert.equal(production.distDir, ".next"); assert.equal(preview.distDir, ".next-ui-preview");
  const productionHeaders = (await production.headers())[0].headers;
  const previewHeaders = (await preview.headers())[0].headers;
  assert.equal(productionHeaders.find(header => header.key === "X-Frame-Options").value, "DENY");
  assert.equal(previewHeaders.find(header => header.key === "X-Frame-Options").value, "SAMEORIGIN");
});

test("isolated fixture server returns success, missing, error and empty states without allowing data writes", async () => {
  const server = createFixtureServer();
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const base = "http://127.0.0.1:" + server.address().port;
  const request = (path, options) => fetch(base + path, options);
  const scenario = value => request("/__scenario?value=" + value, { method: "POST" });
  try {
    let response = await request("/rest/v1/programs?status=eq.published&is_active=eq.true&deleted_at=is.null");
    assert.equal(response.status, 200); const rows = await response.json(); assert.equal(rows.length, 3); assert.match(rows[0].title_en, /Demo/);
    assert.equal((await (await request("/rest/v1/programs?slug=eq.missing")).json()).length, 0);
    response = await request("/rest/v1/programs?slug=eq.demo-umrah-3", { headers: { accept: "application/vnd.pgrst.object+json" } });
    assert.equal((await response.json()).slug, "demo-umrah-3");
    await scenario("secondary-error");
    assert.equal((await request("/rest/v1/programs")).status, 200);
    for (const table of ["program_transports", "program_visas"]) assert.equal((await request("/rest/v1/" + table)).status, 503);
    await scenario("error"); assert.equal((await request("/rest/v1/programs")).status, 503);
    await scenario("empty"); assert.deepEqual(await (await request("/rest/v1/programs")).json(), []);
    assert.equal((await scenario("invalid")).status, 400);
    for (const method of ["POST", "PATCH", "DELETE"]) assert.equal((await request("/rest/v1/programs", { method })).status, 403);
    assert.equal((await request("/rest/v1/rpc/create_program_booking", { method: "POST" })).status, 403);
    assert.equal((await request("/__scenario?value=success", { method: "POST", headers: { origin: "https://untrusted.test" } })).status, 403);
    assert.equal((await request("/auth/v1/token", { method: "POST" })).status, 403);
    const image = await request("/storage/v1/object/public/media/cover.jpg"); assert.equal(image.headers.get("content-type"), "image/jpeg");
  } finally { server.closeAllConnections(); await new Promise(done => server.close(done)); }
});


test("home composition and original imagery remain; catalog controls stay outside home", async () => {
  const home=readFileSync(new URL('../app/HomeClient.tsx',import.meta.url),'utf8');
  const order=['<Hero','<ProgramsPreview','<Services','<NourWorldMap','<Journey','<Showcase','<WhyNour','<Statistics','<CeoMessage','<ArticlesPreview','<Payments','<CTA','<Footer'];
  assert.ok(order.every((name,i)=>i===0||home.indexOf(name)>home.indexOf(order[i-1])));
  assert.match(home,/presentation\.sections\.services\.visible/);
  assert.match(readFileSync(new URL('../app/components/home/Hero.tsx',import.meta.url),'utf8'),/src={hero.image}/);
  // Card presentation is intentionally shared; original program image sources remain.
  const programSource=readFileSync(new URL('../app/components/home/ProgramsPreview.tsx',import.meta.url),'utf8');
  assert.match(programSource,/<ProgramCard/);
  const shared=readFileSync(new URL('../src/features/programs/components/ProgramCard.tsx',import.meta.url),'utf8');assert.match(shared,/src={program.coverUrl}/);
  assert.doesNotMatch(home, /programs-shell|PublicPageShell|programs-ui.css|home-batch-two.css/);
  for (const file of ["app/ui-preview/page.tsx", "app/ui-preview/before/page.tsx"]) {
    const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
    assert.match(source, /NODE_ENV !== "development"/);
    assert.match(source, /NEXT_PUBLIC_UI_PREVIEW !== "true"/);
    assert.match(source, /notFound\(\)/);
  }
});
