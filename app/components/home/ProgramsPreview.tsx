"use client";
import { usePresentation } from "../../../src/features/website/usePresentation";
import Link from "next/link";
import type { Language } from "../../data/home";
import { languageHref } from "../../../src/core/i18n/public-language";
import usePublicProgramCatalog from "../../../src/features/programs/hooks/usePublicProgramCatalog";
import ProgramCard from "../../../src/features/programs/components/ProgramCard";
export default function ProgramsPreview({ language }: { language: Language }) {
  const ar = language === "ar";
  const {
    data: programs = [],
    isLoading,
    isError,
    refetch,
  } = usePublicProgramCatalog();
  const content = usePresentation().programs;
  const visible = content.ids.length
    ? content.ids
        .flatMap((id) => programs.find((p) => p.id === id) ?? [])
        .slice(0, 12)
    : programs.slice(0, 3);
  return (
    <section
      className="nr-programs-preview"
      id="programs"
      dir={ar ? "rtl" : "ltr"}
      aria-labelledby="nr-programs-title"
    >
      <div className="nr-container">
        <header>
          <div>
            <span>{ar ? "استكشف برامج العمرة" : "Explore Umrah programs"}</span>
            <h2 id="nr-programs-title">{content.title[language]}</h2>
            <p>{content.description[language]}</p>
          </div>
          <Link href={languageHref("/programs", language)}>
            {ar ? "جميع البرامج" : "All programs"}{" "}
            <span aria-hidden="true">{ar ? "←" : "→"}</span>
          </Link>
        </header>
        {isLoading ? (
          <p role="status">
            {ar ? "جارٍ تحميل البرامج…" : "Loading programs…"}
          </p>
        ) : isError ? (
          <div role="alert">
            <p>
              {ar
                ? "تعذر تحميل البرامج حاليًا."
                : "Unable to load programs right now."}
            </p>
            <button onClick={() => void refetch()}>
              {ar ? "إعادة المحاولة" : "Try again"}
            </button>
          </div>
        ) : !visible.length ? (
          <p role="status">
            {ar
              ? "لا توجد برامج منشورة حاليًا."
              : "No published programs right now."}{" "}
            <a href="#contact">{ar ? "تواصل معنا" : "Contact us"}</a>
          </p>
        ) : (
          <div className="nr-programs-grid" data-count={visible.length}>
            {visible.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .nr-programs-preview {
          padding: 80px 0;
          scroll-margin-top: 108px;
          background: var(--nr-soft, var(--nour-background));
          color: var(--nr-text, var(--nour-text-primary));
        }
        header {
          display: flex;
          gap: 24px;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        header span {
          color: var(--nr-blue, #176fe8);
          font-size: 13px;
          font-weight: 700;
        }
        h2 {
          font-size: clamp(26px, 3vw, 38px);
          margin: 12px 0;
          line-height: 1.5;
        }
        header p {
          margin: 0;
          line-height: 1.8;
        }
        header a {
          white-space: nowrap;
          color: var(--nr-blue, #176fe8);
          font-weight: 700;
        }
        .nr-programs-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 300px), 1fr)
          );
          gap: 24px;
        }
        .nr-programs-grid[data-count="1"] {
          max-width: 780px;
          margin: auto;
          grid-template-columns: minmax(0, 1fr);
        }
        .nr-programs-grid[data-count="2"] {
          max-width: 1000px;
          margin: auto;
        }
        button {
          font: inherit;
          padding: 12px 20px;
          border: 1px solid currentColor;
          border-radius: 10px;
          background: transparent;
          color: inherit;
        }
        a:focus-visible,
        button:focus-visible {
          outline: 3px solid #176fe8;
          outline-offset: 4px;
        }
        @media (max-width: 760px) {
          header {
            align-items: flex-start;
            flex-direction: column;
          }
          .nr-programs-preview {
            padding: 48px 0;
          }
        }
      `}</style>
    </section>
  );
}
