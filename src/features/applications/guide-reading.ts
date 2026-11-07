import type { GuideBlock, GuideDocument } from "./partner-guide";

export type GuideLanguage = "ar" | "en";
export const guideGroups = [
  { ar: "البداية وبيانات المنشأة", en: "Getting started and company details", sections: ["start", "profile"] },
  { ar: "الجاهزية النظامية والمالية", en: "Legal and financial readiness", sections: ["legal", "finance", "payments"] },
  { ar: "الجاهزية التقنية والسوقية", en: "Technology and market readiness", sections: ["tech", "market"] },
  { ar: "مراجعة الدولة والتسليم", en: "Country review and submission", sections: ["country", "verify", "submit"] },
];
export const guideBlockId = (section: string, index: number) => `${section}-block-${index}`;
export function guideBlockText(block: GuideBlock) { return block.kind === "table" ? block.rows.map(row => row.join(" · ")).join("\n") : block.text; }

// Keep original offsets so Arabic folding never changes the displayed source.
function foldedWithOffsets(value: string) {
  let folded = "";
  const starts: number[] = [], ends: number[] = [];
  let offset = 0;
  for (const character of value) {
    let replacement = character.replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "").replace(/[أإآٱ]/g, "ا").toLocaleLowerCase("en-US");
    if (/\s/.test(replacement)) replacement = folded.endsWith(" ") ? "" : " ";
    for (const part of replacement) { folded += part; starts.push(offset); ends.push(offset + character.length); }
    offset += character.length;
  }
  return { folded, starts, ends };
}
export const normalizeGuideSearch = (value: string) => foldedWithOffsets(value).folded.trim();
export function guideMatches(text: string, query: string) {
  const normalized = normalizeGuideSearch(query);
  if (normalized.length < 2) return [];
  const { folded, starts, ends } = foldedWithOffsets(text);
  const matches: { start: number; end: number }[] = [];
  let from = 0, index: number;
  while ((index = folded.indexOf(normalized, from)) >= 0) {
    matches.push({ start: starts[index], end: ends[index + normalized.length - 1] });
    from = index + normalized.length;
  }
  return matches;
}
export type GuideSearchResult = { id: string; sectionId: string; sectionTitle: string; text: string; excerpt: string };
export function searchGuide(guide: GuideDocument, query: string): GuideSearchResult[] {
  if (normalizeGuideSearch(query).length < 2) return [];
  return guide.sections.flatMap(section => {
    const entries = [{ id: section.id, text: section.title }, ...section.blocks.map((block, index) => ({ id: guideBlockId(section.id, index), text: guideBlockText(block) }))];
    return entries.flatMap(entry => {
      const match = guideMatches(entry.text, query)[0];
      if (!match) return [];
      const start = Math.max(0, match.start - 65), end = Math.min(entry.text.length, Math.max(match.end + 95, start + 170));
      return [{ ...entry, sectionId: section.id, sectionTitle: section.title, excerpt: `${start ? "…" : ""}${entry.text.slice(start, end)}${end < entry.text.length ? "…" : ""}` }];
    });
  });
}

