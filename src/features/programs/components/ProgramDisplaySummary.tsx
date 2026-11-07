import {durationLabel,countLabel} from "../../../core/i18n/counts";
import type { PublicProgram } from "../services/public-programs.service";
import {
  priceDescription,
  travelLabel,
  travelMode,
  upcomingDepartures,
} from "../display";
export default function ProgramDisplaySummary({
  program,
  language,
}: {
  program: PublicProgram;
  language: "ar" | "en";
}) {
  const ar = language === "ar",
    facts = program.display,
    dates = upcomingDepartures(facts);
  return (
    <section
      className="nr-program-display-summary"
      aria-label={ar ? "ملخص البرنامج" : "Program summary"}
    >
      <p>
        {facts?.origins.map((c) => (ar ? c.nameAr : c.nameEn)).join("، ")} ·{" "}
        {ar ? program.countryNameAr : program.countryNameEn}
      </p>
      <p>
        {durationLabel(program.durationDays,program.durationNights,language)} ·{" "}
        {travelLabel(travelMode(facts), ar)}
      </p>
      <p>{priceDescription(facts, ar)}</p>
      {program.displayError ? (
        <p role="alert">
          {ar
            ? "تعذر تحميل ملخص العلاقات والمواعيد."
            : "Related summary and departures could not be loaded."}
        </p>
      ) : (
        <p>
          {dates.length
            ? countLabel(dates.length,"departure",language,"upcoming")
            : ar
              ? "برنامج منشور دون مواعيد قادمة"
              : "Published program without upcoming departures"}
        </p>
      )}
    </section>
  );
}
