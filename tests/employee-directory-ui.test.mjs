import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import * as contracts from '../src/features/users/invitations.ts';
test('directory separates employees, invitations and roles; opening a legacy invite never sends email',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://nour.test/admin/users'});
 const old={window:globalThis.window,document:globalThis.document,act:globalThis.IS_REACT_ACT_ENVIRONMENT};
 globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const role={id:'r1',key:'content',name_ar:'مدير المحتوى',name_en:'Content manager',permissions:[{key:'articles.read',name_ar:'عرض المقالات',name_en:'Read articles'}]};
 const users=[{id:'self',displayName:'Manager',email:'manager@example.test',status:'active',lastLoginAt:null,roles:[{id:'r1',nameAr:'مدير المحتوى',nameEn:'Content manager'}]},{id:'legacy',displayName:'Legacy employee',email:'legacy@example.test',status:'invited',roles:[{id:'r1'}],lastLoginAt:null}];
 const require=createRequire(import.meta.url),repo=fileURLToPath(new URL('../',import.meta.url)),cache=new Map(),mutations=[];
 function load(file){
  const path=[file,file+'.tsx',file+'.ts'].find(existsSync);if(cache.has(path))return cache.get(path).exports;
  const mod={exports:{}};cache.set(path,mod);
  const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const custom=name=>{
   if(name.endsWith('core/i18n'))return {useLanguage:()=>({language:'ar'})};
   if(name.endsWith('supabase/client'))return {createClient:()=>({})};
   if(name.endsWith('WorkspaceProvider'))return {useWorkspace:()=>({superAdmin:true,permissions:['users.manage']})};
   if(name.endsWith('useUnsaved'))return {useUnsaved:()=>{}};
   if(name.endsWith('/States'))return {Loading:()=>null,Failure:()=>null};
   if(name==='@tanstack/react-query')return {useQueryClient:()=>({invalidateQueries:async()=>{}}),useMutation:()=>({isPending:false,mutate:input=>mutations.push(input)}),useQuery:({queryKey})=>({data:queryKey[0]==='admin-users'?users:queryKey[0]==='current-admin-user'?'self':queryKey[0]==='employee-invitations'?{roles:[role],invitations:[]}:{roles:[role],permissions:role.permissions},isPending:false})};
   if(name==='./services')return {getAdminUsers:()=>{},getCurrentUserId:()=>{},deleteAdminUser:()=>{},updateAdminUserAccess:()=>{}};
   if(name==='./invitations')return contracts;
   if(name.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
   if(name.startsWith('.'))return load(resolve(dirname(path),name));
   return require(name);
  };
  vm.runInNewContext(source,{module:mod,exports:mod.exports,require:custom,window:dom.window,document:dom.window.document,setInterval,clearInterval,Date,console});return mod.exports;
 }
 const Page=load(resolve(repo,'src/features/users/UsersPage.tsx')).default,root=createRoot(document.getElementById('root'));
 const click=async node=>act(async()=>node.click());
 try {
  await act(async()=>root.render(React.createElement(Page)));
  const tabs=[...document.querySelectorAll('[role=tab]')];assert.deepEqual(tabs.map(t=>t.textContent),['الموظفون','الدعوات','الأدوار والصلاحيات']);
  assert.ok(!document.getElementById('team-panel-employees').textContent.includes('legacy@example.test'));
  await click(tabs[1]);assert.ok(document.getElementById('team-panel-invitations').textContent.includes('legacy@example.test'));
  await click([...document.querySelectorAll('button')].find(b=>b.textContent==='تجهيز الدعوة'));
  const dialog=document.querySelector('dialog[open]');assert.ok(dialog);assert.equal(dialog.querySelector('input[type=email]').value,'legacy@example.test');assert.ok(dialog.textContent.includes('ملخص الصلاحيات'));assert.ok(dialog.textContent.includes('عرض المقالات'));assert.equal(mutations.length,0);
  await click(dialog.querySelector('[aria-label="إغلاق"]'));
  await click(tabs[2]);const checkbox=document.querySelector('#team-panel-roles input[type=checkbox]');await click(checkbox);assert.equal(checkbox.checked,true);
  await click(tabs[0]);await click(tabs[2]);assert.equal(document.querySelector('#team-panel-roles input[type=checkbox]').checked,true);assert.equal(mutations.length,0);
 }finally{await act(async()=>root.unmount());dom.window.close();globalThis.window=old.window;globalThis.document=old.document;globalThis.IS_REACT_ACT_ENVIRONMENT=old.act;}
});
