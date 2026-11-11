export type ContentBlock = {type: 'heading' | 'paragraph'; text: string; id: string} | {type: 'list'; items: string[]; ordered: boolean; id: string};
export function toContentBlocks(content: string): ContentBlock[] {
  const parts = content.replace(/\r\n?/g, '\n').replace(/^(#{1,6}\s+[^\n]+)\n(?!\n)/gm, '$1\n\n').replace(/\n(?=#{1,6}\s)/g,'\n\n').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return parts.flatMap((part, index): ContentBlock[] => {
    const lines = part.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length && lines.every(l => /^(?:[-*•]|\d+[.)]|[٠-٩]+[.)])\s+/.test(l)))
      return [{type: 'list', id: `section-${index}`, items: lines.map(l => l.replace(/^(?:[-*•]|\d+[.)]|[٠-٩]+[.)])\s+/, '')), ordered: /^(?:\d+|[٠-٩]+)[.)]/.test(lines[0])}];
    // Editors also use plain standalone subheads. Recognise short labels followed
    // by prose, without turning complete sentences or list items into headings.
    const heading = /^#{1,6}\s+/.test(part) || (lines.length === 1 && part.length <= 90 && !/[.!؟?؛،]$/.test(part) && !/^[-*•\d٠-٩]/.test(part) && (parts[index + 1]?.length ?? 0) > 100);
    if (!heading && /\n(?=#{1,6}\s)/.test(part)) return toContentBlocks(part.replace(/\n(?=#{1,6}\s)/g, '\n\n')).map((b,j)=>({...b,id:`section-${index}-${j}`}));
    return [{type: heading ? 'heading' : 'paragraph', text: heading ? part.replace(/^#{1,6}\s+/, '') : part, id: `section-${index}`}];
  });
}
export function readingMinutes(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/u).filter(Boolean).length / 200));
}
export function articleMatches(article: {title_ar: string; title_en: string; excerpt_ar: string | null; excerpt_en: string | null; tags?: string[]}, query: string, language: 'ar' | 'en') {
  const normalise = (v: string) => v.normalize('NFKC').toLocaleLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g,'ا');
  const text = normalise([language === 'ar' ? article.title_ar : article.title_en, language === 'ar' ? article.excerpt_ar : article.excerpt_en, ...(article.tags ?? [])].join(' '));
  return normalise(query).trim().split(/\s+/).filter(Boolean).every(word => text.includes(word));
}
