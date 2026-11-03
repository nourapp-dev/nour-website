import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { fixtureRows } from "./fixtures/public-data.mjs";

export function createFixtureServer({ siteOrigin = "http://127.0.0.1:3201" } = {}) {
  let scenario = "success";
  return createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.headers.origin && req.headers.origin !== siteOrigin) { res.writeHead(403).end(); return; }
    res.setHeader("Access-Control-Allow-Origin", siteOrigin);
    res.setHeader("Access-Control-Allow-Headers", "apikey, authorization, content-type, prefer, x-client-info, x-supabase-api-version, accept, accept-profile");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Cache-Control", "no-store");
    const json = (status, value) => { res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(value)); };
    if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
    if (url.pathname === "/__scenario" && req.method === "POST") {
      const next = url.searchParams.get("value");
      if (!["success", "loading", "error", "empty", "secondary-error"].includes(next)) { json(400, { error: "unknown_scenario" }); return; }
      scenario = next; json(200, { scenario }); return;
    }
    if (url.pathname === "/health") { json(200, { mode: "isolated-fixtures", scenario }); return; }
    if (url.pathname === "/rest/v1/rpc/get_public_platform_settings" && ["GET", "POST"].includes(req.method)) {
      json(200, [{ setting_key: "general.platform_name", value_json: "نور — معاينة محلية" }, { setting_key: "general.platform_name_en", value_json: "Nour — local preview" }]); return;
    }
    if (req.method !== "GET") { json(403, { error: "preview_read_only" }); return; }
    if (url.pathname === "/storage/v1/object/public/media/cover.jpg") {
      try { const image = await readFile(new URL("../public/images/site/haram-statistics-bg.jpg", import.meta.url)); res.writeHead(200, { "Content-Type": "image/jpeg" }).end(image); }
      catch { json(404, { error: "fixture_photo_missing" }); }
      return;
    }
    const table = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];
    if (!table) { json(404, { error: "preview_endpoint_unavailable" }); return; }
    const current = scenario;
    if (current === "error" && table === "programs" || current === "secondary-error" && ["program_transports", "program_visas", "program_meeting_points"].includes(table)) { json(503, { message: "Intentional local preview error" }); return; }
    if (current === "loading" && table === "programs") await new Promise(done => setTimeout(done, 7000));
    const rows = fixtureRows(table, url.searchParams, current);
    if (!rows) { json(404, { error: "unknown_fixture_table" }); return; }
    const single = (req.headers.accept ?? "").includes("application/vnd.pgrst.object+json");
    json(200, single ? rows[0] ?? null : rows);
  });
}

async function start() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const server = createFixtureServer();
  await new Promise((done, reject) => { server.once("error", reject); server.listen(54322, "127.0.0.1", done); });
  const child = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3201"], {
    cwd: root, stdio: "inherit", windowsHide: true,
    env: { ...process.env, NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_UI_PREVIEW: "true", NEXT_PUBLIC_WEBSITE_BOOKING_ENABLED: "false", NEXT_PUBLIC_NOUR_APP_LINKS_READY: "false", NOUR_ANDROID_SHA256_CERT_FINGERPRINTS: "", NOUR_IOS_TEAM_ID: "", NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3201", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54322", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_preview", NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_local_preview", SUPABASE_SERVICE_ROLE_KEY: "local-preview-disabled" },
  });
  child.once("exit", code => { server.close(); process.exitCode = code ?? 0; });
  child.once("error", error => { console.error(error.message); server.close(); process.exitCode = 1; });
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { child.kill(); server.close(); });
  console.log("Isolated UI preview: http://127.0.0.1:3201/ui-preview — display fixtures only; writes blocked.");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start().catch(error => { console.error(error.message); process.exitCode = 1; });
}
