import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import { JSDOM } from "jsdom";
import { loadServerModule } from "./helpers/load-server-module.mjs";
const json = name => JSON.parse(readFileSync(new URL(`../src/features/applications/data/partner-guide.${name}.json`, import.meta.url), "utf8"));
const guideModule = loadServerModule("src/features/applications/partner-guide.ts", {"./data/partner-guide.ar.json":{default:json('ar')},"./data/partner-guide.en.json":{default:json('en')}});
const reading = loadServerModule("src/features/applications/guide-reading.ts");

test("guide search folds Arabic diacritics, tatweel and alef while retaining original excerpts and offsets",()=>{
  const original="أَلْـف إِبْرَاهِيم وآفاق";
  assert.equal(reading.normalizeGuideSearch(original),"الف ابراهيم وافاق");
  const match=reading.guideMatches(original,"ابراهيم")[0];
  assert.equal(original.slice(match.start,match.end),"إِبْرَاهِيم");
  for(const language of ['ar','en']){
    const guide=guideModule.partnerGuide[language];
    const table=reading.searchGuide(guide,'L01');
    assert.equal(table.length,1);assert.equal(table[0].sectionId,'legal');assert.equal(table[0].id,'legal-block-1');
    assert.ok(table[0].excerpt.includes('L01'));
    const heading=reading.searchGuide(guide,guide.sections[1].title);assert.ok(heading.some(result=>result.id==='profile'));
    const field=guide.sections[1].blocks.find(block=>block.kind==='field');assert.ok(reading.searchGuide(guide,field.text).some(result=>result.id.startsWith('profile-block-')));
    assert.equal(reading.searchGuide(guide,'zzzz-no-match-987').length,0);assert.equal(reading.searchGuide(guide,' ').length,0);
    assert.equal(reading.searchGuide(guide,'<script>alert(1)</script>').length,0);
    for(const section of guide.sections)for(const item of reading.guideSummary(section))assert.ok(section.blocks.some(block=>block.kind!=='table'&&block.text.includes(item.text)),'Summaries are exact source excerpts, without invented responsibilities');
  }
  assert.ok(reading.searchGuide(guideModule.partnerGuide.ar,'التاشيرات').length>0);
});

