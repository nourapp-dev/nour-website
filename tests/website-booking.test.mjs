import assert from "node:assert/strict";
import { test } from "node:test";
import { isBookingInput } from "../src/features/bookings/utils/booking-input.ts";
import { createProgramBookingRecord } from "../src/features/bookings/services/program-booking.server.ts";

const input = {
  programId: "00000000-0000-4000-8000-000000000001",
  departureId: "00000000-0000-4000-8000-000000000002",
  priceTierId: "00000000-0000-4000-8000-000000000003",
  travelersCount: 1,
  contactName: "Test Traveler",
  contactEmail: "test@example.invalid",
  preferredLanguage: "ar",
  travelers: [{ firstName: "Test", lastName: "Traveler" }],
};

test("website booking endpoint accepts the existing browser payload contract", () => {
  assert.equal(isBookingInput(input), true);
  assert.equal(isBookingInput({ ...input, contactEmail: "", contactPhone: "+966500000000" }), true);
});

test("website booking rejects malformed traveler/contact payloads before the RPC", () => {
  for (const value of [
    null, [], {}, { ...input, programId: "not-a-uuid" },
    { ...input, travelersCount: 2 }, { ...input, travelersCount: 1.5 },
    { ...input, contactEmail: "", contactPhone: "" },
    { ...input, contactPhone: { value: "unexpected" } },
    { ...input, preferredLanguage: "unknown" },
    { ...input, travelers: [null] },
    { ...input, travelers: [{ firstName: "Test", lastName: "", passportNumber: [] }] },
  ]) assert.equal(isBookingInput(value), false, JSON.stringify(value));
});

test("server-side booking keeps RPC arguments and returned amounts unchanged", async () => {
  let calls = 0;
  const result = await createProgramBookingRecord({
    async rpc(name, args) {
      calls++;
      assert.equal(name, "create_program_booking");
      assert.equal(args.p_program_id, input.programId);
      assert.equal(args.p_travelers_count, 1);
      assert.equal(args.p_contact_email, input.contactEmail);
      assert.equal(args.p_contact_phone, null);
      assert.deepEqual(args.p_travelers, [{ first_name: "Test", last_name: "Traveler", date_of_birth: null, nationality_code: null, passport_number: null }]);
      return { data: [{ booking_id: "id", booking_reference: "TEST", status: "pending_payment", reserved_until: null, total_amount: "125.50", currency_code: "SAR" }], error: null };
    },
  }, input);
  assert.equal(calls, 1);
  assert.equal(result.totalAmount, 125.5);
  assert.equal(result.bookingReference, "TEST");
});
