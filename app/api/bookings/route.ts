import { WEBSITE_BOOKING_ENABLED, WEBSITE_BOOKING_PAUSED_CODE } from "../../../src/core/config/website-booking";
import { getConfiguredSiteUrl } from "../../../src/core/config/site-url";
import { createClient } from "../../../src/lib/supabase/server";
import { createProgramBookingRecord } from "../../../src/features/bookings/services/program-booking.server";
import { isBookingInput } from "../../../src/features/bookings/utils/booking-input";

const reply = (body: unknown, status: number) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store" },
});

export async function POST(request: Request) {
  // Check before parsing the body, authentication, or any booking mutation.
  if (!WEBSITE_BOOKING_ENABLED) return reply({ code: WEBSITE_BOOKING_PAUSED_CODE }, 503);

  const origin = request.headers.get("origin");
  if (!origin || ![new URL(request.url).origin, new URL(getConfiguredSiteUrl()).origin].includes(origin)) {
    return reply({ code: "invalid_origin" }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return reply({ code: "invalid_booking_input" }, 415);
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 128_000) return reply({ code: "invalid_booking_input" }, 413);
    input = JSON.parse(body);
  } catch {
    return reply({ code: "invalid_booking_input" }, 400);
  }
  if (!isBookingInput(input)) return reply({ code: "invalid_booking_input" }, 400);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return reply({ code: "authentication_required" }, 401);

    // Uses the signed-in user's session, never an administrator/service-role key.
    return reply(await createProgramBookingRecord(supabase, input), 201);
  } catch (error) {
    const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
    const publicCodes = new Set([
      "authentication_required", "pilgrim_profile_required", "pilgrim_profile_incomplete",
      "passport_document_required", "insufficient_seats", "departure_not_open",
      "departure_not_available", "price_tier_not_available", "booking_not_created",
    ]);
    return reply({ code: publicCodes.has(message) ? message : "booking_not_created" }, 400);
  }
}
