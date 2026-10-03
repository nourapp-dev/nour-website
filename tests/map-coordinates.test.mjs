import assert from "node:assert/strict";
import { test } from "node:test";
import { validCoordinates } from "../src/features/journeys/coordinates.ts";
import { getPublicCountries } from "../src/features/countries/services/public-countries.service.ts";
test("coordinates accept zero and reject missing, non-finite and out-of-range values", () => {
  for (const pair of [
    [0, 0],
    [-90, -180],
    [90, 180],
    ["24.7", "46.7"],
  ])
    assert.equal(validCoordinates(...pair), true);
  for (const pair of [
    [null, 0],
    ["", 0],
    [0, undefined],
    [NaN, 12],
    [91, 10],
    [0, 181],
  ])
    assert.equal(validCoordinates(...pair), false);
});
test("dashboard coordinates reach the public map unchanged, including Saudi Arabia", async () => {
  const row = {
    id: "sa",
    name_ar: "السعودية",
    name_en: "Saudi Arabia",
    iso2: "SA",
    iso3: "SAU",
    latitude: "25.123456",
    longitude: "44.987654",
    flag_media_id: null,
    sort_order: 0,
  };
  const client = {
    from(table) {
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        is() {
          return q;
        },
        not() {
          return q;
        },
        order() {
          return q;
        },
        then(resolve) {
          resolve({ data: table === "countries" ? [row] : [], error: null });
        },
      };
      return q;
    },
  };
  const countries = await getPublicCountries(client);
  assert.equal(countries[0].latitude, 25.123456);
  assert.equal(countries[0].longitude, 44.987654);
});
