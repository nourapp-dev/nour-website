import { createRequire } from "node:module";
import { join } from "node:path";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const base = join(process.env.TEMP, "nour-country-directory/node_modules");
const world = require(join(base, "world-countries"));
const tz = require(join(base, "countries-and-timezones"));
const arabicCurrency = new Intl.DisplayNames(["ar"], { type: "currency" }),
  englishCurrency = new Intl.DisplayNames(["en"], { type: "currency" });
const rows = world
  .map((country) => {
    const root = country.idd.root ?? "",
      suffixes = country.idd.suffixes ?? [];
    const phoneCodes = root
      ? suffixes.length
        ? suffixes.map((suffix) => root + suffix)
        : [root]
      : [];
    const currencies = Array.isArray(country.currencies)
      ? country.currencies
      : Object.keys(country.currencies ?? {});
    return {
      iso2: country.cca2,
      iso3: country.cca3,
      nameAr: country.translations.ara?.common ?? country.name.common,
      nameEn: country.name.common,
      flag: country.flag,
      latitude: country.latlng?.[0] ?? null,
      longitude: country.latlng?.[1] ?? null,
      phoneCodes,
      primaryPhone: suffixes.length > 1 ? root : (phoneCodes[0] ?? ""),
      currencies: currencies.map((code) => ({
        code,
        ar: arabicCurrency.of(code) ?? code,
        en: englishCurrency.of(code) ?? code,
      })),
      timezones: tz.getCountry(country.cca2)?.timezones ?? [],
    };
  })
  .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
const dir = "src/features/countries/data";
mkdirSync(dir, { recursive: true });
const output = JSON.stringify(rows, null, 2) + "\n";
writeFileSync(`${dir}/directory-v1.json`, output);
writeFileSync(
  `${dir}/iana-timezones-v1.json`,
  JSON.stringify(
    Object.keys(tz.getAllTimezones({ deprecated: true })).sort(),
    null,
    2,
  ) + "\n",
);
copyFileSync(
  join(base, "world-countries/LICENSE"),
  `${dir}/LICENSE-world-countries.txt`,
);
copyFileSync(
  join(base, "countries-and-timezones/LICENSE"),
  `${dir}/LICENSE-countries-and-timezones.txt`,
);
writeFileSync(
  `${dir}/sources.json`,
  JSON.stringify(
    {
      snapshot: "nour-country-directory-v1",
      generated: "2026-11-08",
      countries: rows.length,
      sha256: createHash("sha256").update(output).digest("hex"),
      sources: [
        {
          package: "world-countries",
          version: "5.1.0",
          url: "https://github.com/mledoze/countries",
          license: "ODbL-1.0",
        },
        {
          package: "countries-and-timezones",
          version: "3.11.0",
          url: "https://github.com/manuelmhtr/countries-and-timezones",
          license: "MIT",
        },
      ],
      currencyNames: {
        provider: "Unicode CLDR via Intl.DisplayNames",
        icu: process.versions.icu,
      },
      notice:
        "Reference geography, not active Nour markets. Country and timezone arrays may have zero or multiple values. Directory data remains under its source data license.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built versioned reference data for ${rows.length} countries; no market records created.`,
);