test("reader supports result navigation, scroll tracking without history churn, language retention, clipboard feedback, mobile menu and print",async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:3107/become-a-partner/guide?lang=ar',pretendToBeVisual:true});
  const previous={window:globalThis.window,document:globalThis.document,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const {createRoot}=await import('react-dom/client');
  const sections=guideModule.partnerGuide.ar.sections.map(section=>section.id);let topSection=0;let scrolls=[];let frames=new Map();let frameId=0;let printed=0;let copied='';let pushes=0;let replaces=0;let shared='ar';
  window.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};window.cancelAnimationFrame=id=>frames.delete(id);
  window.matchMedia=()=>({matches:true});window.print=()=>printed++;
  Object.defineProperty(window,'innerWidth',{value:1440,writable:true});
  Object.defineProperty(window.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}},configurable:true});
  const push=window.history.pushState.bind(window.history),replace=window.history.replaceState.bind(window.history);
  window.history.pushState=(...args)=>{pushes++;push(...args);};window.history.replaceState=(...args)=>{replaces++;replace(...args);};
  window.HTMLElement.prototype.scrollIntoView=function(options){scrolls.push({id:this.id,...options});const sectionIndex=sections.findIndex(id=>this.id===id||this.id.startsWith(id+'-block-'));if(sectionIndex>=0)topSection=sectionIndex;window.dispatchEvent(new window.Event('scroll'));};
  window.HTMLElement.prototype.getBoundingClientRect=function(){const index=sections.indexOf(this.id);return {top:index<0?0:(index-topSection)*1000+108,height:this.tagName==='HEADER'?76:800,bottom:1000,left:0,right:1000,width:1000};};
  const loaded={exports:{}};
  const source=ts.transpileModule(readFileSync(new URL('../app/become-a-partner/guide/GuideReader.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText;
  const require=createRequire(import.meta.url);
  vm.runInNewContext(source,{module:loaded,exports:loaded.exports,window,document,navigator:window.navigator,URL:window.URL,console,require:name=>{
    if(name==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
    if(name==='next/image')return {__esModule:true,default:props=>React.createElement('img',{src:props.src,alt:props.alt})};
    if(name.endsWith('/i18n'))return {useLanguage:()=>({setLanguage:value=>{shared=value;}})};
    if(name.endsWith('/partner-guide'))return guideModule;
    if(name.endsWith('/guide-reading'))return reading;
    if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
    return require(name);
  }});
  const root=createRoot(document.getElementById('root'));
  const click=async element=>{assert.ok(element);await act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true,button:0})));};
  const flush=async()=>{await act(async()=>{const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback();});};
  const search=async value=>{await act(async()=>{const input=document.getElementById('guide-search');Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new window.Event('input',{bubbles:true}));});};
  try{
    await act(async()=>root.render(React.createElement(loaded.exports.default,{initialLanguage:'ar',fileSizes:{ar:{pdf:186074,word:259359},en:{pdf:190637,word:77397}}})));await flush();
    await search('L01');assert.equal(document.querySelectorAll('.results li').length,1);
    await click(document.querySelector('.results a'));await flush();assert.equal(window.location.hash,'#legal-block-1');assert.equal(document.activeElement.id,'legal-block-1');assert.ok(document.querySelector('#legal-block-1 mark'));assert.equal(scrolls.at(-1).behavior,'instant');assert.equal(pushes,1);
    const writes=pushes+replaces;topSection=6;window.dispatchEvent(new window.Event('scroll'));await flush();
    assert.equal(document.querySelector('.sidebar [aria-current=location]').getAttribute('href'),'#market');assert.equal(pushes+replaces,writes,'Passive scroll must not write history');
    await click(document.querySelector('.topbar a[lang=en]'));await flush();assert.equal(document.querySelector('main').lang,'en');assert.equal(document.querySelector('main').dir,'ltr');assert.equal(window.location.hash,'#market');assert.equal(shared,'en');assert.ok(document.querySelector('a[download][href*="v1.2/en/"]'));assert.equal(document.getElementById('guide-search').value,'');
    await click(document.querySelector('#market .copyButton'));assert.equal(new URL(copied).hash,'#market');assert.equal(new URL(copied).searchParams.get('lang'),'en');assert.match(document.querySelector('.toast').textContent,/copied/);
    window.navigator.clipboard.writeText=async()=>{throw new Error('Clipboard denied');};await click(document.querySelector('#legal .copyButton'));assert.match(document.querySelector('.toast').textContent,/could not be copied/);
    await search('unfindable-998877');assert.match(document.querySelector('.searchStatus').textContent,/No results/);await click(document.querySelector('.searchInput button'));assert.equal(document.getElementById('guide-search').value,'');assert.equal(document.querySelectorAll('.results li').length,0);
    const details=document.querySelector('.mobileBar details');details.open=true;await click(details.querySelector('a[href="#profile"]'));await flush();assert.equal(details.open,false);assert.equal(window.location.hash,'#profile');
    details.open=true;await act(async()=>details.querySelector('summary').dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(details.open,false);assert.equal(document.activeElement.tagName,'SUMMARY');
    await click(document.querySelector('.printAction button'));assert.equal(printed,1);
    replace(null,'','?lang=ar#finance');await act(async()=>window.dispatchEvent(new window.PopStateEvent('popstate')));await flush();assert.equal(document.querySelector('main').lang,'ar');assert.equal(document.querySelector('.sidebar [aria-current=location]').getAttribute('href'),'#finance');
  }finally{await act(async()=>root.unmount());globalThis.window=previous.window;globalThis.document=previous.document;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act;dom.window.close();}
});
