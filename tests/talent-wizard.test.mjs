import {defaultPresentation} from "../src/features/website/presentation.ts";
﻿import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync,existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import React,{act} from "react";
import { JSDOM } from "jsdom";

test('talent wizard preserves preferences, zero experience, files and contacts across steps/languages and failed submissions',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3107/join-us?lang=ar'});
 const previous={window:globalThis.window,document:globalThis.document,HTMLInputElement:globalThis.HTMLInputElement,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLInputElement:dom.window.HTMLInputElement,IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import('react-dom/client');const require=createRequire(import.meta.url);const repo=fileURLToPath(new URL('../',import.meta.url));const cache=new Map();let calls=[];let finish;
 class SubmissionError extends Error{constructor(code){super(code);this.code=code;}}
 function load(file){const path=[file,file+'.tsx',file+'.ts',file+'.json'].find(existsSync);if(!path)throw new Error(file);if(path.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));if(cache.has(path))return cache.get(path).exports;const mod={exports:{}};cache.set(path,mod);const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(source,{module:mod,exports:mod.exports,document,window,navigator:window.navigator,HTMLInputElement:window.HTMLInputElement,URL:window.URL,crypto:globalThis.crypto,require:name=>{
 if(name.endsWith("usePresentation"))return {usePresentation:()=>defaultPresentation};
  if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
  if(name==='next/image')return {__esModule:true,default:props=>React.createElement('img',{src:props.src,alt:props.alt})};
  if(name.endsWith('/i18n'))return {useLanguage:()=>({setLanguage:()=>{}})};
  if(name.endsWith('/services/jobApplications'))return {JobSubmissionError:SubmissionError,submitJobApplication:async(input,file)=>{calls.push({input,file});return new Promise((res,rej)=>{finish={res,rej};});}};
  if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  if(name.startsWith('.'))return load(resolve(dirname(path),name));return require(name);
 }});return mod.exports;}
 const Page=load(resolve(repo,'app/join-us/CareersPage.tsx')).default;const root=createRoot(document.getElementById('root'));
 const click=async(element)=>{assert.ok(element);await act(async()=>element.click());};
 const input=async(id,value)=>{await act(async()=>{const field=document.getElementById(id);assert.ok(field,id);const prototype=field.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:field.tagName==='SELECT'?window.HTMLSelectElement.prototype:window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(field,value);field.dispatchEvent(new window.Event('input',{bubbles:true}));field.dispatchEvent(new window.Event('change',{bubbles:true}));});};
 const attach=async file=>{await act(async()=>{const field=document.getElementById('talent-cv');Object.defineProperty(field,'files',{value:[file],configurable:true});field.dispatchEvent(new window.Event('change',{bubbles:true}));});};
 const next=()=>document.querySelector('.formActions .primaryButton');
 try{
  await act(async()=>root.render(React.createElement(Page,{initialLanguage:'ar'})));
  assert.equal(document.querySelectorAll('.areaCard').length,6);await click(next());assert.equal(document.activeElement.id,'talent-careerArea');
  await click(document.querySelector('[data-career-area=technology_product]'));assert.equal(document.getElementById('talent-careerArea').value,'technology_product');
  await input('talent-opportunityType','full_time');await input('talent-workMode','remote');await input('talent-country','نيجيريا');await click([...document.querySelectorAll('[role=option]')].find(option=>option.textContent.includes('نيجيريا')));await input('talent-city','Lagos');
  await act(async()=>document.getElementById('talent-city').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));assert.equal(calls.length,0);await click(next());
  await input('talent-yearsOfExperience','-1');await click(next());assert.equal(document.activeElement.id,'talent-yearsOfExperience');await input('talent-yearsOfExperience','0');
  await input('talent-linkedinUrl','https://linkedin.com/in/fixture');await input('talent-portfolioUrl','https://example.test/work');await input('talent-message','Fixture introduction');
  await attach(new window.File(['bad'],'image.png',{type:'image/png'}));assert.ok(document.getElementById('talent-cv-error'));await click(document.querySelector('.upload .secondaryButton'));assert.equal(document.getElementById('talent-cv-error'),null);
  await attach(new window.File([new Uint8Array(5*1024*1024+1)],'large.pdf',{type:'application/pdf'}));assert.ok(document.getElementById('talent-cv-error'));await click(document.querySelector('.upload .secondaryButton'));
  const firstFile=new window.File(['%PDF-1.7\n%%EOF'],'fixture.pdf',{type:'application/pdf'});await attach(firstFile);assert.match(document.querySelector('.file').textContent,/fixture.pdf/);
  await click(document.querySelector('.topbar button'));assert.equal(document.querySelector('main').lang,'en');assert.equal(document.getElementById('talent-yearsOfExperience').value,'0');assert.match(document.querySelector('.file').textContent,/fixture.pdf/);assert.equal(calls.length,0,'Language switch never uploads a CV');
  await attach(new window.File(['client metadata fixture'],'replacement.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));assert.match(document.querySelector('.file').textContent,/replacement.docx/);await click([...document.querySelectorAll('.file button')].find(button=>button.textContent.includes('Remove')));assert.equal(document.querySelector('.file'),null);await attach(firstFile);
  await click(next());assert.equal(document.querySelector('input[type=checkbox]').checked,false);await input('talent-fullName','Fixture Person');await input('talent-email','not-email');await input('talent-phoneCountry','GB');await input('talent-phoneNumber','7911123456');await click(next());assert.equal(document.activeElement.id,'talent-email');assert.equal(calls.length,0);await input('talent-email','fixture@example.test');
  assert.match(document.querySelector('.review').textContent,/Full-time/);assert.match(document.querySelector('.review').textContent,/Remote/);assert.match(document.querySelector('.review').textContent,/fixture.pdf/);
  await click(document.querySelector('.reviewHeading button'));assert.equal(document.getElementById('talent-workMode').value,'remote');await click(next());assert.equal(document.getElementById('talent-yearsOfExperience').value,'0');assert.match(document.querySelector('.file').textContent,/fixture.pdf/);await click(next());assert.equal(document.getElementById('talent-email').value,'fixture@example.test');
  await click(next());assert.equal(document.activeElement.id,'talent-privacyAccepted');await click(document.getElementById('talent-privacyAccepted'));
  await act(async()=>{document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));});
  assert.equal(calls.length,1);assert.equal(calls[0].input.yearsOfExperience,0);assert.equal(calls[0].input.opportunityType,'full_time');assert.equal(calls[0].input.workMode,'remote');assert.equal(calls[0].input.phone,'+447911123456');assert.equal(calls[0].file,firstFile);assert.equal(document.querySelector('.success'),null);assert.equal(document.querySelector('form').getAttribute('aria-busy'),'true');
  await act(async()=>finish.rej(new Error('fixture failure')));assert.ok(document.querySelector('[role=alert]'));assert.equal(document.getElementById('talent-fullName').value,'Fixture Person');assert.match(document.querySelector('.review').textContent,/fixture.pdf/);
  await click(next());assert.equal(calls.length,2);assert.equal(calls[1].input.submissionKey,calls[0].input.submissionKey);await act(async()=>finish.rej(new SubmissionError('cv_invalid')));assert.equal(document.activeElement.id,'talent-cv');assert.ok(document.getElementById('talent-cv-error'));
  await click([...document.querySelectorAll('.file button')].find(button=>button.textContent.includes('Remove')));await click(next());await click(next());assert.equal(calls.length,3);assert.equal(calls[2].file,null);assert.notEqual(calls[2].input.submissionKey,calls[1].input.submissionKey);
  await act(async()=>finish.res({id:'00000000-0000-4000-8000-000000000001'}));assert.match(document.querySelector('.success').textContent,/00000000-0000-4000-8000-000000000001/);assert.equal(document.querySelector('form'),null);assert.equal(document.querySelectorAll('.areaCard[aria-pressed=true]').length,0,'Draft selection resets only on confirmed success');assert.equal(window.localStorage.length,0);
 }finally{await act(async()=>root.unmount());Object.assign(globalThis,{window:previous.window,document:previous.document,HTMLInputElement:previous.HTMLInputElement,IS_REACT_ACT_ENVIRONMENT:previous.act});dom.window.close();}
});
