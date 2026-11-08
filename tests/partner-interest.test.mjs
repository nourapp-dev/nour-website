import {defaultPresentation} from "../src/features/website/presentation.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { loadServerModule } from "./helpers/load-server-module.mjs";

const require = createRequire(import.meta.url);
const rootPath = fileURLToPath(new URL("../", import.meta.url));
const countryData = JSON.parse(readFileSync(resolve(rootPath, "src/features/applications/data/country-options.json"), "utf8"));
const formUtils = loadServerModule("src/features/applications/utils/partner-interest-form.ts", { "../data/country-options.json": { default: countryData } });

test("international form validates all steps, independent calling code, Arabic digits and all submitted fields", () => {
  const { emptyDraft, validateInterestStep, internationalPhone, toPartnerInput } = formUtils;
  assert.equal(countryData.length, 250);
  const draft = {...emptyDraft, headquartersCountry:"NG",operatingCountry:"SA",city:"Lagos",companyName:"Fixture Company",companyDescription:"Travel services",contactName:"Test Person",contactRole:"Director",email:"contact@example.test",phoneCountry:"GB",phoneNumber:"٧٩١١ ١٢٣٤٥٦",termsAccepted:true,serviceTypes:["hotel","transport"],servedCountries:["NG","SA"]};
  assert.equal(internationalPhone(draft),"+447911123456");
  for(const step of [0,1,2]) assert.equal(Object.keys(validateInterestStep(step,draft,"service_provider")).length,0);
  assert.ok(validateInterestStep(0,{...draft,serviceTypes:[]},"service_provider").serviceTypes);
  assert.ok(validateInterestStep(2,{...draft,phoneNumber:"07911123456"},"international").phoneNumber);
  assert.ok(validateInterestStep(1,{...draft,websiteUrl:"javascript:alert(1)"},"international").websiteUrl);
  assert.ok(validateInterestStep(2,{...draft,termsAccepted:false},"international").termsAccepted);
  const payload=toPartnerInput(draft,"service_provider","36086a18-c19d-487e-b12a-51d6b61447ed");
  assert.equal(payload.headquartersCountry,"NG"); assert.equal(payload.country,"SA");
  assert.deepEqual([...payload.serviceTypes],["hotel","transport"]);assert.deepEqual([...payload.servedCountries],["NG","SA"]);
  assert.equal(payload.phone,"+447911123456");assert.equal(toPartnerInput(draft,"international","key").serviceTypes.length,0);
});

test("registration sends all fields to the existing database and trusts only a server-issued reference",async()=>{
  let reply={data:"36086a18-c19d-487e-b12a-51d6b61447ed",error:null}; const calls=[];
  const api=loadServerModule("src/features/applications/services/partnerApplications.ts",{
    "../../../lib/supabase/client":{createClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return reply;}})},
  });
  const input={partnershipTrack:"service_provider",submissionKey:"36086a18-c19d-487e-b12a-51d6b61447ed",headquartersCountry:"NG",country:"SA",city:"Lagos",partnerType:"hotel",serviceTypes:["hotel","transport"],servedCountries:["NG"],companyName:"Company",companyDescription:"Test scope",contactName:"Contact",contactRole:"Director",email:"CONTACT@example.test",phone:"+2348012345678",termsAccepted:true};
  assert.equal((await api.submitPartnerApplication(input)).id,reply.data);
  assert.equal(calls[0].name,"submit_partner_interest");assert.equal(calls[0].args.input.headquarters_country,"NG");assert.deepEqual([...calls[0].args.input.service_types],["hotel","transport"]);assert.equal(calls[0].args.input.email,"contact@example.test");
  reply={data:null,error:{message:"Database unavailable"}};await assert.rejects(api.submitPartnerApplication(input),/Database unavailable/);
  reply={data:null,error:null};await assert.rejects(api.submitPartnerApplication(input),/reference/);
});

