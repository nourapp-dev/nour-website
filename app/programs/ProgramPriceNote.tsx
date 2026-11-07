import type { PublicLanguage } from "../../src/core/i18n/public-language";
import {
  priceDescription,
  type ProgramDisplayFacts,
} from "../../src/features/programs/display";
export default function ProgramPriceNote({
  language,
  facts,
}: {
  language: PublicLanguage;
  facts?: ProgramDisplayFacts;
}) {
  return (
    <p className="program-price-note">
      {priceDescription(facts, language === "ar")}
    </p>
  );
}
