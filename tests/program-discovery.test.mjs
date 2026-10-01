import assert from "node:assert/strict";
import { test } from "node:test";
import { getProgramCountries, matchesProgramDuration, parseProgramDuration, programSearchHref } from "../src/features/programs/utils/program-discovery.ts";

test("homepage search preserves the country and duration in a shareable URL", () => {
  const url = new URL(programSearchHref("country-sa", "medium"), "https://nour.test");
  assert.equal(url.pathname, "/programs");
  assert.equal(url.searchParams.get("country"), "country-sa");
  assert.equal(url.searchParams.get("duration"), "medium");
  assert.equal(programSearchHref("all", "all"), "/programs");
  assert.equal(programSearchHref("all", "unknown"), "/programs");
  assert.equal(new URL(programSearchHref("a&duration=long", "short"), url).searchParams.get("country"), "a&duration=long");
});

test("duration ranges meet at their boundaries without dropping or overlapping days", () => {
  for (let days = 1; days <= 20; days++) {
    assert.equal(matchesProgramDuration(days, "all"), true);
    const ranges = ["short", "medium", "long"].filter((filter) => matchesProgramDuration(days, filter));
    assert.deepEqual(ranges, [days <= 5 ? "short" : days <= 9 ? "medium" : "long"]);
  }
  for (const value of [null, "", "unexpected", "SHORT"]) assert.equal(parseProgramDuration(value), "all");
});

test("country choices come from programs, omit unnamed entries and remove duplicates", () => {
  const programs = [
    { countryId: "sa", countryNameAr: "السعودية", countryNameEn: "Saudi Arabia" },
    { countryId: "sa", countryNameAr: "السعودية", countryNameEn: "Saudi Arabia" },
    { countryId: "jo", countryNameAr: "الأردن", countryNameEn: "" },
    { countryId: "hidden", countryNameAr: "", countryNameEn: "" },
    { countryId: null, countryNameAr: "", countryNameEn: "" },
  ];
  const countries = getProgramCountries(programs, "en");
  assert.equal(countries.length, 2);
  assert.equal(countries.find((country) => country.id === "jo").name, "الأردن");
  assert.equal(countries.find((country) => country.id === "sa").name, "Saudi Arabia");
  assert.deepEqual(getProgramCountries([], "ar"), []);
});
