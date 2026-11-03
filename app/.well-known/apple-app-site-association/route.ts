import { appleAssociation } from "../../../src/core/config/app-links";
export const dynamic = "force-dynamic";
export function GET() {
  const data = appleAssociation(process.env.NOUR_IOS_TEAM_ID);
  return Response.json(data ?? { error: "app_links_not_configured" }, { status: data ? 200 : 404, headers: { "Cache-Control": data ? "public, max-age=300" : "no-store" } });
}
