import { androidAssociation } from "../../../src/core/config/app-links";
export const dynamic = "force-dynamic";
export function GET() {
  const data = androidAssociation(process.env.NOUR_ANDROID_SHA256_CERT_FINGERPRINTS);
  return Response.json(data ?? { error: "app_links_not_configured" }, { status: data ? 200 : 404, headers: { "Cache-Control": data ? "public, max-age=300" : "no-store" } });
}
