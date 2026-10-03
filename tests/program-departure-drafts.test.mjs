import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateDepartureDrafts,
  departurePayloads,
} from "../src/features/programs/departure-drafts.ts";
import { createProgramDepartures } from "../src/features/programs/services/program-departures.service.ts";
const cities = [
  { id: "riyadh", country_id: "sa", is_active: true, deleted_at: null },
  { id: "amman", country_id: "jo", is_active: true, deleted_at: null },
];
const date = (hours) => new Date(Date.now() + hours * 3600000).toISOString();
const row = () => ({
  id: "trip1",
  originCityId: "riyadh",
  startAt: date(48),
  endAt: date(96),
  bookingDeadline: date(24),
  capacity: 40,
  status: "open",
});
test("country-city validation rejects foreign, inactive, archived, and cleared cities", () => {
  assert.equal(validateDepartureDrafts([row()], "sa", cities), null);
  assert.ok(validateDepartureDrafts([row()], "jo", cities));
  assert.ok(
    validateDepartureDrafts([{ ...row(), originCityId: "" }], "sa", cities),
  );
  assert.ok(
    validateDepartureDrafts(
      [row()],
      "sa",
      cities.map((c) => ({ ...c, is_active: false })),
    ),
  );
  assert.ok(
    validateDepartureDrafts(
      [row()],
      "sa",
      cities.map((c) => ({ ...c, deleted_at: date(-1) })),
    ),
  );
});
test("draft program can omit departures and one program can have multiple cities", () => {
  assert.equal(validateDepartureDrafts([], "sa", []), null);
  assert.equal(
    validateDepartureDrafts(
      [row(), { ...row(), id: "trip2", originCityId: "jeddah" }],
      "sa",
      [...cities, { ...cities[0], id: "jeddah" }],
    ),
    null,
  );
});
test("reject invalid chronology, capacity and duplicate city/date before writing", () => {
  for (const patch of [
    { startAt: "" },
    { startAt: date(-1) },
    { endAt: date(1) },
    { bookingDeadline: date(72) },
    { bookingDeadline: date(-1) },
    { capacity: 0 },
    { capacity: 2.5 },
    { capacity: NaN },
    { status: "bad" },
  ])
    assert.ok(validateDepartureDrafts([{ ...row(), ...patch }], "sa", cities));
  const item = row();
  assert.ok(
    validateDepartureDrafts([item, { ...item, id: "trip2" }], "sa", cities),
  );
});
test("departure payload preserves city, date, availability and nullable optional dates", () => {
  const item = row();
  const payload = departurePayloads([
    { ...item, endAt: "", bookingDeadline: "" },
  ])[0];
  assert.equal(payload.origin_city_id, "riyadh");
  assert.equal(payload.start_at, item.startAt);
  assert.equal(payload.capacity_total, 40);
  assert.equal(payload.seats_available, 40);
  assert.equal(payload.end_at, null);
  assert.equal(payload.booking_deadline, null);
});
test("all departures use one batch insert and program identity cannot be overridden", async () => {
  let calls = 0;
  const client = {
    from(table) {
      assert.equal(table, "program_departures");
      return {
        async insert(payload) {
          calls++;
          assert.equal(payload.length, 2);
          assert.ok(payload.every((r) => r.program_id === "program1"));
          return { error: null };
        },
      };
    },
  };
  await createProgramDepartures(client, "program1", [
    { program_id: "other" },
    {},
  ]);
  assert.equal(calls, 1);
  await createProgramDepartures(client, "program1", []);
  assert.equal(calls, 1);
});
test("failed departure insert reports failure without retrying individual rows", async () => {
  let calls = 0;
  const client = {
    from() {
      return {
        async insert() {
          calls++;
          return { error: { message: "permission denied" } };
        },
      };
    },
  };
  await assert.rejects(
    createProgramDepartures(client, "program1", [{}, {}]),
    /permission denied/,
  );
  assert.equal(calls, 1);
});
