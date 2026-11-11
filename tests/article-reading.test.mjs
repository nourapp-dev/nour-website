import assert from 'node:assert/strict';
import {test} from 'node:test';
import {toContentBlocks,readingMinutes,articleMatches} from '../src/features/articles/reading.ts';
test('recognises the live plain-text editorial subheads without converting complete short sentences',()=>{
 const prose='احتفظ بتفاصيل الحجز واسم الفندق وموعد الدخول والخروج ومعلومات وسيلة النقل. راجع نقطة الالتقاء أو المطار الصحيح، ولا تعتمد على اسم المدينة وحده.';
 const blocks=toContentBlocks('اجمع معلومات الرحلة في مكان واحد\n\n'+prose+'\n\nهذه جملة مكتملة.\n\n'+prose+'\n\nاجمع معلومات الرحلة في مكان واحد\n\n'+prose);
 assert.deepEqual(blocks.map(b=>b.type),['heading','paragraph','paragraph','paragraph','heading','paragraph']);
 assert.equal(new Set(blocks.map(b=>b.id)).size,blocks.length);
});
test('renders Markdown headings, lists and hostile text as inert blocks with stable anchors',()=>{
 const blocks=toContentBlocks('## Before departure\nBring your documents.\n\n- Passport\n- Phone\n\n1. Check time\n2. Confirm transport\n\n<script>alert(1)</script>');
 assert.equal(blocks[0].type,'heading');assert.equal(blocks[0].text,'Before departure');
 assert.equal(blocks[1].text,'Bring your documents.');assert.equal(blocks[2].type,'list');assert.equal(blocks[2].ordered,false);assert.equal(blocks[3].ordered,true);assert.equal(blocks.at(-1).text,'<script>alert(1)</script>');
 assert.deepEqual(toContentBlocks(' \n\n '),[]);assert.equal(readingMinutes('word '.repeat(401)),3);
});
test('search matches Arabic diacritics, alef variants, tags and multiple words; respects requested language',()=>{
 const a={title_ar:'الاستعداد لرحلة العمرة',title_en:'Prepare for Umrah',excerpt_ar:'إرشادات السفر',excerpt_en:'Travel tips',tags:['حقيبة السفر']};
 assert.equal(articleMatches(a,'إسْتِعْداد عُمْرَة','ar'),true);assert.equal(articleMatches(a,'حقيبة','ar'),true);assert.equal(articleMatches(a,'TRAVEL umrah','en'),true);assert.equal(articleMatches(a,'Prepare','ar'),false);assert.equal(articleMatches(a,'فندق','ar'),false);assert.equal(articleMatches(a,'','ar'),true);
});