type SummaryKey = "required" | "owner" | "evidence" | "reviewer" | "applicability";
type SourceRef = { label: SummaryKey; block: number; sentence?: number };
// References point into the unchanged source, rather than duplicating policy text.
const summaryRefs: Record<string, SourceRef[]> = {
  start: [{ label: "required", block: 8 }],
  profile: [{ label: "required", block: 0 }],
  legal: [{ label: "required", block: 0, sentence: 0 }, { label: "owner", block: 7, sentence: 0 }, { label: "reviewer", block: 7, sentence: 1 }],
  finance: [{ label: "required", block: 1, sentence: 0 }, { label: "evidence", block: 11, sentence: 0 }],
  payments: [{ label: "required", block: 0, sentence: 0 }, { label: "evidence", block: 3, sentence: 0 }],
  tech: [{ label: "required", block: 0, sentence: 0 }, { label: "owner", block: 6, sentence: 0 }],
  market: [{ label: "required", block: 1, sentence: 0 }, { label: "applicability", block: 9, sentence: 1 }],
  country: [{ label: "required", block: 0, sentence: 0 }, { label: "applicability", block: 7, sentence: 0 }],
  verify: [{ label: "required", block: 0, sentence: 0 }],
  submit: [{ label: "evidence", block: 1, sentence: 0 }],
};
export function guideSummary(section: GuideDocument["sections"][number]) {
  return (summaryRefs[section.id] ?? []).flatMap(ref => {
    const block = section.blocks[ref.block];
    if (!block || block.kind === "table") return [];
    const text = ref.sentence === undefined ? block.text : block.text.split(/(?<=\.)\s+/)[ref.sentence];
    return text ? [{ label: ref.label, text, sourceId: guideBlockId(section.id, ref.block) }] : [];
  });
}
export const guideNotices: Record<string, Record<number, "important" | "conditional" | "team">> = {
  start: { 3: "important" }, profile: { 10: "important" }, legal: { 7: "important" },
  finance: { 12: "important" }, payments: { 9: "important" }, tech: { 7: "conditional" },
  market: { 9: "important" }, country: { 7: "conditional" }, verify: { 8: "team", 12: "important" },
  submit: { 7: "important", 9: "team" },
};
export const guideInterface = {
  ar: {
    brand: "نور آب", back: "العودة إلى الشراكة", kicker: "دليل الشريك الدولي", purpose: "مرجع للمنشأة وممثّلها المفوّض لتجهيز ملف التأهيل ومراجعته قبل التعاقد والاعتماد، بحسب الدولة والنشاط الفعلي.",
    version: "الإصدار", updated: "تاريخ تحديث المحتوى", apply: "ابدأ طلب الاهتمام", download: "تنزيل الدليل", later: "يمكنك تقديم طلب اهتمام أولًا؛ تُستكمل متطلبات التأهيل لاحقًا بالتنسيق مع فريق نور آب", readOnly: "هذه الصفحة للقراءة، ومخصصة لمسار الشريك الدولي. تُسلّم المستندات الخاصة عبر القناة الآمنة المتفق عليها مع الفريق.",
    contents: "أقسام الدليل", browse: "تصفح أقسام الدليل", current: "القسم الحالي", search: "ابحث داخل الدليل", searchHint: "ابحث عن متطلب أو رمز أو موضوع، مثل L01 أو الحسابات البنكية.", searchPlaceholder: "عنوان، كلمة أو رمز متطلب…", clear: "مسح البحث", results: "نتائج البحث", count: "نتيجة", none: "لم نعثر على نتائج. جرّب كلمة أخرى أو رمز متطلب.", minimum: "اكتب حرفين على الأقل للبحث.", local: "البحث داخل هذا الدليل فقط، دون إرسال عبارتك إلى خدمة خارجية.",
    summary: "ملخص القسم", full: "النص الكامل والمتطلبات", required: "المطلوب", owner: "مسؤول التجهيز", evidence: "المستند أو دليل الإنجاز", reviewer: "جهة المراجعة", applicability: "الانطباق أو الشروط", important: "مهم", conditional: "متطلب مشروط", team: "يستكمله فريق نور آب", declaration: "الإقرار للقراءة هنا، ويُستكمل في قالب Word عند تسليم الملف؛ لا توجد موافقة أو توقيع عبر هذه الصفحة.",
    copy: "نسخ رابط القسم", copied: "تم نسخ رابط القسم", copyFailed: "تعذر النسخ. يمكنك نسخ رابط القسم من عنوان المتصفح بعد فتحه.", top: "إلى أعلى الدليل", downloads: "مركز التنزيل والطباعة", downloadHint: "اختر الصيغة المناسبة. الملفات قوالب فارغة؛ لا ترفع مستنداتك الخاصة هنا.", pdf: "للقراءة والطباعة", word: "للاستكمال والتحرير", fileLanguage: "لغة الملف", language: "العربية", print: "طباعة الدليل", printHint: "تطبع نسخة القراءة كاملة من المتصفح، دون تعديل PDF الأصلي.", blank: "يُستكمل في القالب", table: "بيانات المتطلبات", section: "القسم", skip: "انتقل إلى محتوى الدليل", temporary: "موضع نتيجة البحث", openResult: "انتقل إلى النتيجة", kb: "ك.ب", mb: "م.ب",
  },
  en: {
    brand: "Nour App", back: "Back to partnerships", kicker: "International partner guide", purpose: "A reference for organizations and their authorized representatives to prepare the qualification pack for review before contracting and approval, according to the country and actual activity.",
    version: "Version", updated: "Content updated", apply: "Start your expression of interest", download: "Download the guide", later: "You can submit an expression of interest first; qualification requirements are completed later in coordination with the Nour App team.", readOnly: "This page is for reading and covers the international partner track. Submit private documents through the secure channel agreed with the team.",
    contents: "Guide sections", browse: "Browse guide sections", current: "Current section", search: "Search this guide", searchHint: "Search by requirement, code or topic, such as L01 or bank accounts.", searchPlaceholder: "Heading, keyword or requirement code…", clear: "Clear search", results: "Search results", count: "results", none: "No results found. Try another word or a requirement code.", minimum: "Enter at least two characters to search.", local: "Search stays within this guide; your query is not sent to an external service.",
    summary: "Section at a glance", full: "Full text and requirements", required: "What is needed", owner: "Preparation owner", evidence: "Document or completion evidence", reviewer: "Reviewing party", applicability: "Applicability or conditions", important: "Important", conditional: "Conditional requirement", team: "Completed by the Nour App team", declaration: "The declaration is provided here for reading. Complete it in the Word template when submitting the pack; this page does not collect agreement or signatures.",
    copy: "Copy section link", copied: "Section link copied", copyFailed: "The link could not be copied. Open the section and copy its address from the browser.", top: "Back to the top", downloads: "Downloads and printing", downloadHint: "Choose the format you need. These are blank templates; do not upload private documents here.", pdf: "For reading and printing", word: "For completion and editing", fileLanguage: "File language", language: "English", print: "Print the guide", printHint: "Prints the complete reading version from your browser without changing the original PDF.", blank: "Complete in template", table: "Requirement details", section: "Section", skip: "Skip to guide content", temporary: "Search result location", openResult: "Go to result", kb: "KB", mb: "MB",
  },
};
