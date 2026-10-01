import assert from "node:assert/strict";
import { test } from "node:test";

import { getSafeInternalPath } from "../src/core/utils/navigation.ts";
import { getErrorMessage } from "../src/core/utils/errors.ts";
import { buildBookingTravelers } from "../src/features/bookings/utils/booking-travelers.ts";

const fallback = "/account/profile";

test("login preserves an internal return path, query, and fragment", () => {
  const path = "/programs/umrah?departure=1#booking";
  assert.equal(getSafeInternalPath(path, fallback), path);
});

test("login rejects external, protocol-relative, and malformed return paths", () => {
  for (const path of [null, "", "https://example.org", "//example.org", "/\\example.org", "/\n/example.org", "javascript:alert(1)"]) {
    assert.equal(getSafeInternalPath(path, fallback), fallback, String(path));
  }
});

test("authentication and database error messages support Error and plain objects", () => {
  assert.equal(getErrorMessage(new Error("auth failed")), "auth failed");
  assert.equal(getErrorMessage({ message: "database failed", code: "23505" }), "database failed");
  for (const error of [null, undefined, 123, {}, { message: 123 }]) {
    assert.equal(getErrorMessage(error, "Try again"), "Try again");
  }
});

const profile = {
  userId: "pilgrim",
  fullName: "First Middle Last",
  phone: "",
  countryCode: "SA",
  nationalityCode: "SA",
  dateOfBirth: "1990-01-01",
  passportNumber: "TEST-PASSPORT",
  passportExpiry: "2030-01-01",
  residenceCountryCode: "SA",
  preferredLanguage: "ar",
};

test("booking prefills only the first traveler when the account arrives", () => {
  const before = buildBookingTravelers(2, null, {});
  const after = buildBookingTravelers(2, profile, {});
  assert.equal(before[0].firstName, "");
  assert.equal(after[0].firstName, "First");
  assert.equal(after[0].lastName, "Middle Last");
  assert.equal(after[0].passportNumber, profile.passportNumber);
  assert.equal(after[1].firstName, "");
  assert.equal(after[1].passportNumber, "");
});

test("booking preserves typed and deliberately cleared fields during profile refresh", () => {
  const edits = { 0: { firstName: "Edited", passportNumber: "" }, 1: { firstName: "Companion" } };
  const travelers = buildBookingTravelers(2, profile, edits);
  assert.equal(travelers[0].firstName, "Edited");
  assert.equal(travelers[0].passportNumber, "");
  assert.equal(travelers[0].dateOfBirth, profile.dateOfBirth);
  assert.equal(travelers[1].firstName, "Companion");
  assert.deepEqual(edits, { 0: { firstName: "Edited", passportNumber: "" }, 1: { firstName: "Companion" } });
});

test("a new selection starts with the requested number of independent travelers", () => {
  const travelers = buildBookingTravelers(3, { ...profile, fullName: "First" }, {});
  assert.equal(travelers.length, 3);
  assert.equal(travelers[0].lastName, "First");
  travelers[1].firstName = "Independent";
  assert.equal(travelers[2].firstName, "");
  assert.deepEqual(buildBookingTravelers(0, profile, {}), []);
});
