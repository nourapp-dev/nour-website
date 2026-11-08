import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).trim().replace(/^(["'])(.*)\1$/,'$2')];}));
assert.equal(env.NEXT_PUBLIC_SUPABASE_URL,'http://127.0.0.1:54331');
const file='.next-ui-preview/visitor-fixtures.json',manifest=JSON.parse(readFileSync(file,'utf8'));
assert.equal(manifest.complete,true);const save=()=>writeFileSync(file,JSON.stringify(manifest,null,2));
const client=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false}});
const account=JSON.parse(readFileSync('.next-ui-preview/local-admin-account.json','utf8'));
assert.ifError((await client.auth.signInWithPassword({email:account.email,password:account.password})).error);
// Mechanical image preparation only: retain the existing approved site's artwork,
// preserve its aspect ratio and add a white frame to obtain a 1600×900 test asset.
if(!manifest.polishCover){
 const image=await sharp(readFileSync('public/images/site/haram-statistics-bg.jpg')).resize(1600,900,{fit:'contain',background:'#ffffff'}).webp({quality:88}).toBuffer();
 assert.ok(image.length<=5*1024*1024);const path=`local-visitor-fixtures/${manifest.run}/haram-framed.webp`;
 assert.ifError((await client.storage.from('media').upload(path,image,{contentType:'image/webp',upsert:true})).error);
 if(!manifest.files.includes(path))manifest.files.push(path);save();
 const result=await client.from('media').insert({bucket:'media',path,file_name:'Local fixture — existing Haram artwork.webp',mime_type:'image/webp',size_bytes:image.length,width:1600,height:900,alt_ar:'أصل تعريفي من الموقع للحرم المكي؛ صورة اختبار وليست وصفًا لفندق أو خدمة',alt_en:'Existing site Haram artwork used for testing; not a depiction of a linked hotel or service'}).select('id').single();assert.ifError(result.error);
 manifest.rows.media.push(result.data.id);manifest.polishCover=result.data.id;save();
}
const programs=await client.from('programs').select('id,slug').in('id',manifest.rows.programs);assert.ifError(programs.error);
for(const p of programs.data){
 const patch=p.slug==='local-fixture-bus'?{visa_status:'not_applicable'}:p.slug==='local-fixture-multiple-stays'?{cover_media_id:manifest.polishCover,title_ar:'برنامج تجربة محلية لاختبار عنوان طويل مع إقامتين في مكة المكرمة والمدينة المنورة وغرف مختلفة',title_en:'Synthetic local programme with a deliberately long title, two stays in Makkah and Madinah, and different room occupancies'}:null;
 if(patch)assert.ifError((await client.from('programs').update(patch).eq('id',p.id)).error);
}
console.log('PASS labelled local fixtures: two distinct existing site artworks, 16:9 validated media and explicit synthetic bus visa state. Production and original assets untouched.');
