import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { loadServerModule } from "./helpers/load-server-module.mjs";

const countryData=JSON.parse(readFileSync(new URL('../src/features/applications/data/country-options.json',import.meta.url),'utf8'));
const mocks={"../data/country-options.json":{default:countryData}};
const util=loadServerModule('src/features/applications/utils/talent-application.ts',mocks);
const cv=loadServerModule('src/server/applications/cv-validation.server.ts',mocks);
const payload=()=>util.talentInput({...util.emptyTalentDraft,careerArea:'technology_product',opportunityType:'full_time',workMode:'remote',country:'NG',city:'Lagos',yearsOfExperience:'0',fullName:'Fixture Person',email:'FIXTURE@example.test',phoneCountry:'NG',phoneNumber:'8012345678',privacyAccepted:true,portfolioUrl:'https://example.test/work'},'e03ad97a-5052-4570-8b84-8d6c8f4a542a');
const pdf=()=>new File(['%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n'],'candidate.pdf',{type:'application/pdf'});
function docx(){
 const parts=[['[Content_Types].xml','<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],['_rels/.rels','<Relationships/>'],['word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>']];
 const local=[],central=[];let offset=0;
 const crc32=bytes=>{let value=0xffffffff;for(const byte of bytes){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;};
 for(const[name,text]of parts){const nameBytes=Buffer.from(name),raw=Buffer.from(text),content=deflateRawSync(raw),crc=crc32(raw);const l=Buffer.alloc(30);l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt16LE(8,8);l.writeUInt32LE(crc,14);l.writeUInt32LE(content.length,18);l.writeUInt32LE(raw.length,22);l.writeUInt16LE(nameBytes.length,26);local.push(l,nameBytes,content);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(content.length,20);c.writeUInt32LE(raw.length,24);c.writeUInt16LE(nameBytes.length,28);c.writeUInt32LE(offset,42);central.push(c,nameBytes);offset+=l.length+nameBytes.length+content.length;}
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(parts.length,8);end.writeUInt16LE(parts.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,directory,end]);
}
test('talent validation separates opportunity and arrangement, accepts zero and preserves every supported field',()=>{
 const input=payload();assert.equal(input.employmentType,'full_time');assert.equal(input.workMode,'remote');assert.equal(input.yearsOfExperience,0);assert.equal(input.portfolioUrl,'https://example.test/work');assert.ok(util.validTalentInput(input));
 for(const change of [{yearsOfExperience:-1},{workMode:'anywhere'},{opportunityType:'remote'},{careerArea:'unpublished vacancy'},{country:'ZZ'},{jobId:'fake-job'},{privacyAccepted:false},{portfolioUrl:'javascript:alert(1)'},{linkedinUrl:'https://notlinkedin.test'}])assert.equal(util.validTalentInput({...input,...change}),false);
 const draft={...util.emptyTalentDraft,yearsOfExperience:'-1'};assert.equal(util.validateTalentStep(1,draft).yearsOfExperience,'years');draft.yearsOfExperience='0';assert.equal(util.validateTalentStep(1,draft).yearsOfExperience,undefined);
 assert.equal(util.cvMetadataError(new File([], 'empty.pdf',{type:'application/pdf'})),'cv_size');
});
test('server validates PDF, DOC and DOCX signatures and rejects spoofed, encrypted, oversized or non-Word content',async()=>{
 assert.equal((await cv.inspectCv(pdf())).extension,'pdf');
 const ole=Buffer.concat([Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]),Buffer.alloc(64),Buffer.from('WordDocument','utf16le')]);
 assert.equal((await cv.inspectCv(new File([ole],'cv.doc',{type:'application/msword'}))).extension,'doc');
 assert.equal((await cv.inspectCv(new File([docx()],'cv.docx',{type:util.cvMimeTypes.docx}))).extension,'docx');
 for(const file of [new File(['MZ fake executable'],'spoof.pdf',{type:'application/pdf'}),new File([Buffer.alloc(util.MAX_CV_BYTES+1)],'large.pdf',{type:'application/pdf'}),new File([docx()],'wrong.pdf',{type:'application/pdf'}),new File([ole],'wrong.docx',{type:util.cvMimeTypes.docx}),new File(['PK random data'],'fake.docx',{type:util.cvMimeTypes.docx}),new File(['%PDF-1.7 no trailer'],'truncated.pdf',{type:'application/pdf'})])await assert.rejects(cv.inspectCv(file),/cv_invalid/);
 const encrypted=docx();const central=encrypted.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));encrypted.writeUInt16LE(1,central+8);await assert.rejects(cv.inspectCv(new File([encrypted],'encrypted.docx',{type:util.cvMimeTypes.docx})),/cv_invalid/);
});
function fakeClient({privateBucket=true,insertError=null,existing=null}={}){
 const state={uploads:[],removed:[],inserts:[],lookups:0};
 const client={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>{state.lookups++;return {data:existing?{id:existing}:null,error:null};}})}),insert:value=>{state.inserts.push(value);return {select:()=>({single:async()=>({data:insertError?null:{id:'00000000-0000-4000-8000-000000000001'},error:insertError})})};}}),storage:{getBucket:async()=>({data:{public:!privateBucket},error:null}),from:()=>({upload:async(path,bytes,options)=>{state.uploads.push({path,bytes,options});return {error:null};},remove:async paths=>{state.removed.push(...paths);return {error:null};}})}};
 return {client,state};
}
test('server stores preferences and private CV, trusts the database ID, cleans up failed inserts and handles retries',async()=>{
 const {registerTalentApplication}=loadServerModule('src/server/applications/job-intake.server.ts',mocks);
 let fixture=fakeClient();const result=await registerTalentApplication(fixture.client,{...payload(),status:'approved',internal_notes:'not allowed'},pdf());
 assert.equal(result.id,'00000000-0000-4000-8000-000000000001');const row=fixture.state.inserts[0];assert.equal(row.status,'new');assert.equal(row.internal_notes,undefined);assert.equal(row.work_mode,'remote');assert.equal(row.opportunity_type,'full_time');assert.equal(row.years_of_experience,0);assert.equal(row.portfolio_url,'https://example.test/work');assert.equal(row.email,'fixture@example.test');assert.match(row.cv_path,/^job-applications\/e03ad97a-/);assert.ok(!row.cv_path.includes('candidate'));assert.equal(fixture.state.uploads[0].options.upsert,false);
 fixture=fakeClient({insertError:{code:'failure'}});await assert.rejects(registerTalentApplication(fixture.client,payload(),pdf()),/not_registered/);assert.equal(fixture.state.removed.length,1);
 fixture=fakeClient({privateBucket:false});await assert.rejects(registerTalentApplication(fixture.client,payload(),pdf()),/private_storage/);assert.equal(fixture.state.uploads.length,0);
 fixture=fakeClient({existing:'00000000-0000-4000-8000-000000000001'});assert.equal((await registerTalentApplication(fixture.client,payload(),pdf())).id,'00000000-0000-4000-8000-000000000001');assert.equal(fixture.state.uploads.length,0);assert.equal(fixture.state.inserts.length,0);
 fixture=fakeClient();await registerTalentApplication(fixture.client,payload(),null);assert.equal(fixture.state.uploads.length,0);assert.equal(fixture.state.inserts[0].cv_path,null,'CV remains optional');
});
test('multipart route checks origin and body bounds, returns only safe errors and never registers malformed requests',async()=>{
 let calls=0;let failure=false;
 const api=loadServerModule('app/api/applications/join/route.ts',{...mocks,'../../../../src/server/supabase/admin':{createAdminClient:()=>({})},'../../../../src/server/applications/job-intake.server':{registerTalentApplication:async()=>{calls++;if(failure)throw new Error('candidate@example.test private backend detail');return {id:'00000000-0000-4000-8000-000000000001'};}},'../../../../src/core/config/site-url':{getConfiguredSiteUrl:()=> 'http://localhost:3107'}});
 const url='http://localhost:3107/api/applications/join';
 const request=(origin='http://localhost:3107')=>{const body=new FormData();body.append('input',JSON.stringify(payload()));body.append('cv',pdf());return new Request(url,{method:'POST',headers:{origin},body});};
 assert.equal((await api.POST(request('https://external.test'))).status,403);assert.equal(calls,0);
 assert.equal((await api.POST(new Request(url,{method:'POST',headers:{origin:'http://localhost:3107','content-type':'application/json'},body:'{}'}))).status,415);
 assert.equal((await api.POST(new Request(url,{method:'POST',headers:{origin:'http://localhost:3107','content-type':'multipart/form-data; boundary=test','content-length':String(util.MAX_CV_BYTES+64001)},body:'x'}))).status,413);
 assert.equal((await api.POST(request())).status,201);assert.equal(calls,1);failure=true;const response=await api.POST(request());assert.equal(response.status,503);const text=await response.text();assert.ok(!text.includes('candidate@example.test'));assert.match(text,/not_registered/);assert.equal(response.headers.get('cache-control'),'no-store');
});
