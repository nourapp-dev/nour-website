import type { PublicLanguage } from "../../src/core/i18n/public-language";

export default function ProgramPriceNote({ language }: { language: PublicLanguage }) {
  return <p className="program-price-note">{language === "ar"
    ? "السعر المعروض ابتدائي. لم يُوضَّح ما إذا كان للفرد أو للغرفة، أو ما إذا كان يشمل الضريبة. راجع تفاصيل فئة السعر أو تواصل معنا قبل اتخاذ قرارك."
    : "This is a starting price. It is not specified whether it is per person or per room, or whether tax is included. Check the price tier details or contact us before deciding."}</p>;
}
