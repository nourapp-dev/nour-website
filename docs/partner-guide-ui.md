# Digital partner guide reader

Updated locally on 7 November 2026. No publication, merge, migration, Laravel
connection or change to the partnership application form is part of this update.

## Source and release integrity

The unchanged bilingual JSON remains the authoritative source for all ten
sections, their IDs, paragraph text, headings, 48 readiness labels, tables,
requirement codes and declaration. Existing IDs start/profile/legal/finance/
payments/tech/market/country/verify/submit are retained, so older links work.
Arabic remains version 1.1 dated 6 November 2026. The existing approved English
source remains version 1.2 with that same date. No translation or new release
of the underlying terms was produced.

All four public PDF/Word files and their existing URLs remain unchanged. Existing
SHA-256 integrity checks pass. File sizes displayed in the download center come
from filesystem stat, not estimates or external requests. Browser printing does
not overwrite or regenerate the downloadable PDFs.

## Implementation files

- app/become-a-partner/guide/page.tsx: async server entry; query-language parsing,
  localized title/description/alternates, local-preview noindex and actual file sizes.
  Complete text and matching downloads are rendered in initial server HTML.
- app/become-a-partner/guide/GuideReader.tsx: progressive browser interactions,
  grouped navigation, mobile native details menu, current-section tracking,
  search/results, temporary result highlighting, copy feedback, language retention,
  download center and print action. Clipboard rejection is reported honestly.
- app/become-a-partner/guide/guide.module.css: scoped reading layout, sticky offsets,
  typography, explicit light/dark tokens, responsive table cards and print rules.
- src/features/applications/guide-reading.ts: Arabic-aware search normalization and
  original-character offsets, search indexing from the source, grouped section IDs,
  source-referenced summaries and bilingual interface text.
- tests/partner-guide.test.mjs: retained integrity tests, adapted SSR checks and
  exhaustive assertions that every source paragraph/label/unique table cell remains.
- tests/guide-reading.test.mjs: focused normalization, search, navigation, scroll,
  clipboard, language, keyboard mobile-menu and print-action behavior tests.

## Content presentation and accessibility

Source summaries quote existing source sentences and link to the relevant block.
No new legal/financial requirements, reviewers or approval authority are invented.
All original content is open; preparation fields are plain reading lists, not
inactive inputs, completion checkboxes or approval indicators. Notices have text
labels. The declaration remains readable, with an instruction to complete the
Word template rather than an online signature/consent control.

Tables retain headings and row relationships. Below 600px a labeled definition-list
card represents each row; CSS display:none excludes the alternative representation
from accessibility rendering. Print styles force the table version, repeat table
headers, remove scrolling/clipping and hide navigation/actions/search/summaries.
All source text remains available for print, including the declaration.

The sidebar is sticky on desktop. A native details menu and compact current-section
label serve smaller screens. Explicit links push a fragment only on navigation;
passive scroll changes aria-current without writing browser history. Changing
language replaces the language query and keeps the current section. Existing
fragments remain stable, with source-block fragments added for search results.

Search runs only in memory against the currently displayed language. It includes
headings, paragraphs, preparation labels and table text. Arabic marks, tatweel and
common alef variations are folded for matching; display and highlights retain the
original text. No query is sent to a service or persisted in browser storage.

## Validation and limits

- npm test: 154 passed, including partnership form, home/program and booking regressions.
- npm run quality: TypeScript passes; ESLint reports 0 errors and 26 existing
  warnings outside this update. Targeted changed-file lint passes without warnings.
- HTTP checks for ?lang=ar and ?lang=en: 200. Initial HTML contains the requested
  main language/direction, all ten sections, all source blocks, locale-specific
  downloads and local noindex metadata, without waiting for browser JavaScript.
- Tests verify every unique source paragraph, heading, label and table cell, all
  ten anchors, all four download signatures/checksums and source release versions.
- JSDOM checks Arabic normalization, table-code lookup, zero results/clear, result
  anchors/focus/highlight, passive-scroll history stability, language/section
  retention, clipboard success/failure, mobile-menu close/Escape and window.print.
- Browser access host was unavailable in this session. 390px/768px/1440px layouts,
  light/dark appearance and actual browser print pagination have NOT been visually
  verified; no desktop/mobile screenshots are available. Responsive/print CSS and
  behavioral tests do not replace those visual checks.

Preview: http://localhost:3107/become-a-partner/guide?lang=ar
