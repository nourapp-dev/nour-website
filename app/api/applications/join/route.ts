import { createAdminClient } from "../../../../src/server/supabase/admin";
import { registerTalentApplication } from "../../../../src/server/applications/job-intake.server";
import { MAX_CV_BYTES } from "../../../../src/features/applications/utils/talent-application";
import { getConfiguredSiteUrl } from "../../../../src/core/config/site-url";
export const runtime = "nodejs";
const MAX_BODY = MAX_CV_BYTES + 64_000;
const reply = (body: unknown, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_UI_PREVIEW === "true") return reply({ code: "preview_read_only" }, 503);
  const origin = request.headers.get("origin");
  if (!origin || ![new URL(request.url).origin, new URL(getConfiguredSiteUrl()).origin].includes(origin)) return reply({ code: "invalid_origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;")) return reply({ code: "invalid_input" }, 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY) return reply({ code: "body_too_large" }, 413);
  let input: unknown, file: File | null = null;
  try {
    const reader = request.body?.getReader(); if (!reader) return reply({ code: "invalid_input" }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > MAX_BODY) { await reader.cancel(); return reply({ code: "body_too_large" }, 413); } chunks.push(part.value); }
    const body = await new Request(request.url, { method: "POST", headers: request.headers, body: Buffer.concat(chunks) }).formData();
    const json = body.get("input"); if (typeof json !== "string" || json.length > 20_000 || body.getAll("input").length !== 1 || body.getAll("cv").length > 1) return reply({ code: "invalid_input" }, 400);
    input = JSON.parse(json);
    const cv = body.get("cv"); if (cv !== null) { if (typeof cv === "string") return reply({ code: "cv_invalid" }, 400); file = cv; }
  } catch { return reply({ code: "invalid_input" }, 400); }
  try { return reply(await registerTalentApplication(createAdminClient(), input, file), 201); }
  catch (error) { const code = error instanceof Error ? error.message : "not_registered"; return reply({ code: ["cv_invalid", "invalid_input"].includes(code) ? code : "not_registered" }, code === "cv_invalid" || code === "invalid_input" ? 400 : 503); }
}
