import {test} from 'node:test';
import assert from 'node:assert/strict';
import {countLabel,stayNights,durationLabel} from '../src/core/i18n/counts.ts';
import {valueLabel,displayValue,visaState} from '../src/features/programs/labels.ts';

test('Arabic and English counts cover zero, singular, dual, few, many and other',()=>{
 for(const [unit,one,two,few] of [['day','يوم واحد','يومان','٣ أيام'],['night','ليلة واحدة','ليلتان','٣ ليالٍ'],['program','برنامج واحد','برنامجان','٣ برامج'],['departure','موعد واحد','موعدان','٣ مواعيد'],['city','مدينة واحدة','مدينتان','٣ مدن'],['result','نتيجة واحدة','نتيجتان','٣ نتائج']]){
  assert.equal(countLabel(1,unit,'ar'),one);assert.equal(countLabel(2,unit,'ar'),two);assert.equal(countLabel(3,unit,'ar'),few);
  for(const n of [0,6,11,99,100,102])assert.ok(countLabel(n,unit,'ar').length>0);
 }
 assert.equal(countLabel(6,'night','ar'),'٦ ليالٍ');assert.equal(countLabel(11,'program','ar'),'١١ برنامجًا');
 assert.equal(countLabel(0,'departure','ar','upcoming'),'لا توجد مواعيد قادمة منشورة');
 assert.equal(countLabel(2,'departure','ar','upcoming'),'موعدان قادمان');assert.equal(countLabel(2,'program','ar','published'),'برنامجان منشوران');
 assert.equal(stayNights(0,'ar'),'دون إقامة فندقية');assert.equal(durationLabel(1,0,'en'),'1 day · No hotel stay');
 assert.equal(countLabel(1,'program','en','published'),'1 published program');assert.equal(countLabel(2,'city','en'),'2 cities');
});
test('stored value labels translate known codes and safely handle unknown values without changing records',()=>{
 assert.equal(valueLabel('vehicle','bus','ar'),'حافلة');assert.equal(valueLabel('vehicle','coach','en'),'Coach');
 assert.equal(valueLabel('transport','hotel_haram','ar'),'من الفندق إلى الحرم');assert.equal(valueLabel('room','quadruple','ar'),'غرفة رباعية');
 assert.equal(valueLabel('vehicle','internal_new_code','ar'),'غير محدد');assert.equal(valueLabel('vehicle',undefined,'en'),'Unspecified');
 assert.equal(displayValue('room','غرفة بإطلالة مسجلة','ar'),'غرفة بإطلالة مسجلة');assert.equal(displayValue('room','DOUBLE','ar'),'غرفة مزدوجة');
});
test('visa applicability is explicit and independent of transport mode; legacy links retain their recorded inclusion',()=>{
 assert.equal(visaState(null,[]),'unspecified');assert.equal(visaState('not_applicable',[]),'not_applicable');
 assert.equal(visaState(null,[{isIncluded:false}]),'excluded');assert.equal(visaState(null,[{isIncluded:true}]),'included');
 assert.equal(visaState('excluded',[]),'excluded');
});
