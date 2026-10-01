"use client";

import Link from "next/link";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Language } from "../../../data/home";
import { getPublicCountries, type PublicCountry } from "../../../../src/features/countries/services";
import { createClient } from "../../../../src/lib/supabase/client";
import { trackMapEvent } from "../../../../src/lib/analytics/map-events";

type Props = { language: Language };
type CountryButtonSource = "map" | "chip";

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

function getCountryName(country: PublicCountry, language: Language) {
  return language === "ar" ? country.nameAr : country.nameEn;
}

function findCountryFromButton(
  button: HTMLButtonElement,
  countries: PublicCountry[],
  language: Language,
): { country: PublicCountry; source: CountryButtonSource } | null {
  if (button.classList.contains("nr-map-program-card")) return null;

  const ariaLabel = normalize(button.getAttribute("aria-label"));
  const text = normalize(button.textContent);

  for (const country of countries) {
    const localizedName = normalize(getCountryName(country, language));
    const alternateName = normalize(language === "ar" ? country.nameEn : country.nameAr);

    if (
      ariaLabel &&
      (ariaLabel.includes(localizedName) || (alternateName && ariaLabel.includes(alternateName)))
    ) {
      return { country, source: "map" };
    }

    if (!ariaLabel && localizedName && text.startsWith(localizedName)) {
      return { country, source: "chip" };
    }
  }

  return null;
}

