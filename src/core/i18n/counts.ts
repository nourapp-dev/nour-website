import type {PublicLanguage} from './public-language';
type Unit='day'|'night'|'program'|'departure'|'city'|'result';
const nouns:Record<Unit,[string,string,string,string,string,string,string]>={
 day:['يوم','يوم واحد','يومان','أيام','يومًا','يوم','day'],
 night:['ليلة','ليلة واحدة','ليلتان','ليالٍ','ليلة','ليلة','night'],
 program:['برنامج','برنامج واحد','برنامجان','برامج','برنامجًا','برنامج','program'],
 departure:['موعد','موعد واحد','موعدان','مواعيد','موعدًا','موعد','departure'],
 city:['مدينة','مدينة واحدة','مدينتان','مدن','مدينة','مدينة','city'],
 result:['نتيجة','نتيجة واحدة','نتيجتان','نتائج','نتيجة','نتيجة','result'],
};
const rules=new Intl.PluralRules('ar');
export function countLabel(value:number,unit:Unit,language:PublicLanguage,kind?:'published'|'upcoming'){
 const n=Math.max(0,Math.trunc(Number.isFinite(value)?value:0)),forms=nouns[unit];
 if(language==='en')return `${n} ${kind==='published'?'published ':kind==='upcoming'?'upcoming ':''}${n===1?forms[6]:unit==='city'?'cities':forms[6]+'s'}`;
 if(!n&&unit==='departure'&&kind==='upcoming')return 'لا توجد مواعيد قادمة منشورة';
 const category=rules.select(n),number=new Intl.NumberFormat('ar-SA').format(n);
 const label=category==='one'?forms[1]:category==='two'?forms[2]:`${number} ${forms[category==='few'?3:category==='many'?4:5]}`;
 if(!kind)return label;
 const feminine=['night','city','result'].includes(unit);
 const stem=kind==='published'?'منشور':'قادم';
 return `${label} ${category==='two'?stem+(feminine?'تان':'ان'):category==='one'?stem+(feminine?'ة':''):category==='few'?stem+'ة':stem+(feminine?'ة':'')}`;
}
export function stayNights(nights:number,language:PublicLanguage){return nights===0?(language==='ar'?'دون إقامة فندقية':'No hotel stay'):countLabel(nights,'night',language);}
export function durationLabel(days:number,nights:number,language:PublicLanguage){return `${countLabel(days,'day',language)} · ${stayNights(nights,language)}`;}
