import type { PublicLanguage } from "../../src/core/i18n/public-language";
import {
  priceDescription,
  type ProgramDisplayFacts,
} from "../../src/features/programs/display";
export default function ProgramPriceNote({
  language,
  facts,
  isDemo,
}: {
  language: PublicLanguage;
  facts?: ProgramDisplayFacts;
  isDemo?: boolean;
}) {
  return (
    <p className="program-price-note">
      {priceDescription(facts, language === "ar", false, isDemo)}
    </p>
  );
}