test("wizard supports keyboard validation, both tracks, language retention, review, failed retry and duplicate prevention without live writes",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:"https://nour.test/become-a-partner"});
  const previous={window:globalThis.window,document:globalThis.document,HTMLElement:globalThis.HTMLElement,HTMLInputElement:globalThis.HTMLInputElement,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,HTMLInputElement:dom.window.HTMLInputElement,IS_REACT_ACT_ENVIRONMENT:true});
  const { createRoot } = await import("react-dom/client");
  const Language=React.createContext(null); const cache=new Map();let requests=[];let finish;
  function load(file){
    const path=[file,file+".tsx",file+".ts",file+".json"].find(existsSync);if(!path)throw new Error(file);
    if(path.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
    if(cache.has(path))return cache.get(path).exports;
    const mod={exports:{}};cache.set(path,mod);
    const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    const customRequire=name=>{
 if(name.endsWith("usePresentation"))return {usePresentation:()=>defaultPresentation};
      if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
      if(name==='next/image')return {__esModule:true,default:(props)=>React.createElement('img',{src:props.src,alt:props.alt,width:props.width,height:props.height})};
      if(name.endsWith('/i18n'))return {useLanguage:()=>React.useContext(Language)};
      if(name.endsWith('/services/partnerApplications'))return {submitPartnerApplication:async payload=>{requests.push(payload);return new Promise((res,rej)=>{finish={res,rej};});}};
      if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
      if(name.startsWith('.'))return load(resolve(dirname(path),name));
      return require(name);
    };
    vm.runInNewContext(js,{module:mod,exports:mod.exports,require:customRequire,document:dom.window.document,window:dom.window,HTMLInputElement:dom.window.HTMLInputElement,crypto:globalThis.crypto,URL:globalThis.URL,console});return mod.exports;
  }
  const Page=load(resolve(rootPath,'app/become-a-partner/page.tsx')).default;
  function Harness(){const[language,setLanguage]=React.useState('ar');return React.createElement(Language.Provider,{value:{language,setLanguage}},React.createElement(Page));}
  const root=createRoot(document.getElementById('root'));
  const click=async element=>{assert.ok(element);await act(async()=>element.click());};
  const input=async(id,value)=>{await act(async()=>{const field=document.getElementById(id);assert.ok(field,id);const proto=field.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:field.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(field,value);field.dispatchEvent(new window.Event('input',{bubbles:true}));field.dispatchEvent(new window.Event('change',{bubbles:true}));});};
  const next=()=>document.querySelector('.formActions .primaryButton');
  const choose=async(id,query)=>{await input(id,query);const option=[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.includes(query));await click(option);};
  try{
    await act(async()=>root.render(React.createElement(Harness)));
    assert.equal(document.querySelectorAll('.guideCard a').length,3);
    await click(next());assert.equal(document.activeElement.id,'partner-headquartersCountry');assert.equal(requests.length,0);
    // Service providers see multiple service areas; switching back preserves scope.
    await click(document.querySelectorAll('.trackCard')[1]);assert.equal(document.querySelectorAll('input[name=serviceTypes]').length,5);
    await click(document.querySelector('input[value=hotel]'));await click(document.querySelector('input[value=transport]'));
    await choose('partner-headquartersCountry','نيجيريا');await choose('partner-operatingCountry','السعودية');await input('partner-city','Lagos');
    await act(async()=>document.getElementById('partner-city').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.equal(requests.length,0);
    await click(next());assert.ok(document.getElementById('partner-companyName'));
    await input('partner-companyName','Fixture Company');await input('partner-companyDescription','Travel and hospitality scope');await input('partner-websiteUrl','javascript:alert(1)');
    await click(next());assert.equal(document.activeElement.id,'partner-websiteUrl');await input('partner-websiteUrl','https://example.test');
    await click([...document.querySelectorAll('.topbar button')][0]);assert.equal(document.querySelector('main').lang,'en');assert.equal(document.getElementById('partner-companyName').value,'Fixture Company');
    await click(next());assert.ok(document.getElementById('partner-contactName'),document.querySelector('form').textContent);assert.equal(document.querySelector('.consent input').checked,false);
    await input('partner-contactName','Test Contact');await input('partner-contactRole','Director');await input('partner-email','contact@example.test');await input('partner-phoneCountry','GB');await input('partner-phoneNumber','7911123456');
    assert.match(document.querySelector('.review').textContent,/Fixture Company/);assert.match(document.querySelector('.review').textContent,/\+447911123456/);
    await click(document.querySelector('.reviewHeading button'));assert.ok(document.getElementById('partner-city'));assert.equal(document.querySelectorAll('input[name=serviceTypes]:checked').length,2);await click(next());assert.equal(document.getElementById('partner-companyName').value,'Fixture Company');await click(next());
    await click(next());assert.equal(requests.length,0);assert.equal(document.activeElement.id,'partner-termsAccepted');await click(document.querySelector('.consent input'));
    await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));});
    assert.equal(requests.length,1);assert.equal(document.querySelector('form').getAttribute('aria-busy'),'true');assert.equal(document.querySelector('.success'),null);
    await act(async()=>finish.rej(new Error('simulated failure')));assert.ok(document.querySelector('[role=alert]'));assert.equal(document.getElementById('partner-email').value,'contact@example.test');
    await click(next());assert.equal(requests.length,2);assert.equal(requests[1].submissionKey,requests[0].submissionKey);
    assert.equal(requests[1].headquartersCountry,'NG');assert.deepEqual([...requests[1].serviceTypes],['hotel','transport']);assert.equal(requests[1].phone,'+447911123456');
    await act(async()=>finish.res({id:'36086a18-c19d-487e-b12a-51d6b61447ed'}));assert.match(document.querySelector('.success').textContent,/36086a18-c19d-487e-b12a-51d6b61447ed/);assert.equal(document.querySelector('form'),null);
    assert.equal(window.localStorage.length,0,'No application/contact data is written to browser storage');
  }finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:previous.window,document:previous.document,HTMLElement:previous.HTMLElement,HTMLInputElement:previous.HTMLInputElement,IS_REACT_ACT_ENVIRONMENT:previous.act});dom.window.close();}
});