export default function NourWorldMapEnhancements({ language }: Props) {
  const isArabic = language === "ar";
  const supabase = useMemo(() => createClient(), []);
  const [selectedCountry, setSelectedCountry] = useState<PublicCountry | null>(null);
  const lastManualCountryInteractionAt = useRef(0);
  const lastJourneyCountryId = useRef<string | null>(null);

  const countriesQuery = useQuery({
    queryKey: ["public", "map-countries", "enhancements"],
    queryFn: () => getPublicCountries(supabase),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const countries = countriesQuery.data ?? [];

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nr-map-mobile-layout-fix");
    if (!root || countries.length === 0) return;

    const decorateCountryChips = () => {
      const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));

      for (const button of buttons) {
        if (button.getAttribute("aria-label") || button.classList.contains("nr-map-program-card")) {
          continue;
        }

        const match = findCountryFromButton(button, countries, language);
        if (!match || match.source !== "chip") continue;

        button.dataset.nrCountryId = match.country.id;
        button.dataset.nrHasPrograms = String(match.country.hasPublishedPrograms);

        if (!match.country.hasPublishedPrograms) {
          button.dataset.nrSoon = "true";
          button.dataset.nrSoonLabel = isArabic ? "قريبًا" : "Soon";
        } else {
          delete button.dataset.nrSoon;
          delete button.dataset.nrSoonLabel;
        }
      }
    };

    const readJourneyCountry = () => {
      const label = root.querySelector<HTMLElement>(".nr-map-focus-route > strong:first-child");
      if (!label) return;

      const currentName = normalize(label.textContent);
      const country = countries.find((item) => {
        const localized = normalize(getCountryName(item, language));
        const alternate = normalize(language === "ar" ? item.nameEn : item.nameAr);
        return currentName === localized || currentName === alternate;
      });

      if (!country) return;
      if (lastJourneyCountryId.current === null) {
        lastJourneyCountryId.current = country.id;
        return;
      }
      if (lastJourneyCountryId.current === country.id) return;

      const previousId = lastJourneyCountryId.current;
      lastJourneyCountryId.current = country.id;

      const isLikelyStoryAdvance = Date.now() - lastManualCountryInteractionAt.current > 1200;
      if (isLikelyStoryAdvance && previousId) {
        trackMapEvent("map_story_advanced", {
          countryId: country.id,
          countryIso2: country.iso2,
          source: "story",
          hasPrograms: country.hasPublishedPrograms,
        });
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const button = target?.closest<HTMLButtonElement>("button");
      const anchor = target?.closest<HTMLAnchorElement>("a");

      if (button && root.contains(button)) {
        const countryMatch = findCountryFromButton(button, countries, language);

        if (countryMatch) {
          const togglingOff = button.getAttribute("aria-pressed") === "true";
          lastManualCountryInteractionAt.current = Date.now();

          if (togglingOff) {
            setSelectedCountry(null);
          } else {
            setSelectedCountry(countryMatch.country);
            trackMapEvent("map_country_selected", {
              countryId: countryMatch.country.id,
              countryIso2: countryMatch.country.iso2,
              source: countryMatch.source,
              hasPrograms: countryMatch.country.hasPublishedPrograms,
            });

            if (!countryMatch.country.hasPublishedPrograms) {
              trackMapEvent("map_country_without_programs", {
                countryId: countryMatch.country.id,
                countryIso2: countryMatch.country.iso2,
                source: countryMatch.source,
                hasPrograms: false,
              });
            }
          }

          return;
        }

        if (button.classList.contains("nr-map-program-card")) {
          window.setTimeout(() => {
            const programLink = root.querySelector<HTMLAnchorElement>(
              '.nr-map-focus-program a[href^="/programs/"]',
            );
            const href = programLink?.getAttribute("href") ?? "";
            const programSlug = href.startsWith("/programs/")
              ? href.slice("/programs/".length).split(/[?#]/)[0]
              : undefined;

            trackMapEvent("map_program_clicked", {
              countryId: selectedCountry?.id,
              countryIso2: selectedCountry?.iso2,
              programSlug,
              source: "program_card",
              hasPrograms: true,
            });
          }, 0);
        }
      }

      if (anchor && root.contains(anchor)) {
        const href = anchor.getAttribute("href") ?? "";

        if (href.startsWith("/programs/")) {
          trackMapEvent("map_program_clicked", {
            countryId: selectedCountry?.id,
            countryIso2: selectedCountry?.iso2,
            programSlug: href.slice("/programs/".length).split(/[?#]/)[0],
            source: "journey_card",
            hasPrograms: true,
          });
          return;
        }

        if (href === "/programs" || href.startsWith("/programs?")) {
          trackMapEvent("map_view_all_clicked", {
            countryId: selectedCountry?.id,
            countryIso2: selectedCountry?.iso2,
            source: anchor.closest(".nr-map-focus-journey") ? "journey_card" : "program_card",
            hasPrograms: selectedCountry?.hasPublishedPrograms,
          });
        }
      }
    };

    decorateCountryChips();
    readJourneyCountry();

    const observer = new MutationObserver(() => {
      decorateCountryChips();
      readJourneyCountry();
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-pressed", "class"],
    });

    root.addEventListener("click", onClick, true);

    return () => {
      observer.disconnect();
      root.removeEventListener("click", onClick, true);
    };
  }, [countries, isArabic, language, selectedCountry]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nr-map-mobile-layout-fix");
    if (!root) return;

    root.classList.toggle(
      "nr-map-has-empty-selection",
      Boolean(selectedCountry && !selectedCountry.hasPublishedPrograms),
    );

    return () => root.classList.remove("nr-map-has-empty-selection");
  }, [selectedCountry]);

  if (!selectedCountry || selectedCountry.hasPublishedPrograms) {
    return <AccessibilityAndChipStyles />;
  }

  return (
    <>
      <div className="nr-map-availability-notice" dir={isArabic ? "rtl" : "ltr"}>
        <div>
          <span>{isArabic ? "قريبًا" : "Soon"}</span>
          <strong>
            {isArabic
              ? `نعمل على إضافة برامج من ${selectedCountry.nameAr}`
              : `We are adding programs from ${selectedCountry.nameEn}`}
          </strong>
          <p>
            {isArabic
              ? "يمكنك الآن استعراض البرامج المتاحة من الدول الأخرى، وسيظهر برنامج هذه الدولة فور نشره."
              : "You can browse journeys available from other countries now. Programs for this country will appear as soon as they are published."}
          </p>
        </div>
        <Link href="/programs">
          {isArabic ? "استعرض البرامج المتاحة" : "Explore available programs"}
          <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
        </Link>
      </div>
      <AccessibilityAndChipStyles />
    </>
  );
}

function AccessibilityAndChipStyles() {
  return (
    <style jsx global>{`
      .nr-map-mobile-layout-fix button[data-nr-soon="true"]::after {
        content: attr(data-nr-soon-label);
        display: inline-grid;
        min-width: 30px;
        min-height: 18px;
        place-items: center;
        margin-inline-start: 5px;
        padding-inline: 5px;
        border-radius: 999px;
        color: rgba(255,255,255,.72);
        background: rgba(255,255,255,.08);
        font-size: 7px;
        font-weight: 900;
      }

      .nr-map-mobile-layout-fix button[aria-label^="عرض برامج"]::after,
      .nr-map-mobile-layout-fix button[aria-label^="Show programs for"]::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 44px;
        height: 44px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
      }

      .nr-map-mobile-layout-fix button[aria-label^="عرض برامج"]:focus-visible,
      .nr-map-mobile-layout-fix button[aria-label^="Show programs for"]:focus-visible,
      .nr-map-mobile-layout-fix button[data-nr-country-id]:focus-visible {
        outline: 2px solid #ffc313 !important;
        outline-offset: 4px !important;
      }

      .nr-map-has-empty-selection .nr-map-cta-disabled {
        display: none !important;
      }

      .nr-map-availability-notice {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 10px 0 0;
        padding: 14px 16px;
        border: 1px solid rgba(255,195,19,.22);
        border-radius: 18px;
        color: #fff;
        background: linear-gradient(135deg, rgba(6,28,53,.98), rgba(10,48,88,.96));
        box-shadow: 0 16px 36px rgba(0,0,0,.18);
      }

      .nr-map-availability-notice > div {
        display: grid;
        gap: 4px;
      }

      .nr-map-availability-notice > div > span {
        width: fit-content;
        padding: 4px 8px;
        border-radius: 999px;
        color: #ffc313;
        background: rgba(255,195,19,.10);
        font-size: 8px;
        font-weight: 900;
      }

      .nr-map-availability-notice strong {
        font-size: 14px;
      }

      .nr-map-availability-notice p {
        margin: 0;
        color: rgba(255,255,255,.62);
        font-size: 10px;
        line-height: 1.55;
      }

      .nr-map-availability-notice > a {
        display: inline-flex;
        flex: 0 0 auto;
        min-height: 42px;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding-inline: 14px;
        border-radius: 12px;
        color: #15365c;
        background: #ffc313;
        font-size: 9px;
        font-weight: 900;
        text-decoration: none;
      }

      @media (max-width: 760px) {
        .nr-map-availability-notice {
          align-items: stretch;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          border-radius: 15px;
        }

        .nr-map-availability-notice > a {
          width: 100%;
        }
      }
    `}</style>
  );
}
